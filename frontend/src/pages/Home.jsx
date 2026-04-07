import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => (
  <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', padding: '4rem 1rem' }}>
    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 }}>
      Plataforma de Capacitación Virtual<br />
      <span style={{ color: '#60a5fa' }}>con Simulación 3D</span>
    </h1>
    <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '1.5rem', lineHeight: 1.7 }}>
      Aprende haciendo. Practica procedimientos técnicos en entornos 3D interactivos,
      recibe retroalimentación en tiempo real y rastrea tu progreso desde cualquier navegador.
    </p>
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2.5rem' }}>
      <Link
        to="/simulations"
        style={{
          background: '#2563eb',
          borderRadius: '0.5rem',
          color: '#fff',
          fontSize: '1rem',
          padding: '0.75rem 1.75rem',
          textDecoration: 'none',
        }}
      >
        Ver simulaciones
      </Link>
      <Link
        to="/register"
        style={{
          background: 'transparent',
          border: '1px solid #475569',
          borderRadius: '0.5rem',
          color: '#cbd5e1',
          fontSize: '1rem',
          padding: '0.75rem 1.75rem',
          textDecoration: 'none',
        }}
      >
        Crear cuenta
      </Link>
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginTop: '5rem',
        textAlign: 'left',
      }}
    >
      {[
        { icon: '🎮', title: 'Simulaciones interactivas', desc: 'Escenarios 3D con física realista construidos con Babylon.js.' },
        { icon: '📊', title: 'Evaluación de desempeño', desc: 'Puntuación automática basada en precisión, tiempo y pasos completados.' },
        { icon: '🛡️', title: 'Administración centralizada', desc: 'Panel de control para gestionar usuarios, cursos y resultados.' },
        { icon: '📱', title: 'Multiplataforma', desc: 'Funciona en cualquier navegador moderno, sin instalaciones adicionales.' },
      ].map(({ icon, title, desc }) => (
        <div
          key={title}
          style={{
            background: '#1e1e3a',
            border: '1px solid #2a2a4a',
            borderRadius: '0.5rem',
            padding: '1.5rem',
          }}
        >
          <div style={{ fontSize: '2rem' }}>{icon}</div>
          <h3 style={{ color: '#e2e8f0', marginTop: '0.75rem', fontWeight: 600 }}>{title}</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: 1.6 }}>{desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default Home;
