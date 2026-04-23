import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { Model, Types } from "mongoose";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { CreateScenarioDto } from "./dto/create-scenario.dto.js";
import { Scenario, ScenarioDocument } from "./schemas/scenario.schema.js";

type SceneType = "electrical_panel" | "irrigation_drip" | "sprinkler" | "water_cycle" | "comparative" | "default" | "custom";

interface AnalysisResult {
  sceneType: SceneType;
  confidence: number;
  description: string;
  babylonConfig: Record<string, unknown>;
}

@Injectable()
export class ScenariosService {
  private readonly logger = new Logger(ScenariosService.name);

  constructor(
    @InjectModel(Scenario.name)
    private readonly scenarioModel: Model<ScenarioDocument>
  ) {}

  async findAll(onlyPublished = false) {
    const filter = onlyPublished ? { status: "published" } : {};
    const items = await this.scenarioModel.find(filter).sort({ createdAt: -1 }).exec();
    return items.map((s) => this.serialize(s));
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Escenario no encontrado.");
    const scenario = await this.scenarioModel.findById(id).exec();
    if (!scenario) throw new NotFoundException("Escenario no encontrado.");
    return this.serialize(scenario);
  }

  async create(dto: CreateScenarioDto, actor: AuthenticatedUser) {
    this.assertCanManage(actor);
    const existing = await this.scenarioModel.findOne({ code: dto.code.toUpperCase() }).exec();
    if (existing) throw new ConflictException("Ya existe un escenario con ese código.");

    const scenario = await this.scenarioModel.create({
      ...dto,
      code: dto.code.toUpperCase(),
      createdBy: actor.sub
    });
    return this.serialize(scenario);
  }

  async update(id: string, dto: Partial<CreateScenarioDto>, actor: AuthenticatedUser) {
    this.assertCanManage(actor);
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Escenario no encontrado.");

    if (dto.code) {
      const existing = await this.scenarioModel
        .findOne({ code: dto.code.toUpperCase(), _id: { $ne: id } })
        .exec();
      if (existing) throw new ConflictException("Ya existe un escenario con ese código.");
      dto.code = dto.code.toUpperCase();
    }

    const updated = await this.scenarioModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException("Escenario no encontrado.");
    return this.serialize(updated);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    this.assertCanManage(actor);
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Escenario no encontrado.");
    const deleted = await this.scenarioModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException("Escenario no encontrado.");
    return { message: "Escenario eliminado." };
  }

