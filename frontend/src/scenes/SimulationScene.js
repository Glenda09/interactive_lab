import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  ActionManager,
  ExecuteCodeAction,
} from '@babylonjs/core';
import BaseScene from './BaseScene';

/**
 * SimulationScene — escena 3D genérica para simulaciones técnicas.
 * Extiende BaseScene añadiendo objetos interactivos y seguimiento de pasos.
 */
class SimulationScene extends BaseScene {
  constructor(canvas, simulationData, onStepComplete) {
    super(canvas);
    this.simulationData = simulationData;
    this.onStepComplete = onStepComplete;
    this.completedSteps = [];
  }

  build() {
    this._createGround();
    this._createInteractiveObjects();
  }

  _createGround() {
    const ground = MeshBuilder.CreateGround(
      'ground',
      { width: 20, height: 20 },
      this.scene
    );
    const mat = new StandardMaterial('groundMat', this.scene);
    mat.diffuseColor = new Color3(0.2, 0.2, 0.3);
    ground.material = mat;
  }

  _createInteractiveObjects() {
    const steps = this.simulationData?.steps || [];
    steps.forEach((step, index) => {
      const mesh = MeshBuilder.CreateBox(
        `step_${index}`,
        { size: 1 },
        this.scene
      );
      mesh.position = new Vector3(index * 2 - steps.length, 0.5, 0);

      const mat = new StandardMaterial(`stepMat_${index}`, this.scene);
      mat.diffuseColor = new Color3(0.2, 0.6, 1);
      mesh.material = mat;

      mesh.actionManager = new ActionManager(this.scene);
      mesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          this._completeStep(step, index, mat);
        })
      );
    });
  }

  _completeStep(step, index, mat) {
    if (this.completedSteps.includes(index)) return;
    this.completedSteps.push(index);
    mat.diffuseColor = new Color3(0.2, 1, 0.3);
    if (this.onStepComplete) {
      this.onStepComplete({ stepId: step.id || String(index), success: true });
    }
  }

  getProgress() {
    const total = this.simulationData?.steps?.length || 0;
    return total > 0 ? (this.completedSteps.length / total) * 100 : 0;
  }
}

export default SimulationScene;
