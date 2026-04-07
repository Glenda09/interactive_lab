import React, { useEffect, useRef } from 'react';
import SimulationScene from '../../scenes/SimulationScene';

/**
 * BabylonCanvas
 * Mounts and manages the Babylon.js engine lifecycle inside a React component.
 *
 * @param {object} simulationData  - Data from the API describing the simulation steps
 * @param {function} onStepComplete - Callback fired when the user completes a step
 * @param {function} onProgress     - Callback fired with a progress % (0-100)
 */
const BabylonCanvas = ({ simulationData, onStepComplete, onProgress }) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const onStepCompleteRef = useRef(onStepComplete);
  const onProgressRef = useRef(onProgress);

  // Keep refs in sync without recreating the scene
  useEffect(() => { onStepCompleteRef.current = onStepComplete; }, [onStepComplete]);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new SimulationScene(
      canvasRef.current,
      simulationData,
      (step) => {
        if (onStepCompleteRef.current) onStepCompleteRef.current(step);
        if (onProgressRef.current) onProgressRef.current(scene.getProgress());
      }
    );
    scene.build();
    sceneRef.current = scene;

    return () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [simulationData]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', outline: 'none' }}
    />
  );
};

export default BabylonCanvas;
