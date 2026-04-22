import { useEffect, useRef } from "react";
import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  DynamicTexture,
  Engine,
  GlowLayer,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  ParticleSystem,
  PointerEventTypes,
  Scene,
  ShadowGenerator,
  Vector3,
} from "@babylonjs/core";
import { useSimulationStore } from "../state/useSimulationStore";
import type { ScenarioResponse } from "../../shared/lib/api/platform";

interface Props { scenario?: ScenarioResponse; }
type AddFn = (e: { type: string; detail: string }) => void;

// ─── Material helper ──────────────────────────────────────────────────────────

function pbr(name: string, scene: Scene, albedo: Color3, metallic: number, roughness: number, emissive?: Color3) {
  const m = new PBRMaterial(name, scene);
  m.albedoColor = albedo;
  m.metallic = metallic;
  m.roughness = roughness;
  if (emissive) m.emissiveColor = emissive;
  return m;
}

// ─── Procedural textures ──────────────────────────────────────────────────────

function makeGrassTex(scene: Scene) {
  const tex = new DynamicTexture("gt", { width: 512, height: 512 }, scene, true);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  ctx.fillStyle = "#3d8a20";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const px = Math.random() * 512, py = Math.random() * 512, r = 8 + Math.random() * 22;
    const l = Math.random() > 0.5 ? 1.18 : 0.82;
    const gr = ctx.createRadialGradient(px, py, 0, px, py, r);
    gr.addColorStop(0, `rgba(${Math.floor(61*l)},${Math.floor(138*l)},${Math.floor(32*l)},0.55)`);
    gr.addColorStop(1, "transparent");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 3500; i++) {
    const gx = Math.random() * 512, gy = Math.random() * 512;
    const g = 100 + Math.floor(Math.random() * 65);
    ctx.strokeStyle = `rgba(38,${g},14,0.65)`;
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + (Math.random()-0.5)*3, gy - 2 - Math.random()*5); ctx.stroke();
  }
  tex.update();
  return tex;
}

function makeSoilTex(scene: Scene) {
  const tex = new DynamicTexture("st", { width: 256, height: 256 }, scene, true);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  ctx.fillStyle = "#5a3510";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) {
    const px = Math.random() * 256, py = Math.random() * 256, r = 3 + Math.random() * 12;
    const l = Math.random() > 0.5 ? 1.2 : 0.78;
    ctx.fillStyle = `rgba(${Math.floor(90*l)},${Math.floor(53*l)},${Math.floor(16*l)},0.6)`;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  }
  tex.update();
  return tex;
}

