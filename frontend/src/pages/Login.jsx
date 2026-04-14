import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '32px', width: '100%', maxWidth: '420px',
        display: 'flex', flexDirection: 'column', gap: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '2rem' }}>BlockNote</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email</label>
          <input 
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '12px', background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)', color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)', outline: 'none'
            }}
            onFocus={e => e.target.style.boxShadow = '0 0 0 2px var(--accent)'}
            onBlur={e => e.target.style.boxShadow = 'none'}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Password</label>
          <input 
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '12px', background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)', color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)', outline: 'none'
            }}
            onFocus={e => e.target.style.boxShadow = '0 0 0 2px var(--accent)'}
            onBlur={e => e.target.style.boxShadow = 'none'}
            required
          />
        </div>

        {error && <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</div>}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '12px', background: 'var(--accent)',
          color: 'var(--text-inverse)', fontWeight: 600, borderRadius: 'var(--radius-md)',
          transition: 'background var(--t-fast)'
        }}
        onMouseOver={e => e.target.style.background = 'var(--accent-hover)'}
        onMouseOut={e => e.target.style.background = 'var(--accent)'}
        >
          {loading ? '...' : 'Log in'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
          <Link to="/register" style={{ color: 'var(--accent)' }}>Don't have an account? Register →</Link>
        </div>
      </form>
    </div>
  );
}
