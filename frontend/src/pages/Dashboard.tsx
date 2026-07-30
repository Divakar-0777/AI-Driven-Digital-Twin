import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  History 
} from 'lucide-react';

interface FinanceSummary {
  monthlyExpenseTarget: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  expenseVsTargetStatus: string;
}

interface StudySummary {
  totalHours: number;
  sessionCount: number;
  averageProductivity: number;
}

interface ActivityLog {
  id: string;
  activityType: string;
  description: string;
  timestamp: string;
}

interface DigitalTwin {
  productivityScore: number;
  financialHealthScore: number;
  twinEmoticon: string;
  twinStatus: string;
}

interface Recommendation {
  id: string;
  category: string;
  recommendationText: string;
  impactLevel: string;
  isApplied: boolean;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [study, setStudy] = useState<StudySummary | null>(null);
  const [habitsCount, setHabitsCount] = useState({ completed: 0, total: 0 });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [twin, setTwin] = useState<DigitalTwin | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [finRes, studyRes, habitRes, actRes, twinRes, recRes, notifRes] = await Promise.all([
        api.get('/transactions/summary'),
        api.get('/study/total-hours'),
        api.get('/habits'),
        api.get('/activity'),
        api.get('/digital-twin'),
        api.get('/recommendations'),
        api.get('/notifications'),
      ]);

      setFinance(finRes.data);
      setStudy(studyRes.data);
      
      // Calculate habits completed today
      const todayStr = new Date().toISOString().split('T')[0];
      const todayHabits = habitRes.data.filter((h: any) => h.date.startsWith(todayStr));
      const completed = todayHabits.filter((h: any) => h.completed).length;
      setHabitsCount({
        completed,
        total: todayHabits.length,
      });

      // Top 5 activities
      setActivities(actRes.data.slice(0, 5));
      
      // Twin, Recs, Notifs
      setTwin(twinRes.data);
      setRecommendations(recRes.data.filter((r: any) => !r.isApplied));
      setNotifications(notifRes.data.filter((n: any) => !n.isRead));
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDismissNotification = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const handleApplyRecommendation = async (id: string) => {
    try {
      await api.put(`/recommendations/${id}/apply`);
      setRecommendations(prev => prev.filter(r => r.id !== id));
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to apply recommendation:', err);
    }
  };

