import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/results/me')
      .then(({ data }) => setResults(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const avg = results.length
    ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)
    : 0;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>
        Bienvenido, {user?.name} 👋
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
        Aquí puedes ver tu progreso y resultados de simulaciones.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Simulaciones completadas', value: results.length },
          { label: 'Puntuación promedio', value: `${avg}%` },
          { label: 'Aprobadas', value: results.filter((r) => r.passed).length },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: '0.5rem', padding: '1.25rem' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{label}</p>
            <p style={{ color: '#60a5fa', fontSize: '1.8rem', fontWeight: 700 }}>{value}</p>
          </div>
        ))}
      </div>

      <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Historial reciente</h3>
      {loading ? (
        <p style={{ color: '#94a3b8' }}>Cargando…</p>
      ) : results.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>Aún no has completado ninguna simulación.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a4a', color: '#64748b', fontSize: '0.8rem', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem 0.75rem' }}>Simulación</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Puntuación</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Estado</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r._id} style={{ borderBottom: '1px solid #1e1e3a' }}>
                <td style={{ padding: '0.75rem', color: '#e2e8f0' }}>{r.simulation?.title || '—'}</td>
                <td style={{ padding: '0.75rem', color: '#60a5fa' }}>{r.score}%</td>
                <td style={{ padding: '0.75rem', color: r.passed ? '#34d399' : '#f87171' }}>
                  {r.passed ? 'Aprobado' : 'No aprobado'}
                </td>
                <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                  {new Date(r.completedAt).toLocaleDateString('es-ES')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Dashboard;
