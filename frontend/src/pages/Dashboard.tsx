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

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [study, setStudy] = useState<StudySummary | null>(null);
  const [habitsCount, setHabitsCount] = useState({ completed: 0, total: 0 });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [finRes, studyRes, habitRes, actRes] = await Promise.all([
          api.get('/transactions/summary'),
          api.get('/study/total-hours'),
          api.get('/habits'),
          api.get('/activity'),
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
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch dashboard data. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
            <span>Milestone 1 Active</span>
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

        {/* Goals & Main Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', marginBottom: '32px' }}>
          
          {/* Active Goals Panel */}
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
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {act.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default Dashboard;
