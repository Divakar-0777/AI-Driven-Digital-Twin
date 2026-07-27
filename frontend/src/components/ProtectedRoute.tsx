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
        background: 'linear-gradient(135deg, #0b0f19 0%, #111827 100%)',
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: '600'
      }}>
        <div style={{
          padding: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(17,24,39,0.7)',
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
