import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/users')
      .then(({ data }) => setUsers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#e2e8f0', marginBottom: '1.5rem' }}>Panel de administración</h2>

      <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '1rem' }}>Gestión de usuarios</h3>
      {loading ? (
        <p style={{ color: '#94a3b8' }}>Cargando…</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a4a', color: '#64748b', fontSize: '0.8rem', textAlign: 'left' }}>
              {['Nombre', 'Correo', 'Rol', 'Estado'].map((h) => (
                <th key={h} style={{ padding: '0.5rem 0.75rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ borderBottom: '1px solid #1e1e3a' }}>
                <td style={{ padding: '0.75rem', color: '#e2e8f0' }}>{u.name}</td>
                <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{u.email}</td>
                <td style={{ padding: '0.75rem', color: '#fbbf24' }}>{u.role}</td>
                <td style={{ padding: '0.75rem', color: u.isActive ? '#34d399' : '#f87171' }}>
                  {u.isActive ? 'Activo' : 'Inactivo'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Admin;
