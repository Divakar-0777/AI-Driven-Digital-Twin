import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Brain, DollarSign, BookOpen, CheckSquare, Target,
  Zap, MessageSquare, BarChart3, User as UserIcon, Settings, LogOut
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Digital Twin', path: '/digital-twin', icon: <Brain size={20} /> },
    { name: 'Finance', path: '/finance', icon: <DollarSign size={20} /> },
    { name: 'Study', path: '/study', icon: <BookOpen size={20} /> },
    { name: 'Habits', path: '/habits', icon: <CheckSquare size={20} /> },
    { name: 'Goals', path: '/goals', icon: <Target size={20} /> },
    { name: 'Simulations', path: '/simulations', icon: <Zap size={20} /> },
    { name: 'AI Assistant', path: '/ai-assistant', icon: <MessageSquare size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
    { name: 'Profile', path: '/profile', icon: <UserIcon size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{
      width: 260, height: '100vh', position: 'fixed', left: 0, top: 0,
      background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(0, 0, 0, 0.08)',
      display: 'flex', flexDirection: 'column', padding: '20px 16px', boxSizing: 'border-box', zIndex: 100,
    }}>
      {/* App Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, padding: '0 4px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, color: 'white', fontSize: '0.9rem',
          boxShadow: '0 4px 12px var(--primary-glow)',
        }}>
          VRC
        </div>
        <div>
          <h1 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-highlight)', letterSpacing: '0.2px', lineHeight: 1.2 }}>
            Visual Risk & Compliance
          </h1>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Intelligence System</span>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          borderRadius: 10, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)',
          marginBottom: 20,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: user.profilePhotoUrl ? 'none' : 'var(--primary-glow)',
            border: '2px solid var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
            overflow: 'hidden',
          }}>
            {user.profilePhotoUrl ? (
              <img src={user.profilePhotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            )}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-highlight)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.fullName}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <div
              key={item.name}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                color: active ? 'white' : 'var(--text-muted)',
                background: active ? 'var(--primary)' : 'transparent',
                fontWeight: active ? 600 : 500,
                boxShadow: active ? '0 4px 12px var(--primary-glow)' : 'none',
                transition: 'all 0.2s',
                fontSize: '0.85rem',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                  e.currentTarget.style.color = 'var(--text-highlight)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div
        onClick={logout}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
          color: '#f87171', fontWeight: 600, marginTop: 'auto',
          border: '1px solid rgba(239, 68, 68, 0.1)', background: 'rgba(239, 68, 68, 0.02)',
          transition: 'all 0.2s', fontSize: '0.85rem',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.02)'; }}
      >
        <LogOut size={18} />
        <span>Log Out</span>
      </div>
    </div>
  );
};

export default Sidebar;
