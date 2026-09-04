import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, Moon, Sun, Bell, Shield, Trash2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, logout, deleteUserAccount } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    if (!confirm('This will permanently delete all your data. Type DELETE to confirm.')) return;
    try {
      await deleteUserAccount();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 260, padding: 40 }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-highlight)' }}>⚙️ Settings</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Manage your application preferences</p>
        </div>

        <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Appearance */}
          <div className="glass-panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SettingsIcon size={18} /> Appearance
            </h3>
            <div style={{ display: 'flex', gap: 16 }}>
              <button
                onClick={() => setTheme('light')}
                style={{
                  flex: 1, padding: 20, borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${theme === 'light' ? 'var(--primary)' : 'var(--card-border)'}`,
                  background: theme === 'light' ? 'var(--primary-glow)' : 'var(--card-bg)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}
              >
                <Sun size={24} style={{ color: theme === 'light' ? 'var(--primary)' : 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-highlight)' }}>Light Mode</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                style={{
                  flex: 1, padding: 20, borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${theme === 'dark' ? 'var(--primary)' : 'var(--card-border)'}`,
                  background: theme === 'dark' ? 'var(--primary-glow)' : 'var(--card-bg)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}
              >
                <Moon size={24} style={{ color: theme === 'dark' ? 'var(--primary)' : 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-highlight)' }}>Dark Mode</span>
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass-panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={18} /> Notifications
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-highlight)' }}>Budget Alerts</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Get notified when spending exceeds budget limits</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26 }}>
                <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} style={{ display: 'none' }} />
                <span style={{
                  position: 'absolute', inset: 0, cursor: 'pointer', borderRadius: 13,
                  background: notifications ? 'var(--primary)' : 'rgba(0,0,0,0.15)', transition: '0.3s',
                }}>
                  <span style={{
                    position: 'absolute', width: 20, height: 20, left: notifications ? 24 : 3,
                    bottom: 3, background: 'white', borderRadius: '50%', transition: '0.3s',
                  }} />
                </span>
              </label>
            </div>
          </div>

          {/* Security */}
          <div className="glass-panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={18} /> Account
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-highlight)' }}>Email</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-highlight)' }}>Sign Out</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sign out of your account</div>
                </div>
                <button className="btn-secondary" onClick={logout}>Sign Out</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--danger)' }}>Delete Account</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Permanently delete your account and all data</div>
                </div>
                <button className="btn-danger" onClick={handleDeleteAccount} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="glass-panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 16 }}>About</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <p><strong>AI-Based Visual Risk and Compliance Intelligence System</strong> v1.0.0</p>
              <p>An intelligent risk, compliance, decision-support and life simulation platform that builds personalized intelligence models across finances, activity patterns, habits, and compliance metrics.</p>
              <p style={{ marginTop: 8 }}>Powered by Machine Learning, Statistical Forecasting, and Conversational AI.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
