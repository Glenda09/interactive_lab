import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div style={{ textAlign: 'center', paddingTop: '5rem' }}>
    <h1 style={{ color: '#e2e8f0', fontSize: '4rem', fontWeight: 700 }}>404</h1>
    <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
      La página que buscas no existe.
    </p>
    <Link
      to="/"
      style={{
        display: 'inline-block',
        marginTop: '1.5rem',
        background: '#2563eb',
        borderRadius: '0.375rem',
        color: '#fff',
        padding: '0.5rem 1.25rem',
        textDecoration: 'none',
      }}
    >
      Volver al inicio
    </Link>
  </div>
);

export default NotFound;
