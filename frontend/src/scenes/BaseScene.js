import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  Color4,
} from '@babylonjs/core';

/**
 * BaseScene — wrapper base para todas las escenas 3D de la plataforma.
 * Inicializa motor, escena, cámara y luz por defecto.
 */
class BaseScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.05, 0.05, 0.1, 1);

    this._setupCamera();
    this._setupLight();
    this._startRenderLoop();
  }

  _setupCamera() {
    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 4,
      10,
      Vector3.Zero(),
      this.scene
    );
    this.camera.attachControl(this.canvas, true);
    this.camera.lowerRadiusLimit = 2;
    this.camera.upperRadiusLimit = 50;
  }

  _setupLight() {
    this.light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    this.light.intensity = 0.8;
  }

  _startRenderLoop() {
    this._resizeHandler = () => this.engine.resize();
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    window.addEventListener('resize', this._resizeHandler);
  }

  /**
   * Override this method in subclasses to build scene content.
   */
  build() {}

  dispose() {
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
    window.removeEventListener('resize', this._resizeHandler);
  }
}

export default BaseScene;
