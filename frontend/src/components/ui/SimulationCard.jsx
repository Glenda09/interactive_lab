import React from 'react';
import { Link } from 'react-router-dom';

const SimulationCard = ({ simulation }) => (
  <div
    style={{
      background: '#1e1e3a',
      border: '1px solid #2a2a4a',
      borderRadius: '0.5rem',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}
  >
    <h3 style={{ color: '#e2e8f0', fontSize: '1.05rem', fontWeight: 600 }}>
      {simulation.title}
    </h3>
    <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.5 }}>
      {simulation.description}
    </p>
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
      <span
        style={{
          background: '#1e3a5f',
          borderRadius: '9999px',
          color: '#60a5fa',
          fontSize: '0.75rem',
          padding: '0.2rem 0.6rem',
        }}
      >
        {simulation.category}
      </span>
      <span
        style={{
          background: '#1e3a3a',
          borderRadius: '9999px',
          color: '#34d399',
          fontSize: '0.75rem',
          padding: '0.2rem 0.6rem',
        }}
      >
        {simulation.difficulty}
      </span>
    </div>
    <Link
      to={`/simulations/${simulation._id}`}
      style={{
        marginTop: '0.75rem',
        background: '#2563eb',
        borderRadius: '0.375rem',
        color: '#fff',
        padding: '0.5rem 1rem',
        textDecoration: 'none',
        textAlign: 'center',
        fontSize: '0.875rem',
      }}
    >
      Iniciar simulación →
    </Link>
  </div>
);

export default SimulationCard;