  async analyzeImage(imageUrl: string): Promise<AnalysisResult> {
    const relativePath = imageUrl.replace(/^\/uploads\//, "");
    const filePath = join(process.cwd(), "uploads", relativePath);
    let base64: string;
    try {
      const resized = await sharp(readFileSync(filePath))
        .resize(512, 512, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();
      base64 = resized.toString("base64");
    } catch {
      throw new NotFoundException("Imagen no encontrada en el servidor.");
    }

    const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    const apiKey = process.env.OLLAMA_API_KEY ?? "";
    const model = process.env.OLLAMA_MODEL ?? "llava";

    const prompt = `Analyze this image and generate a 3D scene JSON for Babylon.js. Return ONLY valid JSON, no markdown, no extra text.

Use this exact format:
{"sceneType":"custom","confidence":0.9,"description":"descripción en español","babylonConfig":{"camera":{"alpha":1.2,"beta":0.8,"radius":12},"backgroundColor":[0.08,0.12,0.18],"objects":[{"id":"floor","type":"ground","width":20,"depth":20,"color":[0.4,0.4,0.4],"metallic":0,"roughness":0.9},{"id":"obj1","type":"box","width":5,"height":3,"depth":0.3,"position":[0,1.5,5],"color":[0.8,0.7,0.6],"metallic":0,"roughness":0.8}]}}

Rules:
- objects array must have 6 to 12 items
- Each object: id(string), type(box/cylinder/sphere/ground), color([r,g,b] 0-1), position([x,y,z]), width/height/depth or diameter
- ground has no position or height
- Represent the main visual elements of the image as 3D primitives
- Match colors from the image
- Return ONLY the JSON, nothing else`;


    this.logger.log(`Ollama request → POST ${baseUrl}/api/chat | model: ${model}`);

    let raw = "";
    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [{ role: "user", images: [base64], content: prompt }]
        })
      });
      const bodyText = await res.text();
      this.logger.log(`Ollama status=${res.status} body=${bodyText.slice(0, 400)}`);
      if (!res.ok) throw new Error(`Ollama respondió con ${res.status}: ${bodyText}`);
      // Parsear primera línea JSON válida (por si Ollama devuelve NDJSON)
      for (const line of bodyText.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("{")) continue;
        try {
          const parsed = JSON.parse(trimmed) as { message?: { content?: string }; done?: boolean };
          if (parsed.message?.content) { raw += parsed.message.content; }
          if (parsed.done) break;
        } catch { /* línea inválida, continuar */ }
      }
    } catch (err) {
      throw new BadGatewayException(`Error al contactar Ollama: ${(err as Error).message}`);
    }
    this.logger.log(`raw extraído: "${raw.slice(0, 300)}"`)

    let result: AnalysisResult;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]) as AnalysisResult;
      } catch {
        this.logger.warn("JSON inválido de Ollama, usando fallback con descripción de texto.");
        result = { sceneType: "custom" as SceneType, confidence: 0.5, description: raw.slice(0, 300), babylonConfig: {} as Record<string, unknown> };
      }
    } else {
      this.logger.warn("Ollama no devolvió JSON, usando raw como descripción para fallback.");
      result = { sceneType: "custom" as SceneType, confidence: 0.5, description: raw.slice(0, 300), babylonConfig: {} as Record<string, unknown> };
    }

    // Siempre forzar sceneType custom para usar el renderer dinámico
    result.sceneType = "custom" as SceneType;

    // Si Ollama no generó objetos, construirlos desde la descripción
    const config = result.babylonConfig as Record<string, unknown>;
    const hasObjects = Array.isArray(config?.objects) && (config.objects as unknown[]).length > 0;
    if (!hasObjects) {
      result.babylonConfig = this.generateFallbackScene(result.description ?? "");
    }

    this.logger.log(`analyzeImage result: sceneType=custom objects=${(result.babylonConfig as Record<string,unknown>)?.objects ? (result.babylonConfig as {objects:unknown[]}).objects.length : 0}`);
    return result;
  }

  private generateFallbackScene(description: string): Record<string, unknown> {
    const d = description.toLowerCase();
    const objects: Record<string, unknown>[] = [];

    // Siempre: suelo base
    objects.push({ id: "floor", type: "ground", width: 24, depth: 24, color: [0.35, 0.38, 0.32], metallic: 0, roughness: 0.95 });

    if (d.match(/casa|edificio|house|building|hogar|domótica|smart/)) {
      // Estructura de casa
      objects.push({ id: "wall_front", type: "box", width: 10, height: 5, depth: 0.4, position: [0, 2.5, 6], color: [0.82, 0.74, 0.62], metallic: 0, roughness: 0.85 });
      objects.push({ id: "wall_back",  type: "box", width: 10, height: 5, depth: 0.4, position: [0, 2.5, -6], color: [0.82, 0.74, 0.62], metallic: 0, roughness: 0.85 });
      objects.push({ id: "wall_left",  type: "box", width: 0.4, height: 5, depth: 12, position: [-5, 2.5, 0], color: [0.78, 0.70, 0.59], metallic: 0, roughness: 0.85 });
      objects.push({ id: "wall_right", type: "box", width: 0.4, height: 5, depth: 12, position: [5, 2.5, 0], color: [0.78, 0.70, 0.59], metallic: 0, roughness: 0.85 });
      objects.push({ id: "roof",       type: "box", width: 11, height: 0.5, depth: 13, position: [0, 5.25, 0], color: [0.22, 0.22, 0.25], metallic: 0.1, roughness: 0.9 });
      objects.push({ id: "door",       type: "box", width: 1.2, height: 2.4, depth: 0.15, position: [0, 1.2, 6.2], color: [0.42, 0.28, 0.14], metallic: 0.1, roughness: 0.7 });
      // Sensores / luces domótica
      objects.push({ id: "light_l",    type: "sphere", diameter: 0.35, position: [-3.5, 4.5, 6.1], color: [1, 0.95, 0.7], metallic: 0.2, roughness: 0.1, emissive: [0.8, 0.75, 0.3] });
      objects.push({ id: "light_r",    type: "sphere", diameter: 0.35, position: [3.5, 4.5, 6.1], color: [1, 0.95, 0.7], metallic: 0.2, roughness: 0.1, emissive: [0.8, 0.75, 0.3] });
      objects.push({ id: "camera",     type: "box", width: 0.3, height: 0.2, depth: 0.4, position: [4.5, 4.5, 5.8], color: [0.1, 0.1, 0.12], metallic: 0.8, roughness: 0.2 });
    } else if (d.match(/panel|eléctric|electr|breaker|circuito/)) {
      objects.push({ id: "cabinet", type: "box", width: 4, height: 6, depth: 0.8, position: [0, 3, 0], color: [0.22, 0.24, 0.28], metallic: 0.7, roughness: 0.3 });
      for (let i = 0; i < 6; i++) {
        objects.push({ id: `breaker_${i}`, type: "box", width: 0.5, height: 0.9, depth: 0.15, position: [-0.8 + (i % 2) * 1.6, 4.5 - Math.floor(i / 2) * 1.2, 0.48], color: [0.85, 0.85, 0.88], metallic: 0.3, roughness: 0.5 });
      }
      objects.push({ id: "indicator", type: "sphere", diameter: 0.25, position: [0, 5.5, 0.5], color: [0.1, 0.9, 0.3], emissive: [0.05, 0.6, 0.1] });
    } else if (d.match(/riego|cultivo|campo|irrig|plant|jardín/)) {
      for (let r = 0; r < 4; r++) {
        objects.push({ id: `row_${r}`, type: "box", width: 10, height: 0.3, depth: 0.8, position: [0, 0.15, r * 2.5 - 3.75], color: [0.35, 0.22, 0.08], metallic: 0, roughness: 0.95 });
      }
      objects.push({ id: "pipe_main", type: "cylinder", diameter: 0.2, height: 12, position: [-5.5, 0.5, 1.25], rotation: [0, 0, Math.PI / 2], color: [0.6, 0.6, 0.65], metallic: 0.5, roughness: 0.4 });
    } else {
      // Escena genérica
      objects.push({ id: "struct1", type: "box", width: 4, height: 3, depth: 4, position: [-3, 1.5, 0], color: [0.6, 0.65, 0.72], metallic: 0.2, roughness: 0.7 });
      objects.push({ id: "struct2", type: "box", width: 3, height: 2, depth: 3, position: [3, 1, 0], color: [0.72, 0.62, 0.52], metallic: 0, roughness: 0.8 });
      objects.push({ id: "accent", type: "sphere", diameter: 1.5, position: [0, 4, 0], color: [0.9, 0.8, 0.3], metallic: 0.8, roughness: 0.2, emissive: [0.35, 0.28, 0.05] });
    }

    return {
      camera: { alpha: 1.2, beta: 0.75, radius: 18 },
      backgroundColor: [0.55, 0.65, 0.78],
      objects
    };
  }

  private assertCanManage(actor: AuthenticatedUser) {
    const isAdmin = actor.roles.includes("platform_admin") || actor.roles.includes("instructor");
    const hasPerm = actor.permissions.some((p) =>
      ["scenarios.manage", "scenarios.publish", "scenarios.write"].includes(p)
    );
    if (!isAdmin && !hasPerm)
      throw new ForbiddenException("Sin permisos para gestionar escenarios.");
  }

  private serialize(s: ScenarioDocument) {
    return {
      id: s.id as string,
      code: s.code,
      title: s.title,
      description: s.description,
      version: s.version,
      status: s.status,
      thumbnailUrl: s.thumbnailUrl,
      difficulty: s.difficulty,
      tags: s.tags,
      babylonConfig: s.babylonConfig,
      createdBy: s.createdBy,
      createdAt: (s as unknown as { createdAt: Date }).createdAt ?? null,
      updatedAt: (s as unknown as { updatedAt: Date }).updatedAt ?? null
    };
  }
}
