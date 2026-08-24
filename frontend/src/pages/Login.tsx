import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const validate = (field: 'email' | 'password', val: string) => {
    let err = '';
    if (field === 'email') {
      if (!val.trim()) {
        err = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        err = 'Invalid email address format';
      }
    } else if (field === 'password') {
      if (!val) {
        err = 'Password is required';
      }
    }
    setErrors(prev => ({ ...prev, [field]: err }));
    return err;
  };

  const handleBlur = (field: 'email' | 'password', val: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate(field, val);
  };

  const handleChange = (field: 'email' | 'password', val: string) => {
    if (field === 'email') setEmail(val);
    if (field === 'password') setPassword(val);
    
    if (touched[field]) {
      validate(field, val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    setTouched({ email: true, password: true });
    const emailErr = validate('email', email);
    const passwordErr = validate('password', password);

    if (emailErr || passwordErr) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px',
        boxSizing: 'border-box',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-highlight)' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Log in to track your productivity & finances</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={(e) => handleBlur('email', e.target.value)}
              className={touched.email && errors.email ? 'invalid' : ''}
              required
            />
            {touched.email && errors.email && (
              <span className="input-error">{errors.email}</span>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Password
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={(e) => handleBlur('password', e.target.value)}
              className={touched.password && errors.password ? 'invalid' : ''}
              required
            />
            {touched.password && errors.password && (
              <span className="input-error">{errors.password}</span>
            )}
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', height: '48px', marginTop: '10px' }}
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