function makeDropTex(scene: Scene, r: number, g: number, b: number) {
  const tex = new DynamicTexture("dt", { width: 64, height: 64 }, scene, false);
  tex.hasAlpha = true;
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, 64, 64);
  const gr = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(0.6, `rgba(${r},${g},${b},0.65)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.arc(32, 32, 30, 0, Math.PI * 2); ctx.fill();
  tex.update();
  return tex;
}

// ─── Shared plant cluster builder ─────────────────────────────────────────────

function plantCluster(name: string, x: number, z: number, scene: Scene, shadows: ShadowGenerator) {
  const h = 0.38 + Math.random() * 0.44;
  const gr = new Color3(0.06 + Math.random() * 0.09, 0.48 + Math.random() * 0.22, 0.06);
  const grDark = new Color3(gr.r * 0.7, gr.g * 0.72, gr.b * 0.7);

  const stemMat = pbr(`${name}_sm`, scene, new Color3(0.12, 0.38, 0.08), 0, 0.93);
  const fMat    = pbr(`${name}_fm`, scene, gr, 0, 0.82);
  const fDark   = pbr(`${name}_fd`, scene, grDark, 0, 0.88);

  const stem = MeshBuilder.CreateCylinder(`${name}_stem`, { diameter: 0.1, height: h, tessellation: 5 }, scene);
  stem.position.set(x, h / 2, z);
  stem.material = stemMat;
  stem.isPickable = false;
  shadows.addShadowCaster(stem);

  const sz = 0.46 + Math.random() * 0.32;
  const main = MeshBuilder.CreateSphere(`${name}_f0`, { diameter: sz, segments: 10 }, scene);
  main.position.set(x, h + sz * 0.36, z);
  main.material = fMat;
  shadows.addShadowCaster(main);

  const cnt = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < cnt; i++) {
    const ang = (i / cnt) * Math.PI * 2 + Math.random() * 0.6;
    const dist = sz * (0.22 + Math.random() * 0.14);
    const sub = MeshBuilder.CreateSphere(`${name}_f${i+1}`, { diameter: sz * (0.5 + Math.random() * 0.28), segments: 8 }, scene);
    sub.position.set(x + Math.cos(ang) * dist, h + sz * (0.08 + Math.random() * 0.32), z + Math.sin(ang) * dist);
    sub.material = i % 2 === 0 ? fMat : fDark;
    sub.isPickable = true;
    shadows.addShadowCaster(sub);
  }
}

// ─── Industrial water tank ────────────────────────────────────────────────────

function industrialTank(cx: number, cz: number, scene: Scene, shadows: ShadowGenerator, pipeMat: PBRMaterial): Mesh {
  const mat  = pbr("tMat", scene, new Color3(0.56, 0.64, 0.72), 0.38, 0.46);
  const lMat = pbr("lMat", scene, new Color3(0.3, 0.32, 0.36), 0.72, 0.33);

  const body = MeshBuilder.CreateCylinder("tank", { diameter: 2.7, height: 3.4, tessellation: 22 }, scene);
  body.position.set(cx, 1.7, cz);
  body.material = mat;
  shadows.addShadowCaster(body);

  const dome = MeshBuilder.CreateSphere("tankDome", { diameter: 2.7, segments: 14 }, scene);
  dome.scaling.y = 0.28;
  dome.position.set(cx, 3.4, cz);
  dome.material = mat;
  shadows.addShadowCaster(dome);

  const base = MeshBuilder.CreateCylinder("tankBase", { diameterTop: 2.7, diameterBottom: 2.4, height: 0.28, tessellation: 22 }, scene);
  base.position.set(cx, 0.14, cz);
  base.material = mat;
  shadows.addShadowCaster(base);

  // Support legs
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const lx = cx + Math.cos(ang) * 1.05, lz = cz + Math.sin(ang) * 1.05;
    const leg = MeshBuilder.CreateCylinder(`tLeg_${i}`, { diameter: 0.14, height: 0.6, tessellation: 6 }, scene);
    leg.position.set(lx, 0.3, lz);
    leg.material = lMat;
    shadows.addShadowCaster(leg);
    const brace = MeshBuilder.CreateCylinder(`tBrace_${i}`, { diameter: 0.06, height: 1.1, tessellation: 6 }, scene);
    brace.position.set(cx + Math.cos(ang) * 0.5, 0.7, cz + Math.sin(ang) * 0.5);
    brace.rotation.x = Math.sin(ang) * 0.5;
    brace.rotation.z = -Math.cos(ang) * 0.5;
    brace.material = lMat;
  }

  // Level indicator pipe
  const lvlPipe = MeshBuilder.CreateCylinder("lvlPipe", { diameter: 0.08, height: 2.8, tessellation: 8 }, scene);
  lvlPipe.position.set(cx + 1.32, 1.6, cz);
  lvlPipe.material = pipeMat;

  const lvlFill = MeshBuilder.CreateCylinder("lvlFill", { diameter: 0.04, height: 2.3, tessellation: 8 }, scene);
  lvlFill.position.set(cx + 1.32, 1.4, cz);
  const lfMat = pbr("lfm", scene, new Color3(0.1, 0.5, 0.9), 0, 0.1, new Color3(0.04, 0.24, 0.48));
  lfMat.alpha = 0.8;
  lvlFill.material = lfMat;

  // Inlet pipe
  const inlet = MeshBuilder.CreateCylinder("tankInlet", { diameter: 0.14, height: 1.2, tessellation: 8 }, scene);
  inlet.rotation.z = Math.PI / 2;
  inlet.position.set(cx - 1.55, 0.38, cz);
  inlet.material = pipeMat;

  // Water surface
  const water = MeshBuilder.CreateCylinder("tankWater", { diameter: 2.52, height: 0.1, tessellation: 20 }, scene);
  water.position.set(cx, 2.85, cz);
  const wMat = pbr("twm", scene, new Color3(0.1, 0.5, 0.9), 0, 0.02);
  wMat.alpha = 0.7;
  water.material = wMat;

  return water;
}

// ─── Industrial pump ──────────────────────────────────────────────────────────

function industrialPump(cx: number, cz: number, scene: Scene, shadows: ShadowGenerator, pipeMat: PBRMaterial) {
  const baseMat  = pbr("pBase", scene, new Color3(0.22, 0.24, 0.3), 0.6, 0.5);
  const bodyMat  = pbr("pBody", scene, new Color3(0.28, 0.31, 0.38), 0.58, 0.42);
  const motorMat = pbr("pMotor", scene, new Color3(0.18, 0.2, 0.25), 0.5, 0.58);
  const finMat   = pbr("pFin", scene, new Color3(0.16, 0.18, 0.22), 0.45, 0.62);
  const capMat   = pbr("pCap", scene, new Color3(0.88, 0.18, 0.06), 0.22, 0.44);
  const gaugeMat = pbr("pGauge", scene, new Color3(0.88, 0.88, 0.9), 0.1, 0.3);

  const base = MeshBuilder.CreateBox("pumpBase", { width: 1.55, height: 0.16, depth: 1.1 }, scene);
  base.position.set(cx, 0.08, cz);
  base.material = baseMat;
  shadows.addShadowCaster(base);

  const body = MeshBuilder.CreateCylinder("pump", { diameter: 0.92, height: 0.88, tessellation: 16 }, scene);
  body.position.set(cx, 0.6, cz);
  body.material = bodyMat;
  shadows.addShadowCaster(body);

  const motor = MeshBuilder.CreateBox("pumpMotor", { width: 0.84, height: 0.92, depth: 0.84 }, scene);
  motor.position.set(cx, 1.5, cz);
  motor.material = motorMat;
  shadows.addShadowCaster(motor);

  // Cooling fins
  for (let f = 0; f < 7; f++) {
    const fin = MeshBuilder.CreateBox(`fin_${f}`, { width: 0.9, height: 0.045, depth: 0.9 }, scene);
    fin.position.set(cx, 1.06 + f * 0.122, cz);
    fin.material = finMat;
  }

  // Horizontal outlet pipe
  const outlet = MeshBuilder.CreateCylinder("pOutlet", { diameter: 0.2, height: 1.3, tessellation: 8 }, scene);
  outlet.rotation.z = Math.PI / 2;
  outlet.position.set(cx + 0.85, 0.5, cz);
  outlet.material = pipeMat;

  // Elbow joint
  const elbow = MeshBuilder.CreateSphere("pElbow", { diameter: 0.22, segments: 8 }, scene);
  elbow.position.set(cx + 1.5, 0.5, cz);
  elbow.material = pipeMat;

  // Vertical inlet suction pipe
  const suction = MeshBuilder.CreateCylinder("pSuction", { diameter: 0.16, height: 0.7, tessellation: 8 }, scene);
  suction.position.set(cx, 0.04, cz + 0.42);
  suction.rotation.x = Math.PI / 2;
  suction.material = pipeMat;

  // Pressure gauge on body
  const gBase = MeshBuilder.CreateCylinder("pGaugeB", { diameter: 0.28, height: 0.08, tessellation: 14 }, scene);
  gBase.position.set(cx, 0.64, cz + 0.48);
  gBase.material = gaugeMat;

  // Red motor cap
  const cap = MeshBuilder.CreateCylinder("pumpCap", { diameter: 0.52, height: 0.22, tessellation: 16 }, scene);
  cap.position.set(cx, 2.0, cz);
  cap.material = capMat;
  shadows.addShadowCaster(cap);
}

// ─── Scene detection ──────────────────────────────────────────────────────────

function detectSceneType(scenario?: ScenarioResponse) {
  if (!scenario) return "default";
  const t = [scenario.code, scenario.title, ...(scenario.tags ?? [])].join(" ").toLowerCase();
  if (t.match(/riego|irrigac|agua|goteo|aspers|caudal|hidr|ciclo|suelo|infiltr|evapotransp|hídric/)) return "irrigation";
  if (t.match(/eléctric|electr|panel|circuito|voltaj|corrient/)) return "electrical";
  return "default";
}

function detectIrrigationVariant(scenario: ScenarioResponse): "cycle" | "drip" | "sprinkler" | "comparative" {
  const t = [scenario.code, scenario.title, ...(scenario.tags ?? [])].join(" ").toLowerCase();
  if (t.includes("ciclo") || t.includes("hidrológic")) return "cycle";
  if (t.includes("comparat")) return "comparative";
  if (t.includes("aspers")) return "sprinkler";
  return "drip";
}

// ─── Outdoor lighting ─────────────────────────────────────────────────────────

function outdoorLighting(scene: Scene) {
  const sun = new DirectionalLight("sun", new Vector3(-0.7, -2.2, 0.8), scene);
  sun.intensity = 2.8;
  sun.diffuse = new Color3(1, 0.97, 0.88);
  const sky = new HemisphericLight("sky", new Vector3(0, 1, 0), scene);
  sky.intensity = 0.55;
  sky.diffuse = new Color3(0.52, 0.74, 1);
  sky.groundColor = new Color3(0.2, 0.5, 0.15);
  const shadows = new ShadowGenerator(2048, sun);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 18;
  return shadows;
}

// ─── Drip irrigation scene ────────────────────────────────────────────────────

function buildDripScene(scene: Scene, scenario: ScenarioResponse, addFn: AddFn) {
  scene.clearColor = new Color4(0.55, 0.75, 0.92, 1);
  scene.fogMode = Scene.FOGMODE_EXP;
  scene.fogDensity = 0.007;
  scene.fogColor = new Color3(0.65, 0.8, 0.92);

  const shadows = outdoorLighting(scene);
  const gl = new GlowLayer("gl", scene); gl.intensity = 0.55;

  const grassTex = makeGrassTex(scene);
  const soilTex  = makeSoilTex(scene);

  const gMat = new PBRMaterial("gMat", scene);
  gMat.albedoTexture = grassTex;
  (gMat.albedoTexture as DynamicTexture).uScale = 10; (gMat.albedoTexture as DynamicTexture).vScale = 8;
  gMat.metallic = 0; gMat.roughness = 0.95;

  const soilMat = new PBRMaterial("soilMat", scene);
  soilMat.albedoTexture = soilTex;
  (soilMat.albedoTexture as DynamicTexture).uScale = 6; (soilMat.albedoTexture as DynamicTexture).vScale = 2;
  soilMat.metallic = 0; soilMat.roughness = 1.0;

  const pipeMat  = pbr("pipeMat", scene, new Color3(0.18, 0.19, 0.22), 0.88, 0.22);
  const emitMat  = pbr("emitMat", scene, new Color3(0.12, 0.12, 0.14), 0.6, 0.5);

  const ground = MeshBuilder.CreateGround("ground", { width: 42, height: 34, subdivisions: 8 }, scene);
  ground.receiveShadows = true; ground.material = gMat;

  const ROWS = 5;
  const rowZ = (r: number) => (r - (ROWS - 1) / 2) * 5;

  for (let row = 0; row < ROWS; row++) {
    const z = rowZ(row);

    const soil = MeshBuilder.CreateGround(`soil_${row}`, { width: 38, height: 1.85 }, scene);
    soil.position.set(0, 0.007, z);
    soil.receiveShadows = true; soil.material = soilMat;

    // Drip line
    const line = MeshBuilder.CreateCylinder(`line_${row}`, { diameter: 0.065, height: 38, tessellation: 8 }, scene);
    line.rotation.z = Math.PI / 2;
    line.position.set(0, 0.13, z);
    line.material = pipeMat;
    shadows.addShadowCaster(line);

    // Drip emitters (small nozzles on line)
    for (let e = 0; e < 9; e++) {
      const ex = (e - 4) * 4.0;
      const emit = MeshBuilder.CreateCylinder(`emit_${row}_${e}`, { diameter: 0.12, height: 0.1, tessellation: 8 }, scene);
      emit.position.set(ex, 0.18, z);
      emit.material = emitMat;
    }

    // Plants
    for (let p = 0; p < 9; p++) {
      plantCluster(`p_${row}_${p}`, (p - 4) * 4.0, z + 1.3, scene, shadows);
    }
  }

  // Branch connectors from supply pipe to rows
  for (let row = 0; row < ROWS; row++) {
    const conn = MeshBuilder.CreateCylinder(`conn_${row}`, { diameter: 0.1, height: 2.6, tessellation: 6 }, scene);
    conn.position.set(-19.8, 0.28, rowZ(row));
    conn.material = pipeMat;
    // Elbow joint
    const j = MeshBuilder.CreateSphere(`jnt_${row}`, { diameter: 0.14, segments: 6 }, scene);
    j.position.set(-18.5, 0.4, rowZ(row));
    j.material = pipeMat;
  }

  // Main supply pipe
  const supply = MeshBuilder.CreateCylinder("supply", { diameter: 0.42, height: 34, tessellation: 14 }, scene);
  supply.rotation.x = Math.PI / 2;
  supply.position.set(-20.8, 0.44, 0);
  supply.material = pipeMat;
  shadows.addShadowCaster(supply);

  // Control valve box
  const valveMat = pbr("valveMat", scene, new Color3(0.22, 0.45, 0.22), 0.3, 0.6);
  const valve = MeshBuilder.CreateBox("valve", { width: 0.5, height: 0.38, depth: 0.38 }, scene);
  valve.position.set(-20.8, 0.7, 3.5);
  valve.material = valveMat;
  shadows.addShadowCaster(valve);
  const valveHandle = MeshBuilder.CreateCylinder("valveH", { diameter: 0.06, height: 0.38, tessellation: 8 }, scene);
  valveHandle.rotation.x = Math.PI / 2;
  valveHandle.position.set(-20.8, 0.72, 3.8);
  valveHandle.material = pipeMat;

  // Tank + pump
  industrialTank(-25.5, 0, scene, shadows, pipeMat);
  industrialPump(-22.5, 0, scene, shadows, pipeMat);

  // Drip water particles
  const dropTex = makeDropTex(scene, 80, 150, 255);
  for (let row = 0; row < ROWS; row++) {
    for (let p = 0; p < 7; p++) {
      const x = (p - 3) * 4.0;
      const ps = new ParticleSystem(`dp_${row}_${p}`, 18, scene);
      ps.particleTexture = dropTex;
      ps.blendMode = ParticleSystem.BLENDMODE_ADD;
      ps.emitter = new Vector3(x, 0.22, rowZ(row));
      ps.direction1 = new Vector3(-0.03, -1, -0.03);
      ps.direction2 = new Vector3(0.03, -1, 0.03);
      ps.minSize = 0.05; ps.maxSize = 0.12;
      ps.minLifeTime = 0.35; ps.maxLifeTime = 0.8;
      ps.emitRate = 5 + Math.random() * 4;
      ps.color1 = new Color4(0.3, 0.62, 1, 0.9);
      ps.color2 = new Color4(0.4, 0.72, 1, 0.7);
      ps.colorDead = new Color4(0, 0.3, 0.8, 0);
      ps.minEmitPower = 0.5; ps.maxEmitPower = 1.1;
      ps.gravity = new Vector3(0, -9.8, 0);
      ps.start();
    }
  }

  scene.onPointerObservable.add(info => {
    if (info.type !== PointerEventTypes.POINTERPICK) return;
    const n = info.pickInfo?.pickedMesh?.name ?? "";
    if (n === "pump" || n === "pumpCap" || n === "pumpMotor") addFn({ type: "pump.activated", detail: "Bomba centrífuga · Caudal: 3.2 m³/h · Presión: 2.5 bar · RPM: 2,900." });
    else if (n.startsWith("p_") && n.includes("_f")) addFn({ type: "plant.inspected", detail: "Humedad radicular: 68% · Temperatura hoja: 22°C · Estado vegetativo: Óptimo." });
    else if (n === "tank") addFn({ type: "tank.checked", detail: "Depósito cilíndrico · Capacidad: 5,000 L · Nivel: 87% (4,350 L) · Temperatura: 18°C." });
    else if (n === "valve") addFn({ type: "valve.checked", detail: "Válvula de control · Apertura: 75% · Caudal regulado: 2.4 m³/h." });
    else if (n.startsWith("line")) addFn({ type: "line.checked", detail: "Línea de goteo PE 16mm · Caudal/gotero: 2.4 L/h · Uniformidad: 94% · Presión entrada: 1.2 bar." });
    else if (n.startsWith("emit")) addFn({ type: "emitter.checked", detail: "Gotero autocompensante · Rango presión: 0.5–4 bar · Filtro malla 120 mesh incorporado." });
  });

  addFn({ type: "simulation.started", detail: `"${scenario.title}" · Haz clic en cualquier elemento para inspeccionar sus datos técnicos.` });
}

// ─── Sprinkler scene ──────────────────────────────────────────────────────────

function buildSprinklerScene(scene: Scene, scenario: ScenarioResponse, addFn: AddFn) {
  scene.clearColor = new Color4(0.55, 0.75, 0.92, 1);
  scene.fogMode = Scene.FOGMODE_EXP;
  scene.fogDensity = 0.006;
  scene.fogColor = new Color3(0.65, 0.8, 0.92);

  const shadows = outdoorLighting(scene);
  const gl = new GlowLayer("gl", scene); gl.intensity = 0.6;

  const grassTex = makeGrassTex(scene);
  const gMat = new PBRMaterial("gMat", scene);
  gMat.albedoTexture = grassTex;
  (gMat.albedoTexture as DynamicTexture).uScale = 12; (gMat.albedoTexture as DynamicTexture).vScale = 10;
  gMat.metallic = 0; gMat.roughness = 0.95;

  const ground = MeshBuilder.CreateGround("ground", { width: 46, height: 38, subdivisions: 8 }, scene);
  ground.receiveShadows = true; ground.material = gMat;

  const pipeMat  = pbr("pipeMat", scene, new Color3(0.45, 0.47, 0.52), 0.82, 0.28);
  const headMat  = pbr("headMat", scene, new Color3(0.5, 0.52, 0.58), 0.72, 0.3);

  const ROWS = 4;
  for (let row = 0; row < ROWS; row++) {
    const z = (row - (ROWS - 1) / 2) * 8;

    // Lateral pipe
    const lat = MeshBuilder.CreateCylinder(`lat_${row}`, { diameter: 0.1, height: 44, tessellation: 8 }, scene);
    lat.rotation.z = Math.PI / 2;
    lat.position.set(0, 0.16, z);
    lat.material = pipeMat;
    shadows.addShadowCaster(lat);

    // Sprinklers every 10 units
    for (let s = 0; s < 4; s++) {
      const x = (s - 1.5) * 11;
      const post = MeshBuilder.CreateCylinder(`post_${row}_${s}`, { diameter: 0.07, height: 1.2, tessellation: 7 }, scene);
      post.position.set(x, 0.6, z);
      post.material = pipeMat;
      shadows.addShadowCaster(post);

      // Sprinkler head (multi-part: body + nozzle disk)
      const body = MeshBuilder.CreateCylinder(`sprB_${row}_${s}`, { diameter: 0.22, height: 0.25, tessellation: 12 }, scene);
      body.position.set(x, 1.32, z);
      body.material = headMat;
      shadows.addShadowCaster(body);

      const nozzle = MeshBuilder.CreateCylinder(`sprN_${row}_${s}`, { diameter: 0.36, height: 0.07, tessellation: 16 }, scene);
      nozzle.position.set(x, 1.48, z);
      nozzle.material = headMat;
      shadows.addShadowCaster(nozzle);

      const sprayTex = makeDropTex(scene, 120, 185, 255);
      for (let ang = 0; ang < 8; ang++) {
        const dir = (ang / 8) * Math.PI * 2;
        const ps = new ParticleSystem(`spr_${row}_${s}_${ang}`, 22, scene);
        ps.particleTexture = sprayTex;
        ps.blendMode = ParticleSystem.BLENDMODE_ADD;
        ps.emitter = new Vector3(x, 1.48, z);
        const dx = Math.cos(dir) * 1.15, dz = Math.sin(dir) * 1.15;
        ps.direction1 = new Vector3(dx - 0.1, 0.55, dz - 0.1);
        ps.direction2 = new Vector3(dx + 0.1, 0.95, dz + 0.1);
        ps.minSize = 0.04; ps.maxSize = 0.1;
        ps.minLifeTime = 0.55; ps.maxLifeTime = 1.35;
        ps.emitRate = 9;
        ps.color1 = new Color4(0.5, 0.78, 1, 0.82);
        ps.color2 = new Color4(0.7, 0.9, 1, 0.55);
        ps.colorDead = new Color4(0.2, 0.5, 0.9, 0);
        ps.minEmitPower = 1.6; ps.maxEmitPower = 3.6;
        ps.gravity = new Vector3(0, -4.8, 0);
        ps.start();
      }
    }

    // Plants between sprinklers
    for (let p = 0; p < 12; p++) {
      plantCluster(`p_${row}_${p}`, (p - 5.5) * 3.6, z + 2.8, scene, shadows);
    }
  }

  scene.onPointerObservable.add(info => {
    if (info.type !== PointerEventTypes.POINTERPICK) return;
    const n = info.pickInfo?.pickedMesh?.name ?? "";
    if (n.startsWith("sprB") || n.startsWith("sprN")) addFn({ type: "sprinkler.inspected", detail: "Aspersor rotativo · Cobertura: 5 m radio · Pluviometría: 8 mm/h · Presión: 2.0 bar." });
    else if (n.startsWith("p_") && n.includes("_f")) addFn({ type: "plant.inspected", detail: "Cobertura foliar mojada · Humedad: 72% · Riesgo fúngico: Bajo con ventilación adecuada." });
    else if (n.startsWith("lat")) addFn({ type: "pipe.inspected", detail: "Tubería lateral HDPE 32mm · Presión: 2.0 bar · Sin fugas detectadas." });
  });

  addFn({ type: "simulation.started", detail: `"${scenario.title}" · Observa el patrón de cobertura de los aspersores. Haz clic para inspeccionar.` });
}

// ─── Water cycle scene ────────────────────────────────────────────────────────

function buildWaterCycleScene(scene: Scene, scenario: ScenarioResponse, addFn: AddFn) {
  scene.clearColor = new Color4(0.44, 0.68, 0.94, 1);
  scene.fogMode = Scene.FOGMODE_EXP;
  scene.fogDensity = 0.005;
  scene.fogColor = new Color3(0.62, 0.78, 0.95);

  const shadows = outdoorLighting(scene);
  const gl = new GlowLayer("gl", scene); gl.intensity = 0.8;

  const grassTex = makeGrassTex(scene);
  const gMat = new PBRMaterial("gMat", scene);
  gMat.albedoTexture = grassTex;
  (gMat.albedoTexture as DynamicTexture).uScale = 14; (gMat.albedoTexture as DynamicTexture).vScale = 11;
  gMat.metallic = 0; gMat.roughness = 0.95;

  const ground = MeshBuilder.CreateGround("ground", { width: 46, height: 36, subdivisions: 10 }, scene);
  ground.receiveShadows = true; ground.material = gMat;

  // River
  const riverMat = pbr("riverMat", scene, new Color3(0.1, 0.42, 0.82), 0, 0.04, new Color3(0.02, 0.1, 0.2));
  riverMat.alpha = 0.82;
  const river = MeshBuilder.CreateBox("river", { width: 46, height: 0.1, depth: 3.5 }, scene);
  river.position.set(0, 0.05, -8);
  river.material = riverMat;

  // River banks (darker edges)
  const bankMat = pbr("bankMat", scene, new Color3(0.28, 0.18, 0.09), 0, 1.0);
  [-10, -6].forEach((bz, i) => {
    const bank = MeshBuilder.CreateGround(`bank_${i}`, { width: 46, height: 1.5 }, scene);
    bank.position.set(0, 0.006, bz);
    bank.material = bankMat;
  });

  // Clouds (multi-sphere clusters)
  const cloudMat = pbr("cloudMat", scene, new Color3(0.96, 0.97, 1), 0, 0.95);
  cloudMat.alpha = 0.78;
  [[-8, 11, -3], [1, 13, -1], [10, 12, -5], [-4, 10, 5]].forEach(([cx, cy, cz], ci) => {
    for (let i = 0; i < 7; i++) {
      const cs = MeshBuilder.CreateSphere(`cld_${ci}_${i}`, { diameter: 2.2 + Math.random() * 2.2, segments: 9 }, scene);
      cs.position.set((cx ?? 0) + (Math.random()-0.5)*5, (cy ?? 11) + (Math.random()-0.5)*1.4, (cz ?? 0) + (Math.random()-0.5)*2.5);
      cs.material = cloudMat;
    }
  });

  // Vegetation on terrain
  for (let i = 0; i < 30; i++) {
    const px = (Math.random()-0.5) * 40, pz = (Math.random()-0.5) * 30;
    if (pz > -10.5 && pz < -5.5) continue;
    plantCluster(`veg_${i}`, px, pz, scene, shadows);
  }

  // Evaporation particles
  const vapTex = makeDropTex(scene, 180, 220, 255);
  const vap = new ParticleSystem("vap", 120, scene);
  vap.particleTexture = vapTex;
  vap.blendMode = ParticleSystem.BLENDMODE_ADD;
  vap.emitter = new Vector3(0, 0.1, -8);
  vap.minEmitBox = new Vector3(-20, 0, -1.5); vap.maxEmitBox = new Vector3(20, 0, 1.5);
  vap.direction1 = new Vector3(-0.2, 1, -0.1); vap.direction2 = new Vector3(0.2, 2.8, 0.1);
  vap.minSize = 0.25; vap.maxSize = 0.85;
  vap.minLifeTime = 4; vap.maxLifeTime = 7;
  vap.emitRate = 18;
  vap.color1 = new Color4(0.7, 0.88, 1, 0.48); vap.color2 = new Color4(0.92, 0.96, 1, 0.18);
  vap.colorDead = new Color4(1, 1, 1, 0);
  vap.minEmitPower = 0.4; vap.maxEmitPower = 1.0;
  vap.gravity = new Vector3(0, -0.06, 0);
  vap.start();

  // Rain particles
  const rainTex = makeDropTex(scene, 100, 160, 255);
  const rain = new ParticleSystem("rain", 700, scene);
  rain.particleTexture = rainTex;
  rain.blendMode = ParticleSystem.BLENDMODE_ADD;
  rain.emitter = new Vector3(0, 15, 0);
  rain.minEmitBox = new Vector3(-22, 0, -14); rain.maxEmitBox = new Vector3(22, 0, 14);
  rain.direction1 = new Vector3(-0.04, -1, -0.04); rain.direction2 = new Vector3(0.04, -1.5, 0.04);
  rain.minSize = 0.055; rain.maxSize = 0.13;
  rain.minLifeTime = 1.2; rain.maxLifeTime = 2.6;
  rain.emitRate = 200;
  rain.color1 = new Color4(0.5, 0.72, 1, 0.88); rain.color2 = new Color4(0.62, 0.82, 1, 0.68);
  rain.colorDead = new Color4(0, 0.4, 0.8, 0);
  rain.minEmitPower = 5; rain.maxEmitPower = 9;
  rain.gravity = new Vector3(0, -9.8, 0);
  rain.start();

  // Animated river ripples
  let t = 0;
  scene.onBeforeRenderObservable.add(() => {
    t += scene.getEngine().getDeltaTime() * 0.001;
    river.position.y = 0.05 + 0.006 * Math.sin(t * 1.2);
  });

  scene.onPointerObservable.add(info => {
    if (info.type !== PointerEventTypes.POINTERPICK) return;
    const n = info.pickInfo?.pickedMesh?.name ?? "";
    if (n === "river") addFn({ type: "river.inspected", detail: "Canal hídrico · Caudal: 18 m³/h · Origen: Acuífero subterráneo. El agua infiltrada recarga el acuífero." });
    else if (n.startsWith("cld")) addFn({ type: "cloud.observed", detail: "Condensación: Humedad relativa 84% · Altura nube: 1,200m · Precipitación esperada: 18 mm." });
    else if (n === "ground") addFn({ type: "soil.inspected", detail: "Suelo agrícola · pH 6.8 · Retención hídrica: Alta · Permeabilidad: 12 mm/h." });
    else if (n.startsWith("veg") && n.includes("_f")) addFn({ type: "plant.observed", detail: "Vegetación riparia · Evapotranspiración: 4.2 mm/día · Aporte al ciclo hídrico local." });
  });

  addFn({ type: "simulation.started", detail: `"${scenario.title}" · Observa la evaporación, condensación y precipitación del ciclo del agua.` });
}

// ─── Comparative scene ────────────────────────────────────────────────────────

function buildComparativeScene(scene: Scene, scenario: ScenarioResponse, addFn: AddFn) {
  scene.clearColor = new Color4(0.55, 0.75, 0.92, 1);
  scene.fogMode = Scene.FOGMODE_EXP;
  scene.fogDensity = 0.006;
  scene.fogColor = new Color3(0.65, 0.8, 0.92);

  const shadows = outdoorLighting(scene);
  const gl = new GlowLayer("gl", scene); gl.intensity = 0.6;

  const grassTex = makeGrassTex(scene);
  const gMat = new PBRMaterial("gMat", scene);
  gMat.albedoTexture = grassTex;
  (gMat.albedoTexture as DynamicTexture).uScale = 16; (gMat.albedoTexture as DynamicTexture).vScale = 12;
  gMat.metallic = 0; gMat.roughness = 0.95;

  const ground = MeshBuilder.CreateGround("ground", { width: 58, height: 36, subdivisions: 8 }, scene);
  ground.receiveShadows = true; ground.material = gMat;

  const pipeMat = pbr("pipeMat", scene, new Color3(0.18, 0.19, 0.22), 0.88, 0.22);
  const headMat = pbr("headMat", scene, new Color3(0.5, 0.52, 0.58), 0.72, 0.3);

  // Zone dividers (earthen ridges)
  const ridgeMat = pbr("ridgeMat", scene, new Color3(0.42, 0.3, 0.15), 0, 0.92);
  [-10, 10].forEach((xd, i) => {
    const ridge = MeshBuilder.CreateBox(`ridge_${i}`, { width: 0.5, height: 0.45, depth: 36 }, scene);
    ridge.position.set(xd, 0.22, 0);
    ridge.material = ridgeMat;
    shadows.addShadowCaster(ridge);
  });

  const dropTex  = makeDropTex(scene, 80, 150, 255);
  const sprayTex = makeDropTex(scene, 120, 185, 255);

  // ── Zone A: Goteo (left, x ≈ -19) ──
  for (let row = 0; row < 4; row++) {
    const z = (row - 1.5) * 7;
    const line = MeshBuilder.CreateCylinder(`lnA_${row}`, { diameter: 0.065, height: 18, tessellation: 8 }, scene);
    line.rotation.z = Math.PI / 2;
    line.position.set(-19, 0.13, z);
    line.material = pipeMat;
    for (let p = 0; p < 5; p++) {
      const x = -26 + p * 3.5;
      const emit = MeshBuilder.CreateCylinder(`emA_${row}_${p}`, { diameter: 0.11, height: 0.09, tessellation: 8 }, scene);
      emit.position.set(x, 0.18, z);
      emit.material = pbr(`emAmAt_${row}_${p}`, scene, new Color3(0.12, 0.12, 0.14), 0.6, 0.5);
      plantCluster(`pA_${row}_${p}`, x, z + 1.2, scene, shadows);
      const ps = new ParticleSystem(`dpA_${row}_${p}`, 12, scene);
      ps.particleTexture = dropTex; ps.blendMode = ParticleSystem.BLENDMODE_ADD;
      ps.emitter = new Vector3(x, 0.2, z);
      ps.direction1 = new Vector3(-0.02, -1, -0.02); ps.direction2 = new Vector3(0.02, -1, 0.02);
      ps.minSize = 0.05; ps.maxSize = 0.11;
      ps.minLifeTime = 0.35; ps.maxLifeTime = 0.75;
      ps.emitRate = 5; ps.color1 = new Color4(0.3, 0.62, 1, 0.9); ps.colorDead = new Color4(0, 0.3, 0.8, 0);
      ps.minEmitPower = 0.5; ps.maxEmitPower = 1.0;
      ps.gravity = new Vector3(0, -9.8, 0); ps.start();
    }
  }

  // ── Zone B: Aspersión (center, x ≈ 0) ──
  const sprPos = [[-4,-12],[4,-12],[-4,0],[4,0],[-4,12],[4,12]];
  for (const [si, [sx, sz]] of sprPos.entries()) {
    const post = MeshBuilder.CreateCylinder(`postB_${si}`, { diameter: 0.07, height: 1.25, tessellation: 7 }, scene);
    post.position.set(sx, 0.62, sz); post.material = pipeMat; shadows.addShadowCaster(post);
    const hd = MeshBuilder.CreateCylinder(`sprBH_${si}`, { diameter: 0.24, height: 0.26, tessellation: 12 }, scene);
    hd.position.set(sx, 1.36, sz); hd.material = headMat; shadows.addShadowCaster(hd);
    const nz = MeshBuilder.CreateCylinder(`sprBN_${si}`, { diameter: 0.38, height: 0.07, tessellation: 16 }, scene);
    nz.position.set(sx, 1.52, sz); nz.material = headMat;
    for (let ang = 0; ang < 8; ang++) {
      const dir = (ang / 8) * Math.PI * 2;
      const ps = new ParticleSystem(`spB_${si}_${ang}`, 18, scene);
      ps.particleTexture = sprayTex; ps.blendMode = ParticleSystem.BLENDMODE_ADD;
      ps.emitter = new Vector3(sx, 1.52, sz);
      const dx = Math.cos(dir) * 1.1, dz = Math.sin(dir) * 1.1;
      ps.direction1 = new Vector3(dx-0.1, 0.5, dz-0.1); ps.direction2 = new Vector3(dx+0.1, 0.92, dz+0.1);
      ps.minSize = 0.04; ps.maxSize = 0.1;
      ps.minLifeTime = 0.55; ps.maxLifeTime = 1.3;
      ps.emitRate = 8; ps.color1 = new Color4(0.5, 0.78, 1, 0.82); ps.colorDead = new Color4(0.2, 0.5, 0.9, 0);
      ps.minEmitPower = 1.4; ps.maxEmitPower = 3.2;
      ps.gravity = new Vector3(0, -4.5, 0); ps.start();
    }
  }
  for (let p = 0; p < 16; p++) plantCluster(`pB_${p}`, -7 + (p % 8) * 2.1, Math.floor(p / 8) * 10 - 9, scene, shadows);

  // ── Zone C: Gravedad/inundación (right, x ≈ 19) ──
  const floodMat = pbr("floodMat", scene, new Color3(0.12, 0.48, 0.88), 0, 0.03, new Color3(0.04, 0.14, 0.32));
  floodMat.alpha = 0.68;
  for (let fi = 0; fi < 4; fi++) {
    const fz = (fi - 1.5) * 7.5;
    const flood = MeshBuilder.CreateBox(`flood_${fi}`, { width: 16, height: 0.13, depth: 5.5 }, scene);
    flood.position.set(19, 0.065, fz);
    flood.material = floodMat;
    flood.metadata = { baseY: 0.065, phase: fi * 0.8 };
    for (let p = 0; p < 5; p++) plantCluster(`pC_${fi}_${p}`, 12 + p * 2.8, fz + 3.2, scene, shadows);
  }

  let t = 0;
  scene.onBeforeRenderObservable.add(() => {
    t += scene.getEngine().getDeltaTime() * 0.001;
    for (let fi = 0; fi < 4; fi++) {
      const m = scene.getMeshByName(`flood_${fi}`);
      if (m?.metadata) {
        const { baseY, phase } = m.metadata as { baseY: number; phase: number };
        m.position.y = baseY + 0.01 * Math.sin(t * 1.3 + phase);
      }
    }
  });

  scene.onPointerObservable.add(info => {
    if (info.type !== PointerEventTypes.POINTERPICK) return;
    const n = info.pickInfo?.pickedMesh?.name ?? "";
    if (n.startsWith("lnA") || n.startsWith("emA")) addFn({ type: "zone.drip", detail: "ZONA A · Goteo: Eficiencia 92% · 2.4 L/h/gotero · Ideal para cultivos de alto valor." });
    else if (n.startsWith("sprB") || n.startsWith("postB")) addFn({ type: "zone.sprinkler", detail: "ZONA B · Aspersión: Cobertura 5m radio · 8 mm/h · Mayor evaporación (~25%)." });
    else if (n.startsWith("flood")) addFn({ type: "zone.gravity", detail: "ZONA C · Gravedad: Costo mínimo · Pérdida escorrentía: 35% · Requiere nivelación del terreno." });
  });

  addFn({ type: "simulation.started", detail: `"${scenario.title}" · Izquierda: Goteo | Centro: Aspersión | Derecha: Inundación por gravedad.` });
}

// ─── Electrical panel scene ───────────────────────────────────────────────────

function buildElectricalScene(scene: Scene, scenario: ScenarioResponse, addFn: AddFn) {
  scene.clearColor = new Color4(0.08, 0.1, 0.14, 1);
  const amb = new HemisphericLight("amb", new Vector3(0, 1, 0), scene);
  amb.intensity = 0.6;
  const fill = new DirectionalLight("fill", new Vector3(0, -1, -1), scene);
  fill.intensity = 0.5;
  const gl = new GlowLayer("gl", scene); gl.intensity = 1.3;

  const floor = MeshBuilder.CreateGround("floor", { width: 20, height: 16 }, scene);
  floor.material = pbr("fm", scene, new Color3(0.12, 0.13, 0.16), 0.12, 0.9);

  const cab = MeshBuilder.CreateBox("cabinet", { width: 7.8, height: 5.8, depth: 0.7 }, scene);
  cab.position.set(0, 2.9, 0);
  cab.material = pbr("cabMat", scene, new Color3(0.2, 0.22, 0.26), 0.45, 0.6);

  const bColors = [
    new Color3(0.85, 0.18, 0.18), new Color3(0.18, 0.75, 0.28),
    new Color3(0.18, 0.4, 0.92), new Color3(0.95, 0.78, 0.1),
    new Color3(0.18, 0.75, 0.28), new Color3(0.88, 0.42, 0.08)
  ];

  for (let i = 0; i < 6; i++) {
    const bm = pbr(`bm_${i}`, scene, new Color3(0.14, 0.16, 0.2), 0.3, 0.72);
    const br = MeshBuilder.CreateBox(`breaker_${i}`, { width: 0.62, height: 1.75, depth: 0.44 }, scene);
    br.position.set(-3.38 + i * 1.38, 4.28, -0.52); br.material = bm;

    const im = pbr(`im_${i}`, scene, bColors[i], 0, 0.5);
    im.emissiveColor = bColors[i].scale(0.6);
    const ind = MeshBuilder.CreateSphere(`ind_${i}`, { diameter: 0.25, segments: 10 }, scene);
    ind.position.set(-3.38 + i * 1.38, 5.28, -0.54); ind.material = im;
  }

  for (let i = 0; i < 4; i++) {
    const gauge = MeshBuilder.CreateCylinder(`gauge_${i}`, { diameter: 1.12, height: 0.14, tessellation: 32 }, scene);
    gauge.position.set(-1.95 + i * 1.32, 2.72, -0.52);
    gauge.material = pbr(`gm_${i}`, scene, new Color3(0.07, 0.08, 0.11), 0.12, 0.82);
    const rim = MeshBuilder.CreateTorus(`rim_${i}`, { diameter: 1.12, thickness: 0.06, tessellation: 32 }, scene);
    rim.position.set(-1.95 + i * 1.32, 2.72, -0.52); rim.rotation.x = Math.PI/2;
    rim.material = pbr(`rm_${i}`, scene, new Color3(0.4, 0.42, 0.48), 0.7, 0.35);
    const nm = pbr("nm", scene, new Color3(0.95, 0.18, 0.12), 0, 0.4);
    nm.emissiveColor = new Color3(0.48, 0.05, 0.02);
    const needle = MeshBuilder.CreateBox(`needle_${i}`, { width: 0.048, height: 0.4, depth: 0.09 }, scene);
    needle.position.set(-1.95 + i * 1.32, 2.72, -0.58); needle.rotation.z = -0.85 + i * 0.55; needle.material = nm;
  }

  const wMat = pbr("wm", scene, new Color3(0.06, 0.06, 0.07), 0.5, 0.7);
  for (let i = 0; i < 6; i++) {
    const wire = MeshBuilder.CreateBox(`wire_${i}`, { width: 0.05, height: 2.4, depth: 0.05 }, scene);
    wire.position.set(-3.1 + i * 1.18, 1.35, -0.44); wire.material = wMat;
  }

  const term = MeshBuilder.CreateBox("terminals", { width: 7.2, height: 0.7, depth: 0.5 }, scene);
  term.position.set(0, 0.35, -0.46);
  term.material = pbr("termMat", scene, new Color3(0.12, 0.14, 0.17), 0.22, 0.8);

  let t = 0;
  scene.onBeforeRenderObservable.add(() => {
    t += scene.getEngine().getDeltaTime() * 0.001;
    for (let i = 0; i < 6; i++) {
      const ind = scene.getMeshByName(`ind_${i}`);
      if (ind?.material) (ind.material as PBRMaterial).emissiveColor = bColors[i].scale(0.38 + 0.26 * Math.sin(t * 2.2 + i * 1.1));
    }
  });

  const labels = ["Voltaje: 220V", "Corriente: 15A", "Potencia: 3.3kW", "Frecuencia: 60Hz"];
  scene.onPointerObservable.add(info => {
    if (info.type !== PointerEventTypes.POINTERPICK) return;
    const n = info.pickInfo?.pickedMesh?.name ?? "";
    if (n.startsWith("breaker")) { const i = parseInt(n.split("_")[1]); addFn({ type: "breaker.operated", detail: `Interruptor ${i+1} operado · Verificando continuidad y aislamiento del circuito.` }); }
    else if (n.startsWith("gauge") || n.startsWith("rim")) { const i = parseInt(n.split("_")[1]); addFn({ type: "meter.read", detail: `Medidor ${i+1}: ${labels[i] ?? "OK"} · Dentro del rango nominal de operación.` }); }
    else if (n === "terminals") addFn({ type: "terminals.checked", detail: "Borneras inspeccionadas · Apriete: 2.5 Nm ✓ · Temperatura: 28°C ✓ · Sin arco eléctrico." });
  });

  addFn({ type: "simulation.started", detail: `Panel "${scenario.title}" · Haz clic en interruptores, medidores o borneras para inspeccionarlos.` });
}

// ─── Default scene ────────────────────────────────────────────────────────────

function buildDefaultScene(scene: Scene, scenario: ScenarioResponse | undefined, addFn: AddFn) {
  scene.clearColor = new Color4(0.05, 0.09, 0.15, 1);
  const amb = new HemisphericLight("light", new Vector3(0, 1, 0.3), scene);
  amb.intensity = 0.9;
  const floor = MeshBuilder.CreateGround("platform", { width: 10, height: 10 }, scene);
  floor.material = pbr("pm", scene, new Color3(0.08, 0.14, 0.22), 0.1, 0.85);
  const box = MeshBuilder.CreateBox("mainObject", { size: 1.6 }, scene);
  box.position.y = 1;
  box.material = pbr("bm", scene, new Color3(0.18, 0.55, 0.85), 0.3, 0.5);
  scene.onPointerObservable.add(info => {
    if (info.type !== PointerEventTypes.POINTERPICK) return;
    if (info.pickInfo?.pickedMesh?.name === "mainObject") {
      box.rotation.y += Math.PI / 4;
      addFn({ type: "interaction.completed", detail: "Objeto interactivo activado." });
    }
  });
  addFn({ type: "simulation.started", detail: `Escenario "${scenario?.title ?? "base"}" cargado en Babylon.js 8.` });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SimulationCanvas({ scenario }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const addEvent  = useSimulationStore(s => s.addEvent);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene  = new Scene(engine);
    const type   = detectSceneType(scenario);

    if (type === "irrigation") {
      const variant   = scenario ? detectIrrigationVariant(scenario) : "drip";
      const radius    = variant === "comparative" ? 45 : variant === "cycle" ? 32 : 28;
      const target    = variant === "comparative" ? new Vector3(0, 0, 0) : new Vector3(-6, 0, 0);
      const cam = new ArcRotateCamera("cam", -Math.PI / 3.5, Math.PI / 3.8, radius, target, scene);
      cam.attachControl(canvas, true);
      cam.lowerRadiusLimit = 10; cam.upperRadiusLimit = 70;
      if (scenario) {
        if (variant === "cycle")       buildWaterCycleScene(scene, scenario, addEvent);
        else if (variant === "sprinkler") buildSprinklerScene(scene, scenario, addEvent);
        else if (variant === "comparative") buildComparativeScene(scene, scenario, addEvent);
        else buildDripScene(scene, scenario, addEvent);
      }
    } else if (type === "electrical") {
      const cam = new ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 2.8, 15, new Vector3(0, 2.9, 0), scene);
      cam.attachControl(canvas, true);
      cam.lowerRadiusLimit = 5; cam.upperRadiusLimit = 26;
      if (scenario) buildElectricalScene(scene, scenario, addEvent);
    } else {
      const cam = new ArcRotateCamera("cam", Math.PI / 4, Math.PI / 3, 9, new Vector3(0, 1, 0), scene);
      cam.attachControl(canvas, true);
      cam.lowerRadiusLimit = 4; cam.upperRadiusLimit = 18;
      buildDefaultScene(scene, scenario, addEvent);
    }

    engine.runRenderLoop(() => scene.render());
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); scene.dispose(); engine.dispose(); };
  }, [addEvent, scenario]);

  return <canvas ref={canvasRef} className="simulation-canvas" aria-label="Simulation canvas" />;
}
