import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSimulations } from '../services/simulationService';
import SimulationCard from '../components/ui/SimulationCard';

const SimulationList = () => {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((state) => state.simulations);

  useEffect(() => {
    dispatch(fetchSimulations());
  }, [dispatch]);

  if (loading) return <p style={{ color: '#94a3b8' }}>Cargando simulaciones…</p>;
  if (error) return <p style={{ color: '#f87171' }}>Error: {error}</p>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ color: '#e2e8f0', marginBottom: '1.5rem', fontSize: '1.75rem' }}>
        Simulaciones disponibles
      </h2>
      {list.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No hay simulaciones disponibles por ahora.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {list.map((sim) => (
            <SimulationCard key={sim._id} simulation={sim} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SimulationList;
