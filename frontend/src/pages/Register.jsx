import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(register(form.name, form.email, form.password));
    if (!result?.error) navigate('/dashboard');
  };

  const fields = [
    { name: 'name', type: 'text', placeholder: 'Nombre completo' },
    { name: 'email', type: 'email', placeholder: 'Correo electrónico' },
    { name: 'password', type: 'password', placeholder: 'Contraseña (mín. 8 caracteres)' },
  ];

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <h2 style={{ color: '#e2e8f0', marginBottom: '1.5rem', textAlign: 'center' }}>Crear cuenta</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <p style={{ color: '#f87171', textAlign: 'center' }}>{error}</p>}
        {fields.map(({ name, type, placeholder }) => (
          <input
            key={name}
            name={name}
            type={type}
            placeholder={placeholder}
            value={form[name]}
            onChange={handleChange}
            required
            style={{
              background: '#1e1e3a',
              border: '1px solid #2a2a4a',
              borderRadius: '0.375rem',
              color: '#e2e8f0',
              padding: '0.625rem 0.875rem',
              fontSize: '0.95rem',
            }}
          />
        ))}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#2563eb',
            border: 'none',
            borderRadius: '0.375rem',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            opacity: loading ? 0.7 : 1,
            padding: '0.625rem',
          }}
        >
          {loading ? 'Cargando…' : 'Registrarse'}
        </button>
      </form>
      <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" style={{ color: '#60a5fa' }}>Inicia sesión</Link>
      </p>
    </div>
  );
};

export default Register;
