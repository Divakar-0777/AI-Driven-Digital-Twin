import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import PlotlyChart from '../components/PlotlyChart';
import DateRangeFilter, { getDateRange } from '../components/DateRangeFilter';
import { DollarSign, BookOpen, CheckSquare, Brain, TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';

interface DashboardData {
  finance?: any;
  study?: any;
  habits?: any;
  scores?: {
    financialHealthScore: number;
    productivityScore: number;
    habitScore: number;
    overallAIScore: number;
  };
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export const Analytics: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('30days');
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const dateRange = useMemo(() => getDateRange(timeFilter), [timeFilter]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, txRes] = await Promise.all([
        api.get('/analytics/dashboard').catch(() => ({ data: null })),
        api.get('/transactions').catch(() => ({ data: [] })),
      ]);
      setData(analyticsRes.data);
      setTransactions(txRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load analytics data. The AI service may be unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const financeForecast = data?.finance?.daily_forecast || [];
  const studyForecast = data?.study?.daily_forecast || [];
  const scores = data?.scores || { financialHealthScore: 0, productivityScore: 0, habitScore: 0, overallAIScore: 0 };

  // Filter transactions by date range
  const filteredTx = useMemo(() => {
    return transactions.filter((t: any) => {
      const d = new Date(t.date);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [transactions, dateRange]);

  // Build expense by category for Plotly sunburst
  const expenseByCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredTx.filter((t: any) => t.type === 'EXPENSE').forEach((t: any) => {
      catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
    });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    return { labels: sorted.map(s => s[0]), values: sorted.map(s => s[1]) };
  }, [filteredTx]);

  // Build cumulative savings over time
  const cumulativeSavings = useMemo(() => {
    const sorted = [...filteredTx].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cumulative = 0;
    const x: string[] = [];
    const y: number[] = [];
    sorted.forEach((t: any) => {
      cumulative += t.type === 'INCOME' ? Number(t.amount) : -Number(t.amount);
      x.push(new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      y.push(cumulative);
    });
    return { x, y };
  }, [filteredTx]);

  // Income vs Expense by month
  const monthlyComparison = useMemo(() => {
    const monthMap: Record<string, { income: number; expense: number }> = {};
    filteredTx.forEach((t: any) => {
      const key = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
      if (t.type === 'INCOME') monthMap[key].income += Number(t.amount);
      else monthMap[key].expense += Number(t.amount);
    });
    const labels = Object.keys(monthMap);
    return {
      income: { x: labels, y: labels.map(l => monthMap[l].income), type: 'bar' as const, name: 'Income', marker: { color: '#10b981' }, hovertemplate: '<b>Income</b><br>%{x}: $%{y:,.0f}<extra></extra>' },
      expense: { x: labels, y: labels.map(l => monthMap[l].expense), type: 'bar' as const, name: 'Expenses', marker: { color: '#ef4444' }, hovertemplate: '<b>Expenses</b><br>%{x}: $%{y:,.0f}<extra></extra>' },
    };
  }, [filteredTx]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: 260, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: 24 }}>Loading Analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 260, padding: 40 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-highlight)' }}>📊 Analytics</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Detailed insights and performance trends</p>
          </div>
          <DateRangeFilter value={timeFilter} onChange={setTimeFilter} />
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* Overall Scores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {[
            { label: 'Financial Health', score: scores.financialHealthScore, icon: <DollarSign size={20} />, color: '#10b981' },
            { label: 'Productivity', score: scores.productivityScore, icon: <BookOpen size={20} />, color: '#6366f1' },
            { label: 'Habit Score', score: scores.habitScore, icon: <CheckSquare size={20} />, color: '#f59e0b' },
            { label: 'Overall AI Score', score: scores.overallAIScore, icon: <Brain size={20} />, color: '#8b5cf6' },
          ].map((item, i) => (
            <div key={i} className="glass-panel" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ color: item.color, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: item.color }}>{item.score?.toFixed(0) || 0}%</div>
              <div style={{ height: 4, background: 'rgba(0,0,0,0.05)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.score || 0}%`, background: item.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* ===== PLOTLY CHARTS ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>

          {/* Expense Forecast with Confidence Band */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} /> Expense Forecast (30 Days)
            </h3>
            {financeForecast.length > 0 ? (
              <PlotlyChart
                data={[
                  {
                    x: financeForecast.map((f: any) => f.date),
                    y: financeForecast.map((f: any) => f.amount),
                    type: 'scatter' as const,
                    mode: 'lines+markers' as const,
                    name: 'Predicted Expense',
                    line: { color: '#6366f1', width: 2.5, shape: 'spline' as const },
                    marker: { size: 4, color: '#6366f1' },
                    fill: 'tozeroy' as const,
                    fillcolor: 'rgba(99,102,241,0.06)',
                    hovertemplate: '<b>Date:</b> %{x}<br><b>Amount:</b> $%{y:,.2f}<extra></extra>',
                  },
                ]}
                height={280}
                layout={{
                  xaxis: { title: '', gridcolor: 'rgba(0,0,0,0.04)', tickformat: '%b %d' },
                  yaxis: { title: 'Amount ($)', gridcolor: 'rgba(0,0,0,0.04)' },
                  hovermode: 'x unified' as const,
                }}
              />
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Add transactions to see forecast
              </div>
            )}
          </div>

          {/* Study Hours Forecast */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} style={{ color: 'var(--success)' }} /> Study Hours Forecast
            </h3>
            {studyForecast.length > 0 ? (
              <PlotlyChart
                data={[{
                  x: studyForecast.map((f: any) => f.date),
                  y: studyForecast.map((f: any) => f.hours),
                  type: 'bar' as const,
                  name: 'Predicted Hours',
                  marker: {
                    color: studyForecast.map((f: any) =>
                      f.hours >= 2.5 ? '#10b981' : f.hours >= 1.5 ? '#f59e0b' : '#ef4444'
                    ),
                    line: { width: 0 },
                  },
                  hovertemplate: '<b>Date:</b> %{x}<br><b>Hours:</b> %{y:.1f}<extra></extra>',
                }]}
                height={280}
                layout={{
                  xaxis: { title: '', gridcolor: 'rgba(0,0,0,0.04)', tickformat: '%b %d' },
                  yaxis: { title: 'Hours', gridcolor: 'rgba(0,0,0,0.04)' },
                  bargap: 0.3,
                  shapes: [{
                    type: 'line', y0: 2.5, y1: 2.5, yref: 'y',
                    x0: 0, x1: 1, xref: 'paper',
                    line: { color: 'rgba(16,185,129,0.4)', width: 1.5, dash: 'dash' },
                  }],
                  annotations: [{
                    x: 1, xref: 'paper', xanchor: 'right' as const,
                    y: 2.5, yref: 'y', yanchor: 'bottom' as const,
                    text: 'Target: 2.5h', showarrow: false,
                    font: { size: 10, color: '#10b981' },
                  }],
                }}
              />
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Add study sessions to see forecast
              </div>
            )}
          </div>

          {/* Cumulative Savings */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} style={{ color: '#8b5cf6' }} /> Cumulative Savings
            </h3>
            {cumulativeSavings.x.length > 0 ? (
              <PlotlyChart
                data={[{
                  x: cumulativeSavings.x,
                  y: cumulativeSavings.y,
                  type: 'scatter' as const,
                  mode: 'lines' as const,
                  name: 'Cumulative Savings',
                  line: { color: '#8b5cf6', width: 2.5, shape: 'spline' as const },
                  fill: 'tozeroy' as const,
                  fillcolor: cumulativeSavings.y[cumulativeSavings.y.length - 1] >= 0
                    ? 'rgba(139,92,246,0.06)' : 'rgba(239,68,68,0.06)',
                  hovertemplate: '<b>%{x}</b><br>Savings: $%{y:,.0f}<extra></extra>',
                }]}
                height={280}
                layout={{
                  xaxis: { title: '', gridcolor: 'rgba(0,0,0,0.04)' },
                  yaxis: { title: 'Cumulative ($)', gridcolor: 'rgba(0,0,0,0.04)' },
                  hovermode: 'x unified' as const,
                }}
              />
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No savings data available
              </div>
            )}
          </div>

          {/* Expense by Category (Sunburst / Pie) */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 12 }}>
              🍩 Expense Breakdown
            </h3>
            {expenseByCategory.labels.length > 0 ? (
              <PlotlyChart
                data={[{
                  type: 'treemap' as const,
                  labels: expenseByCategory.labels,
                  parents: expenseByCategory.labels.map(() => ''),
                  values: expenseByCategory.values,
                  marker: { colors: COLORS.slice(0, expenseByCategory.labels.length) },
                  textinfo: 'label+value+percent parent' as const,
                  textfont: { size: 12 },
                  hovertemplate: '<b>%{label}</b><br>$%{value:,.0f}<br>%{percentParent}<extra></extra>',
                  branchvalues: 'total' as const,
                }]}
                height={280}
                layout={{
                  margin: { l: 5, r: 5, t: 5, b: 5 },
                }}
                config={{ displayModeBar: false }}
              />
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No expense data to display
              </div>
            )}
          </div>
        </div>

        {/* Income vs Expense Monthly Comparison (Full Width) */}
        {filteredTx.length > 0 && (
          <div className="glass-panel" style={{ padding: 24, marginBottom: 32 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} style={{ color: '#f59e0b' }} /> Monthly Income vs Expense Comparison
            </h3>
            <PlotlyChart
              data={[monthlyComparison.income, monthlyComparison.expense]}
              height={320}
              layout={{
                barmode: 'group',
                xaxis: { title: '', gridcolor: 'rgba(0,0,0,0.04)' },
                yaxis: { title: 'Amount ($)', gridcolor: 'rgba(0,0,0,0.04)' },
                hovermode: 'x unified' as const,
              }}
            />
          </div>
        )}

        {/* AI Insights & Financial Health */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          {/* AI Insights */}
          <div className="glass-panel" style={{ padding: 32 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 16 }}>
              🤖 AI-Generated Insights
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Budget Utilization', value: data?.finance?.budget_utilization?.toFixed(1) + '%' || 'N/A', color: 'var(--primary)' },
                { label: 'Overspending Risk', value: data?.finance?.overspending_probability?.toFixed(1) + '%' || 'N/A', color: 'var(--danger)' },
                { label: 'Expense Trend', value: (data?.finance?.expense_trend_pct > 0 ? '+' : '') + (data?.finance?.expense_trend_pct?.toFixed(1) || '0') + '%', color: data?.finance?.expense_trend_pct > 0 ? 'var(--danger)' : 'var(--success)' },
              ].map((item, i) => (
                <div key={i} style={{ padding: 14, background: 'rgba(0,0,0,0.02)', borderRadius: 10, border: '1px solid var(--card-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            {data?.finance?.recommendations && data.finance.recommendations.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 10 }}>Recommendations</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.finance.recommendations.map((rec: string, i: number) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.04)', borderLeft: '3px solid var(--primary)', borderRadius: 6, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Financial Health Details */}
          <div className="glass-panel" style={{ padding: 32 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 16 }}>
              💎 Financial Health
            </h3>
            {data?.finance?.health_breakout ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Gauge-like display */}
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <PlotlyChart
                    data={[{
                      type: 'indicator' as const,
                      mode: 'gauge+number+delta' as const,
                      value: data.finance.health_breakout.score,
                      title: { text: 'Health Score', font: { size: 14, color: '#64748b' } },
                      number: { suffix: '%', font: { size: 32, color: '#6366f1' } },
                      gauge: {
                        axis: { range: [0, 100], tickwidth: 1, tickcolor: '#e2e8f0' },
                        bar: { color: '#6366f1', thickness: 0.3 },
                        bgcolor: 'rgba(0,0,0,0.04)',
                        steps: [
                          { range: [0, 40], color: 'rgba(239,68,68,0.1)' },
                          { range: [40, 70], color: 'rgba(245,158,11,0.1)' },
                          { range: [70, 100], color: 'rgba(16,185,129,0.1)' },
                        ],
                        threshold: {
                          line: { color: '#ef4444', width: 2 },
                          thickness: 0.75,
                          value: data.finance.health_breakout.score,
                        },
                      },
                    }]}
                    height={200}
                    layout={{ margin: { l: 30, r: 30, t: 40, b: 10 } }}
                    config={{ displayModeBar: false }}
                  />
                </div>
                {Object.entries(data.finance.health_breakout.indicators || {}).map(([key, val]: [string, any]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      color: val === 'Good' || val === 'Stable' ? 'var(--success)' : val === 'Moderate' ? 'var(--warning)' : 'var(--danger)',
                      background: val === 'Good' || val === 'Stable' ? 'rgba(16,185,129,0.1)' : val === 'Moderate' ? 'rgba(217,119,6,0.1)' : 'rgba(239,68,68,0.1)',
                    }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Financial health data will appear after adding transactions
              </div>
            )}
          </div>
        </div>

        {/* Study Analytics */}
        {data?.study && (
          <div className="glass-panel" style={{ padding: 32 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 16 }}>
              📚 Study Analytics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
              {[
                { label: 'Avg Study Hours', value: data.study.average_study_hours?.toFixed(1) + ' hrs' || 'N/A' },
                { label: 'Productivity Score', value: data.study.productivity_score?.toFixed(0) + '%' || 'N/A' },
                { label: 'Focus Score', value: data.study.focus_score?.toFixed(0) + '%' || 'N/A' },
                { label: 'Consistency', value: data.study.consistency_score?.toFixed(0) + '%' || 'N/A' },
              ].map((item, i) => (
                <div key={i} style={{ padding: 16, background: 'rgba(0,0,0,0.02)', borderRadius: 10, border: '1px solid var(--card-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Study Score Radar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 }}>
              <PlotlyChart
                data={[{
                  type: 'scatterpolar' as const,
                  r: [
                    data.study.productivity_score || 0,
                    data.study.focus_score || 0,
                    data.study.consistency_score || 0,
                    Math.min(100, (data.study.average_study_hours || 0) / 3 * 100),
                    data.study.productivity_score || 0,
                  ],
                  theta: ['Productivity', 'Focus', 'Consistency', 'Study Volume', 'Productivity'],
                  fill: 'toself' as const,
                  fillcolor: 'rgba(16,185,129,0.1)',
                  line: { color: '#10b981', width: 2 },
                  marker: { size: 5, color: '#10b981' },
                  hovertemplate: '<b>%{theta}</b>: %{r:.0f}%<extra></extra>',
                }]}
                height={250}
                layout={{
                  polar: {
                    radialaxis: { visible: true, range: [0, 100], gridcolor: 'rgba(0,0,0,0.05)', tickfont: { size: 9 } },
                    angularaxis: { gridcolor: 'rgba(0,0,0,0.05)', tickfont: { size: 10 } },
                    bgcolor: 'transparent',
                  },
                  showlegend: false,
                  margin: { l: 60, r: 60, t: 20, b: 20 },
                }}
                config={{ displayModeBar: false }}
              />

              <div>
                {data.study.recommendations && data.study.recommendations.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 10 }}>Study Recommendations</h4>
                    {data.study.recommendations.map((rec: string, i: number) => (
                      <div key={i} style={{ padding: '8px 12px', marginBottom: 8, background: 'rgba(16,185,129,0.04)', borderLeft: '3px solid var(--success)', borderRadius: 6, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {rec}
                      </div>
                    ))}
                  </div>
                )}
                {data.study.best_study_time && (
                  <div style={{ padding: 12, background: 'rgba(99,102,241,0.04)', borderRadius: 8, marginTop: 12 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Best Study Time: </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{data.study.best_study_time}</span>
                  </div>
                )}
                {data.study.burnout_risk && (
                  <div style={{ padding: 12, background: data.study.burnout_risk === 'High' ? 'rgba(239,68,68,0.06)' : data.study.burnout_risk === 'Medium' ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)', borderRadius: 8, marginTop: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Burnout Risk: </span>
                    <span style={{
                      fontSize: '0.85rem', fontWeight: 700,
                      color: data.study.burnout_risk === 'High' ? 'var(--danger)' : data.study.burnout_risk === 'Medium' ? 'var(--warning)' : 'var(--success)',
                    }}>{data.study.burnout_risk}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
