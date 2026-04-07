import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../services/authService';

const MainLayout = () => {
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          background: '#1a1a2e',
          borderBottom: '1px solid #2a2a4a',
          padding: '0.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 700, fontSize: '1.2rem' }}>
          🧪 Interactive Lab
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/simulations" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
            Simulaciones
          </Link>
          {token ? (
            <>
              <Link to="/dashboard" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                Dashboard
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" style={{ color: '#fbbf24', textDecoration: 'none' }}>
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid #475569',
                  borderRadius: '0.375rem',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.375rem 0.75rem',
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                style={{
                  background: '#2563eb',
                  borderRadius: '0.375rem',
                  color: '#fff',
                  padding: '0.375rem 0.75rem',
                  textDecoration: 'none',
                }}
              >
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </header>

      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>

      <footer
        style={{
          background: '#1a1a2e',
          borderTop: '1px solid #2a2a4a',
          padding: '1rem 2rem',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.875rem',
        }}
      >
        © {new Date().getFullYear()} Interactive Lab — Plataforma de Capacitación Virtual
      </footer>
    </div>
  );
};

export default MainLayout;
