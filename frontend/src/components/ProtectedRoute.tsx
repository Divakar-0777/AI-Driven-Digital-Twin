import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%)',
        color: 'var(--text-highlight)',
        fontSize: '1.2rem',
        fontWeight: '600'
      }}>
        <div style={{
          padding: '24px',
          border: '1px solid var(--card-border)',
          background: 'var(--card-bg)',
          borderRadius: '16px',
          backdropFilter: 'blur(16px)',
          textAlign: 'center'
        }}>
          Loading Assistant...
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};
export default ProtectedRoute;