  const handleSyncTwin = async () => {
    try {
      setSyncing(true);
      const res = await api.post('/digital-twin/sync');
      setTwin(res.data.state);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to sync digital twin:', err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: '260px', padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      
      <main style={{
        flex: 1,
        marginLeft: '260px',
        padding: '40px',
        boxSizing: 'border-box',
      }}>
        {/* Notifications Alert List */}
        {notifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {notifications.map(n => (
              <div key={n.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                background: n.type === 'ALERT' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                border: n.type === 'ALERT' ? '1px solid var(--danger)' : '1px solid var(--primary)',
                color: 'white',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700 }}>{n.type === 'ALERT' ? '⚠️ Alert:' : '📢 Notice:'}</span>
                  <span>{n.message}</span>
                </div>
                <button 
                  onClick={() => handleDismissNotification(n.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Welcome Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              Hello, {user?.fullName.split(' ')[0]}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              Here is an overview of your productivity & financial status for this month.
            </p>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-highlight)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            <span>Digital Twin Active</span>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {/* 4 Metric Summary Cards */}
        <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
          
          {/* Net Income Card */}
          <div className="glass-panel" style={{ gridColumn: 'span 3', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Net Savings</span>
              <div style={{ color: 'var(--primary)' }}><DollarSign size={20} /></div>
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              ${finance?.netSavings.toFixed(2) || '0.00'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <TrendingUp size={14} /> +${finance?.totalIncome.toFixed(2) || '0.00'} Inc
              </span>
            </div>
          </div>

          {/* Expenses vs Budget Card */}
          <div className="glass-panel" style={{ gridColumn: 'span 3', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Expenses vs Target</span>
              <div style={{ color: finance?.expenseVsTargetStatus === 'OVER_BUDGET' ? 'var(--danger)' : 'var(--success)' }}>
                <TrendingDown size={20} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              ${finance?.totalExpense.toFixed(2) || '0.00'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              Target: <span style={{ color: 'var(--text-highlight)', fontWeight: 600 }}>${finance?.monthlyExpenseTarget.toFixed(2) || '0.00'}</span>
            </p>
          </div>

          {/* Study hours Card */}
          <div className="glass-panel" style={{ gridColumn: 'span 3', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Study Hours</span>
              <div style={{ color: 'var(--primary)' }}><Clock size={20} /></div>
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              {study?.totalHours.toFixed(1) || '0.0'} hrs
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              Target: <span style={{ color: 'var(--text-highlight)', fontWeight: 600 }}>{user?.dailyStudyHoursTarget || 0} hrs/day</span>
            </p>
          </div>

          {/* Habits Card */}
          <div className="glass-panel" style={{ gridColumn: 'span 3', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Habits Today</span>
              <div style={{ color: 'var(--success)' }}><CheckCircle2 size={20} /></div>
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              {habitsCount.completed} / {habitsCount.total}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              {habitsCount.total > 0
                ? `${Math.round((habitsCount.completed / habitsCount.total) * 100)}% completion rate`
                : 'No habits logged for today'}
            </p>
          </div>

        </div>

        {/* Goals & Main Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', marginBottom: '32px' }}>
          
          {/* Left Column: Targets & AI Advice */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Active Targets Panel */}
            <div className="glass-panel" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen size={20} style={{ color: 'var(--primary)' }} /> Core Targets & Aims
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h5 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Long-Term Study Goal</h5>
                  <div style={{
                    padding: '16px',
                    background: 'rgba(0,0,0,0.02)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    color: 'var(--text-highlight)',
                    fontWeight: 500
                  }}>
                    {user?.studyGoal || 'No study goal defined. Head to Profile to set one.'}
                  </div>
                </div>

                <div>
                  <h5 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Habit Targets Summary</h5>
                  <div style={{
                    padding: '16px',
                    background: 'rgba(0,0,0,0.02)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    color: 'var(--text-highlight)',
                    fontWeight: 500
                  }}>
                    {user?.habitGoals || 'No habits summary set yet.'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="glass-card">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Study Rating</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                      {study?.averageProductivity ? `★ ${study.averageProductivity}/5` : 'N/A'}
                    </div>
                  </div>
                  <div className="glass-card">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Status</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--success)', marginTop: '10px' }}>
                      Verified Account
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Advisor Panel */}
            <div className="glass-panel" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                💡 AI Advisor Recommendations
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recommendations.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
                    No pending recommendations. Your twin advisor is happy!
                  </div>
                ) : (
                  recommendations.map((rec) => (
                    <div key={rec.id} style={{
                      padding: '16px',
                      background: 'rgba(0,0,0,0.02)',
                      borderLeft: rec.impactLevel === 'HIGH' ? '4px solid var(--danger)' : rec.impactLevel === 'MEDIUM' ? '4px solid var(--warning)' : '4px solid var(--primary)',
                      borderTop: '1px solid var(--card-border)',
                      borderRight: '1px solid var(--card-border)',
                      borderBottom: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            background: 'var(--primary-glow)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {rec.category}
                          </span>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: rec.impactLevel === 'HIGH' ? 'var(--danger)' : rec.impactLevel === 'MEDIUM' ? 'var(--warning)' : 'var(--text-muted)'
                          }}>
                            {rec.impactLevel} IMPACT
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                          {rec.recommendationText}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleApplyRecommendation(rec.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: AI Digital Twin & Audit Logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* AI Digital Twin Avatar Panel */}
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: '16px' }}>
                🤖 AI Digital Twin
              </h3>
              
              <div style={{
                fontSize: '5rem',
                margin: '20px auto',
                width: '120px',
                height: '120px',
                background: 'var(--primary-glow)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px var(--primary-glow)',
              }}>
                {twin?.twinEmoticon || '😐'}
              </div>
              
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', marginTop: '16px', padding: '0 10px' }}>
                {twin?.twinStatus || 'Loading state...'}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
                <div className="glass-card" style={{ padding: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Productivity Score</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                    {twin?.productivityScore || 50}%
                  </div>
                </div>
                <div className="glass-card" style={{ padding: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Financial Health</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                    {twin?.financialHealthScore || 50}%
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSyncTwin} 
                disabled={syncing}
                className="btn-primary" 
                style={{ marginTop: '20px', width: '100%', padding: '10px' }}
              >
                {syncing ? 'Syncing...' : 'Sync Twin State'}
              </button>
            </div>

            {/* Activity Logs Panel */}
            <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={20} style={{ color: 'var(--primary)' }} /> Recent Activity Logs
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
                {activities.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                    No recent activities logged
                  </div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--card-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: act.activityType.includes('Completed') || act.activityType.includes('Registered')
                            ? 'var(--success)'
                            : act.activityType.includes('Login') ? 'var(--primary)' : 'var(--text-highlight)',
                          background: 'rgba(0,0,0,0.03)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {act.activityType}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                        {act.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
};

export default Dashboard;
