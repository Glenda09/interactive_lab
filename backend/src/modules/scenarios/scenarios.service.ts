import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { CreateScenarioDto } from "./dto/create-scenario.dto.js";
import { Scenario, ScenarioDocument } from "./schemas/scenario.schema.js";

@Injectable()
export class ScenariosService {
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
