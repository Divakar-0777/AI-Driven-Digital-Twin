import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  DollarSign, 
  BookOpen, 
  CheckSquare, 
  User as UserIcon, 
  LogOut 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Finance', path: '/finance', icon: <DollarSign size={20} /> },
    { name: 'Study Tracker', path: '/study', icon: <BookOpen size={20} /> },
    { name: 'Habits', path: '/habits', icon: <CheckSquare size={20} /> },
    { name: 'Profile', path: '/profile', icon: <UserIcon size={20} /> },
  ];

  return (
    <div style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'rgba(17, 24, 39, 0.85)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      boxSizing: 'border-box',
      zIndex: 100,
    }}>
      {/* App Logo/Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          color: 'white',
          fontSize: '1.25rem',
          boxShadow: '0 4px 12px var(--primary-glow)'
        }}>
          Ω
        </div>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-highlight)', letterSpacing: '0.5px' }}>
            Antigravity AI
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assistant v1.0</span>
        </div>
      </div>

      {/* User Quick Info */}
      {user && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '28px'
        }}>
          <img
            src={user.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
            alt="Profile"
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
          />
          <div style={{ overflow: 'hidden' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-highlight)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {user.fullName}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', display: 'block' }}>
              {user.email}
            </span>
          </div>
        </div>
      )}

      {/* Menu Options */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.name}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: isActive ? 'white' : 'var(--text-muted)',
                background: isActive ? 'var(--primary)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                boxShadow: isActive ? '0 4px 12px var(--primary-glow)' : 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              {item.icon}
              <span style={{ fontSize: '0.9rem' }}>{item.name}</span>
            </div>
          );
        })}
      </nav>

      {/* Logout Option */}
      <div
        onClick={logout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#f87171',
          fontWeight: 600,
          marginTop: 'auto',
          border: '1px solid rgba(239, 68, 68, 0.1)',
          background: 'rgba(239, 68, 68, 0.02)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.02)';
        }}
      >
        <LogOut size={20} />
        <span style={{ fontSize: '0.9rem' }}>Log Out</span>
      </div>
    </div>
  );
};

export default Sidebar;
