import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would call the API
    setSent(true);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%)',
      padding: 20,
    }}>
      <div className="glass-panel" style={{ width: 440, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '1.1rem',
          }}>
            DT
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-highlight)' }}>Reset Password</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: '0.9rem' }}>
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: 16 }} />
            <h3 style={{ color: 'var(--text-highlight)', marginBottom: 8 }}>Check Your Email</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
              If an account exists with <strong>{email}</strong>, you'll receive a password reset link shortly.
            </p>
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Send Reset Link</button>
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', textAlign: 'center', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
