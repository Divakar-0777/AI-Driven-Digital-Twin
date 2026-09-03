import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { RefreshCw, Activity, DollarSign, BookOpen, CheckSquare, Target } from 'lucide-react';

interface TwinState {
  productivityScore: number;
  financialHealthScore: number;
  habitScore: number;
  studyScore: number;
  goalScore: number;
  overallScore: number;
  twinEmoticon: string;
  twinStatus: string;
  personalitySummary: string;
  behaviourSummary: string;
  syncTimestamp: string;
}

export const DigitalTwin: React.FC = () => {
  const { user } = useAuth();
  const [twin, setTwin] = useState<TwinState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTwin = async () => {
    try {
      setError(null);
      const res = await api.get('/digital-twin');
      setTwin(res.data);
    } catch (err) {
      setError('Failed to load digital twin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTwin(); }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await api.post('/digital-twin/sync');
      setTwin(res.data.state || res.data);
      fetchTwin();
    } catch (err) {
      setError('Failed to sync twin state');
    } finally {
      setSyncing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--primary)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: 260, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: 24 }}>Loading Digital Twin...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 260, padding: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              🧠 Digital Twin
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              Your AI-powered digital representation and behaviour model
            </p>
          </div>
          <button onClick={handleSync} disabled={syncing} className="btn-primary">
            <RefreshCw size={16} className={syncing ? 'spinning' : ''} />
            {syncing ? 'Syncing...' : 'Sync Twin'}
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* Twin Avatar & Status */}
        <div className="glass-panel" style={{ padding: 40, marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            fontSize: '6rem', margin: '0 auto 20px', width: 140, height: 140,
            background: 'var(--primary-glow)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px var(--primary-glow)',
          }}>
            {twin?.twinEmoticon || '😐'}
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 8 }}>
            {user?.fullName}'s Digital Twin
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto 16px' }}>
            {twin?.twinStatus || 'Initializing...'}
          </p>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getScoreColor(twin?.overallScore || 0) }}>
            {twin?.overallScore || 0}%
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Overall Twin Health Score</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 8 }}>
            Last synced: {twin?.syncTimestamp ? new Date(twin.syncTimestamp).toLocaleString() : 'Never'}
          </p>
        </div>

        {/* Score Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, marginBottom: 32 }}>
          {[
            { label: 'Financial Health', score: twin?.financialHealthScore || 0, icon: <DollarSign size={20} /> },
            { label: 'Productivity', score: twin?.productivityScore || 0, icon: <Activity size={20} /> },
            { label: 'Study Performance', score: twin?.studyScore || 0, icon: <BookOpen size={20} /> },
            { label: 'Habit Consistency', score: twin?.habitScore || 0, icon: <CheckSquare size={20} /> },
            { label: 'Goal Progress', score: twin?.goalScore || 0, icon: <Target size={20} /> },
          ].map((item, i) => (
            <div key={i} className="glass-panel" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ color: 'var(--primary)', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                {item.icon}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: getScoreColor(item.score) }}>
                {item.score}%
              </div>
              <div style={{ fontSize: '0.75rem', color: getScoreColor(item.score), marginTop: 4 }}>
                {getScoreLabel(item.score)}
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, background: 'rgba(0,0,0,0.05)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${item.score}%`, borderRadius: 2,
                  background: getScoreColor(item.score), transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Score Trend Visualization */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <div className="glass-panel" style={{ padding: 32 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 20 }}>
              📊 Score Radar
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Financial', value: twin?.financialHealthScore || 0 },
                { label: 'Productivity', value: twin?.productivityScore || 0 },
                { label: 'Study', value: twin?.studyScore || 0 },
                { label: 'Habits', value: twin?.habitScore || 0 },
                { label: 'Goals', value: twin?.goalScore || 0 },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: 80 }}>{item.label}</span>
                  <div style={{ flex: 1, height: 8, background: 'rgba(0,0,0,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${item.value}%`, borderRadius: 4,
                      background: `linear-gradient(90deg, var(--primary), ${getScoreColor(item.value)})`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: getScoreColor(item.value), width: 40, textAlign: 'right' }}>
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 32 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 16 }}>
              🤖 Personality Summary
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
              {twin?.personalitySummary || 'Sync your twin to generate a personality summary based on your data patterns.'}
            </p>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 8 }}>
              Behaviour Patterns
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {twin?.behaviourSummary || 'Sync your twin to generate behaviour analysis.'}
            </p>
          </div>
        </div>

        {/* User Profile Info */}
        <div className="glass-panel" style={{ padding: 32 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 20 }}>
            👤 Profile Data Feeding Twin
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Monthly Income', value: `$${user?.monthlyIncome?.toFixed(0) || '0'}` },
              { label: 'Expense Target', value: `$${user?.monthlyExpenseTarget?.toFixed(0) || '0'}` },
              { label: 'Study Target', value: `${user?.dailyStudyHoursTarget || 0} hrs/day` },
              { label: 'Occupation', value: user?.occupation || 'Not set' },
              { label: 'Education', value: user?.educationLevel || 'Not set' },
              { label: 'Study Goal', value: user?.studyGoal || 'Not set' },
            ].map((item, i) => (
              <div key={i} style={{ padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-highlight)' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DigitalTwin;
