import { useEffect, useRef } from "react";
import {
  ArcRotateCamera,
  Color4,
  Engine,
  HemisphericLight,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  Vector3
} from "@babylonjs/core";
import { useSimulationStore } from "../state/useSimulationStore";

export function SimulationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const addEvent = useSimulationStore((state) => state.addEvent);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });
    const scene = new Scene(engine);

    scene.clearColor = new Color4(0.95, 0.97, 1, 1);

    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 2.5,
      7,
      new Vector3(0, 1, 0),
      scene
    );
    camera.attachControl(canvas, true);

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.9;

    const platform = MeshBuilder.CreateGround("platform", { width: 8, height: 8 }, scene);
    const interactiveCube = MeshBuilder.CreateBox("interactiveCube", { size: 1.5 }, scene);
    interactiveCube.position.y = 1;

    scene.onPointerObservable.add((pointerInfo) => {
      if (
        pointerInfo.type === PointerEventTypes.POINTERPICK &&
        pointerInfo.pickInfo?.pickedMesh?.name === "interactiveCube"
      ) {
        interactiveCube.rotation.y += Math.PI / 4;
        addEvent({
          type: "interaction.completed",
          detail: "El usuario interactuo con el objeto principal del escenario base."
        });
      }
    });

    addEvent({
      type: "simulation.started",
      detail: "Escenario de validacion visual cargado en Babylon.js."
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      scene.dispose();
      engine.dispose();
    };
  }, [addEvent]);

  return <canvas ref={canvasRef} className="simulation-canvas" aria-label="Simulation canvas" />;
}
