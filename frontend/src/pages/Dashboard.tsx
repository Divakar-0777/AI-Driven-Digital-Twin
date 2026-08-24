import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PlotlyChart from '../components/PlotlyChart';
import DateRangeFilter, { getDateRange } from '../components/DateRangeFilter';
import {
  DollarSign, TrendingUp, TrendingDown, BookOpen, Clock,
  CheckCircle2, History, BarChart3
} from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  category: string;
  type: string;
  amount: number;
  date: string;
}

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
  habitScore?: number;
  studyScore?: number;
  goalScore?: number;
  overallScore?: number;
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

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [study, setStudy] = useState<StudySummary | null>(null);
  const [habitsCount, setHabitsCount] = useState({ completed: 0, total: 0 });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [twin, setTwin] = useState<DigitalTwin | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('30days');

  const dateRange = useMemo(() => getDateRange(dateFilter), [dateFilter]);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [finRes, studyRes, habitRes, actRes, twinRes, recRes, notifRes, txRes] = await Promise.all([
        api.get('/transactions/summary'),
        api.get('/study/total-hours'),
        api.get('/habits'),
        api.get('/activity'),
        api.get('/digital-twin'),
        api.get('/recommendations'),
        api.get('/notifications'),
        api.get('/transactions'),
      ]);

      setFinance(finRes.data);
      setStudy(studyRes.data);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayHabits = habitRes.data.filter((h: any) => h.date.startsWith(todayStr));
      const completed = todayHabits.filter((h: any) => h.completed).length;
      setHabitsCount({ completed, total: todayHabits.length });

      setActivities(actRes.data.slice(0, 5));
      setTwin(twinRes.data);
      setRecommendations(recRes.data.filter((r: any) => !r.isApplied));
      setNotifications(notifRes.data.filter((n: any) => !n.isRead));
      setTransactions(txRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  // Filter transactions by date range
  const filteredTx = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [transactions, dateRange]);

  // Build monthly income vs expense chart data
  const incomeVsExpenseData = useMemo(() => {
    const monthMap: Record<string, { income: number; expense: number }> = {};
    filteredTx.forEach(t => {
      const key = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
      if (t.type === 'INCOME') monthMap[key].income += Number(t.amount);
      else monthMap[key].expense += Number(t.amount);
    });
    const labels = Object.keys(monthMap);
    return {
      incomeTrace: {
        x: labels, y: labels.map(l => monthMap[l].income),
        type: 'bar' as const, name: 'Income',
        marker: { color: '#10b981', line: { width: 0 } },
        hovertemplate: '<b>Income</b><br>%{x}: $%{y:,.0f}<extra></extra>',
      },
      expenseTrace: {
        x: labels, y: labels.map(l => monthMap[l].expense),
        type: 'bar' as const, name: 'Expenses',
        marker: { color: '#ef4444', line: { width: 0 } },
        hovertemplate: '<b>Expenses</b><br>%{x}: $%{y:,.0f}<extra></extra>',
      },
    };
  }, [filteredTx]);

  // Build savings trend
  const savingsTrendData = useMemo(() => {
    const monthMap: Record<string, { income: number; expense: number }> = {};
    filteredTx.forEach(t => {
      const key = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
      if (t.type === 'INCOME') monthMap[key].income += Number(t.amount);
      else monthMap[key].expense += Number(t.amount);
    });
    const labels = Object.keys(monthMap);
    const savings = labels.map(l => monthMap[l].income - monthMap[l].expense);
    return {
      x: labels, y: savings, type: 'scatter' as const, mode: 'lines+markers' as const,
      name: 'Net Savings', fill: 'tozeroy' as const,
      line: { color: '#6366f1', width: 2.5, shape: 'spline' as const },
      marker: { size: 6, color: '#6366f1' },
      fillcolor: 'rgba(99,102,241,0.08)',
      hovertemplate: '<b>Net Savings</b><br>%{x}: $%{y:,.0f}<extra></extra>',
    };
  }, [filteredTx]);

  // Build category spending
  const categorySpendingData = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredTx.filter(t => t.type === 'EXPENSE').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
    });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    return {
      labels: sorted.map(s => s[0]),
      values: sorted.map(s => s[1]),
    };
  }, [filteredTx]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: 260, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: 24 }}>Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 260, padding: 40, boxSizing: 'border-box' }}>
        {/* Notifications */}
        {notifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {notifications.map(n => (
              <div key={n.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 20px',
                background: n.type === 'ALERT' ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
                border: n.type === 'ALERT' ? '1px solid var(--danger)' : '1px solid var(--primary)',
                borderRadius: 8, fontSize: '0.85rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700 }}>{n.type === 'ALERT' ? '⚠️' : '📢'}</span>
                  <span>{n.message}</span>
                </div>
                <button onClick={() => api.put(`/notifications/${n.id}/read`).then(() => setNotifications(prev => prev.filter(x => x.id !== n.id)))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Welcome & Date Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
              Hello, {user?.fullName.split(' ')[0]}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              Here is an overview of your productivity & financial status.
            </p>
          </div>
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="dashboard-grid" style={{ marginBottom: 32 }}>
          {[
            { label: 'Net Savings', value: `$${finance?.netSavings.toFixed(2) || '0.00'}`, icon: <DollarSign size={20} />, color: 'var(--primary)', sub: `+$${finance?.totalIncome.toFixed(2) || '0.00'} income` },
            { label: 'Expenses vs Target', value: `$${finance?.totalExpense.toFixed(2) || '0.00'}`, icon: <TrendingDown size={20} />, color: finance?.expenseVsTargetStatus === 'OVER_BUDGET' ? 'var(--danger)' : 'var(--success)', sub: `Target: $${finance?.monthlyExpenseTarget.toFixed(2) || '0.00'}` },
            { label: 'Total Study Hours', value: `${study?.totalHours.toFixed(1) || '0.0'} hrs`, icon: <Clock size={20} />, color: 'var(--primary)', sub: `Target: ${user?.dailyStudyHoursTarget || 0} hrs/day` },
            { label: 'Habits Today', value: `${habitsCount.completed} / ${habitsCount.total}`, icon: <CheckCircle2 size={20} />, color: 'var(--success)', sub: habitsCount.total > 0 ? `${Math.round((habitsCount.completed / habitsCount.total) * 100)}% completion` : 'No habits logged' },
          ].map((card, i) => (
            <div key={i} className="glass-panel" style={{ gridColumn: 'span 3', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>{card.label}</span>
                <div style={{ color: card.color }}>{card.icon}</div>
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-highlight)' }}>{card.value}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12 }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ===== PLOTLY CHARTS SECTION ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>

          {/* Income vs Expense Bar Chart */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} style={{ color: 'var(--primary)' }} /> Income vs Expenses
            </h3>
            {filteredTx.length > 0 ? (
              <PlotlyChart
                data={[incomeVsExpenseData.incomeTrace, incomeVsExpenseData.expenseTrace]}
                height={280}
                layout={{
                  barmode: 'group',
                  xaxis: { title: '', gridcolor: 'rgba(0,0,0,0.04)' },
                  yaxis: { title: 'Amount ($)', gridcolor: 'rgba(0,0,0,0.04)' },
                }}
              />
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No transactions in this period
              </div>
            )}
          </div>

          {/* Savings Trend */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--success)' }} /> Savings Trend
            </h3>
            {filteredTx.length > 0 ? (
              <PlotlyChart
                data={[savingsTrendData]}
                height={280}
                layout={{
                  xaxis: { title: '', gridcolor: 'rgba(0,0,0,0.04)' },
                  yaxis: { title: 'Savings ($)', gridcolor: 'rgba(0,0,0,0.04)' },
                  shapes: [{
                    type: 'line', y0: 0, y1: 0, yref: 'y',
                    x0: 0, x1: 1, xref: 'paper',
                    line: { color: 'rgba(239,68,68,0.3)', width: 1, dash: 'dot' },
                  }],
                }}
              />
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No data to show savings trend
              </div>
            )}
          </div>

          {/* Category Spending Sunburst */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 12 }}>
              📊 Spending by Category
            </h3>
            {categorySpendingData.labels.length > 0 ? (
              <PlotlyChart
                data={[{
                  type: 'pie' as const,
                  labels: categorySpendingData.labels,
                  values: categorySpendingData.values,
                  hole: 0.45,
                  marker: { colors: COLORS.slice(0, categorySpendingData.labels.length) },
                  textinfo: 'percent+label' as const,
                  textposition: 'outside' as const,
                  textfont: { size: 11 },
                  hovertemplate: '<b>%{label}</b><br>$%{value:,.0f}<br>%{percent}<extra></extra>',
                  pull: categorySpendingData.labels.map((_, i) => i === 0 ? 0.05 : 0),
                }]}
                height={280}
                layout={{
                  showlegend: false,
                  margin: { l: 10, r: 10, t: 10, b: 10 },
                }}
                config={{ displayModeBar: false }}
              />
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No expense data to display
              </div>
            )}
          </div>

          {/* Twin Score Radar */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 12 }}>
              🧠 Digital Twin Score Radar
            </h3>
            <PlotlyChart
              data={[{
                type: 'scatterpolar' as const,
                r: [
                  twin?.financialHealthScore || 0,
                  twin?.productivityScore || 0,
                  twin?.studyScore || 0,
                  twin?.habitScore || 0,
                  twin?.goalScore || 0,
                  twin?.financialHealthScore || 0,
                ],
                theta: ['Finance', 'Productivity', 'Study', 'Habits', 'Goals', 'Finance'],
                fill: 'toself' as const,
                fillcolor: 'rgba(99,102,241,0.12)',
                line: { color: '#6366f1', width: 2 },
                marker: { size: 6, color: '#6366f1' },
                hovertemplate: '<b>%{theta}</b>: %{r}%<extra></extra>',
              }]}
              height={280}
              layout={{
                polar: {
                  radialaxis: { visible: true, range: [0, 100], gridcolor: 'rgba(0,0,0,0.05)', tickfont: { size: 9 } },
                  angularaxis: { gridcolor: 'rgba(0,0,0,0.05)', tickfont: { size: 11 } },
                  bgcolor: 'transparent',
                },
                showlegend: false,
                margin: { l: 50, r: 50, t: 20, b: 20 },
              }}
              config={{ displayModeBar: false }}
            />
          </div>
        </div>

        {/* Goals & Main Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32, marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Active Targets */}
            <div className="glass-panel" style={{ padding: 32 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <BookOpen size={20} style={{ color: 'var(--primary)' }} /> Core Targets & Aims
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h5 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 6 }}>Long-Term Study Goal</h5>
                  <div style={{ padding: 16, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--card-border)', borderRadius: 10, color: 'var(--text-highlight)', fontWeight: 500 }}>
                    {user?.studyGoal || 'No study goal defined. Head to Profile to set one.'}
                  </div>
                </div>
                <div>
                  <h5 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 6 }}>Habit Targets Summary</h5>
                  <div style={{ padding: 16, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--card-border)', borderRadius: 10, color: 'var(--text-highlight)', fontWeight: 500 }}>
                    {user?.habitGoals || 'No habits summary set yet.'}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="glass-card">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Study Rating</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>
                      {study?.averageProductivity ? `★ ${study.averageProductivity}/5` : 'N/A'}
                    </div>
                  </div>
                  <div className="glass-card">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Status</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--success)', marginTop: 10 }}>
                      Verified Account
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Advisor */}
            <div className="glass-panel" style={{ padding: 32 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                💡 AI Advisor Recommendations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {recommendations.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
                    No pending recommendations. Your twin advisor is happy!
                  </div>
                ) : (
                  recommendations.map((rec) => (
                    <div key={rec.id} style={{
                      padding: 16, background: 'rgba(0,0,0,0.02)',
                      borderLeft: rec.impactLevel === 'HIGH' ? '4px solid var(--danger)' : rec.impactLevel === 'MEDIUM' ? '4px solid var(--warning)' : '4px solid var(--primary)',
                      borderTop: '1px solid var(--card-border)', borderRight: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)',
                      borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '2px 6px', borderRadius: 4 }}>
                            {rec.category}
                          </span>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: rec.impactLevel === 'HIGH' ? 'var(--danger)' : rec.impactLevel === 'MEDIUM' ? 'var(--warning)' : 'var(--text-muted)' }}>
                            {rec.impactLevel} IMPACT
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                          {rec.recommendationText}
                        </p>
                      </div>
                      <button onClick={() => api.put(`/recommendations/${rec.id}/apply`).then(() => { setRecommendations(prev => prev.filter(r => r.id !== rec.id)); fetchDashboardData(); })}
                        style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                        Apply
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Digital Twin Avatar */}
            <div className="glass-panel" style={{ padding: 32, textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 16 }}>
                🤖 AI Digital Twin
              </h3>
              <div style={{
                fontSize: '5rem', margin: '20px auto', width: 120, height: 120,
                background: 'var(--primary-glow)', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px var(--primary-glow)',
              }}>
                {twin?.twinEmoticon || '😐'}
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-highlight)', marginTop: 16, padding: '0 10px' }}>
                {twin?.twinStatus || 'Loading state...'}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <div className="glass-card" style={{ padding: 12 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Productivity</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>{twin?.productivityScore || 50}%</div>
                </div>
                <div className="glass-card" style={{ padding: 12 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Financial Health</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>{twin?.financialHealthScore || 50}%</div>
                </div>
              </div>
              <button onClick={async () => { setSyncing(true); try { await api.post('/digital-twin/sync'); fetchDashboardData(); } finally { setSyncing(false); } }}
                disabled={syncing} className="btn-primary" style={{ marginTop: 20, width: '100%', padding: 10 }}>
                {syncing ? 'Syncing...' : 'Sync Twin State'}
              </button>
            </div>

            {/* Activity Logs */}
            <div className="glass-panel" style={{ padding: 32, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <History size={20} style={{ color: 'var(--primary)' }} /> Recent Activity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflowY: 'auto' }}>
                {activities.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No recent activities</div>
                ) : activities.map((act) => (
                  <div key={act.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.8rem', fontWeight: 700,
                        color: act.activityType.includes('Completed') || act.activityType.includes('Registered') ? 'var(--success)' : act.activityType.includes('Login') ? 'var(--primary)' : 'var(--text-highlight)',
                        background: 'rgba(0,0,0,0.03)', padding: '2px 8px', borderRadius: 4,
                      }}>{act.activityType}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{act.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
