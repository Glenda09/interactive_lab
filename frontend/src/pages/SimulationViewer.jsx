import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSimulationById } from '../services/simulationService';
import { clearCurrent } from '../store/slices/simulationSlice';
import BabylonCanvas from '../components/common/BabylonCanvas';
import ProgressBar from '../components/ui/ProgressBar';

const SimulationViewer = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: simulation, loading, error } = useSelector((s) => s.simulations);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    dispatch(fetchSimulationById(id));
    return () => dispatch(clearCurrent());
  }, [id, dispatch]);

  const handleStepComplete = (step) => {
    setCompletedSteps((prev) => [...prev, step]);
  };

  if (loading) return <p style={{ color: '#94a3b8' }}>Cargando simulación…</p>;
  if (error) return <p style={{ color: '#f87171' }}>Error: {error}</p>;
  if (!simulation) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ color: '#e2e8f0', fontSize: '1.4rem' }}>{simulation.title}</h2>
        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          {completedSteps.length} / {simulation.steps?.length || 0} pasos completados
        </span>
      </div>

      <ProgressBar value={progress} label="Progreso" />

      <div style={{ flex: 1, borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #2a2a4a' }}>
        <BabylonCanvas
          simulationData={simulation}
          onStepComplete={handleStepComplete}
          onProgress={setProgress}
        />
      </div>

      {progress >= 100 && (
        <div
          style={{
            background: '#064e3b',
            border: '1px solid #34d399',
            borderRadius: '0.5rem',
            color: '#34d399',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          🎉 ¡Simulación completada con éxito!
        </div>
      )}
    </div>
  );
};

export default SimulationViewer;
