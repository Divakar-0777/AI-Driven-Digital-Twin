import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  TrendingUp,
  Brain,
  DollarSign,
  BookOpen,
  CheckCircle,
  Activity,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Zap,
  Percent,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface ForecastItem {
  date: string;
  amount?: number;
  hours?: number;
}

interface ScoreCard {
  financialHealthScore: number;
  productivityScore: number;
  habitScore: number;
  overallAIScore: number;
}

interface Recommendation {
  category: 'FINANCE' | 'STUDY' | 'HABITS';
  recommendationText: string;
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface PredictionHistoryLog {
  id: string;
  predictionType: string;
  predictionResult: any;
  confidenceScore: number;
  createdAt: string;
}

export const PredictiveAnalytics: React.FC = () => {
  const [scores, setScores] = useState<ScoreCard>({
    financialHealthScore: 0.0,
    productivityScore: 0.0,
    habitScore: 0.0,
    overallAIScore: 0.0
  });

  const [finance, setFinance] = useState<any>(null);
  const [study, setStudy] = useState<any>(null);
  const [habits, setHabits] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistoryLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setError(null);
      const res = await api.get('/analytics/dashboard');
      
      setScores(res.data.scores);
      setFinance(res.data.finance);
      setStudy(res.data.study);
      setHabits(res.data.habits);
      setPredictionHistory(res.data.predictionHistory || []);

      // Pull recommendations
      const recsRes = await api.get('/analytics/recommendations');
      setRecommendations(recsRes.data);
    } catch (err: any) {
      console.error('Failed to load predictive analytics:', err);
      setError('Could not fetch predictive intelligence. Make sure the AI Microservice is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      setError(null);
      
      // Hit endpoints to sync database state & retrain
      await Promise.all([
        api.post('/predict/finance'),
        api.post('/predict/study'),
        api.post('/predict/habits')
      ]);

      await fetchDashboard();
    } catch (err: any) {
      console.error('Failed to retrain ML models:', err);
      setError('Model retraining failed. Please check your data logs or Python service connections.');
    } finally {
      setRetraining(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: '260px', padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <Brain size={48} className="pulse" style={{ color: 'var(--primary)' }} />
            <h3 style={{ color: 'white' }}>Initializing Predictive Intelligence...</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading models & compiling time-series forecasts</span>
          </div>
        </div>
      </div>
    );
  }

  // Pre-process chart data
  const expenseChartData = finance?.daily_forecast || [];
  const studyChartData = study?.daily_forecast || [];
  
  // Format habits completion probability bar chart
  const habitDetailsMap = habits?.habit_details || {};
  const habitChartData = Object.keys(habitDetailsMap).map(name => ({
    name: name.length > 15 ? name.substring(0, 15) + '...' : name,
    probability: habitDetailsMap[name].prediction_probability_tomorrow,
    completion: habitDetailsMap[name].completion_percentage,
    streak: habitDetailsMap[name].current_streak
  }));

  // Savings / Cash Flow Data
  const savingsChartData = [
    { name: 'Income', amount: finance?.monthly_income_prediction || 0, fill: '#10b981' },
    { name: 'Expenses', amount: finance?.monthly_expense_prediction || 0, fill: '#ef4444' },
    { name: 'Net Savings', amount: finance?.monthly_savings_prediction || 0, fill: '#6366f1' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <main style={{
        flex: 1,
        marginLeft: '260px',
        padding: '40px',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        color: '#f8fafc'
      }}>
        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
              Forecasting & Predictive Analytics
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '4px' }}>
              Intelligent predictive modelling & optimization for your daily twin activities.
            </p>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
              border: 'none',
              color: 'white',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
            }}
          >
            <RefreshCw size={18} className={retraining ? 'spin' : ''} />
            {retraining ? 'Recalculating Models...' : 'Sync & Retrain AI Models'}
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#fca5a5',
            marginBottom: '28px',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Score Grid Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
          
          {/* Overall AI Score Card */}
          <div className="glass-panel" style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)', filter: 'blur(10px)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '1px' }}>Overall AI Index</span>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: 'white' }}>{scores.overallAIScore.toFixed(0)}</h2>
              </div>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)' }}>
                <Sparkles size={20} style={{ color: '#c084fc' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '0.8rem', color: '#cbd5e1' }}>
              <Zap size={14} style={{ color: '#facc15' }} />
              <span>Weighted health and execution multiplier</span>
            </div>
          </div>

          {/* Financial Health Score Card */}
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(30, 27, 75, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Financial Health</span>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: '#10b981' }}>{scores.financialHealthScore.toFixed(0)}</h2>
              </div>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)' }}>
                <DollarSign size={20} style={{ color: '#10b981' }} />
              </div>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
              Confidence Level: <span style={{ color: 'white', fontWeight: 600 }}>{finance?.confidence_score}%</span>
            </div>
          </div>

          {/* Productivity Score Card */}
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(30, 27, 75, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Productivity Score</span>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: '#6366f1' }}>{scores.productivityScore.toFixed(0)}</h2>
              </div>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)' }}>
                <BookOpen size={20} style={{ color: '#6366f1' }} />
              </div>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
              Confidence Level: <span style={{ color: 'white', fontWeight: 600 }}>{study?.confidence_score}%</span>
            </div>
          </div>

          {/* Habit Score Card */}
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(30, 27, 75, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Habit Consistency</span>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: '#ec4899' }}>{scores.habitScore.toFixed(0)}</h2>
              </div>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.1)' }}>
                <CheckCircle size={20} style={{ color: '#ec4899' }} />
              </div>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
              Streak: <span style={{ color: 'white', fontWeight: 600 }}>{habits?.overall_current_streak} days</span>
            </div>
          </div>

        </div>

        {/* Charts & Recommendations Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '40px' }}>
          
          {/* Main Forecast Graphs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Expense Forecast Chart */}
            <div className="glass-panel" style={{ padding: '28px', background: 'rgba(30, 27, 75, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Expense Forecast (Next 30 Days)</h3>
                <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  Model: {finance?.model_type || 'Regressor'}
                </span>
              </div>
              <div style={{ height: '240px' }}>
                {expenseChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={expenseChartData}>
                      <defs>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'white' }} />
                      <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" name="Forecasted Spend" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No forecast data available</div>
                )}
              </div>
            </div>

            {/* Study Hours Forecast Chart */}
            <div className="glass-panel" style={{ padding: '28px', background: 'rgba(30, 27, 75, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Study Hours Time-Series Forecast</h3>
                <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  Model: {study?.model_type || 'Prophet/Regressor'}
                </span>
              </div>
              <div style={{ height: '240px' }}>
                {studyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studyChartData}>
                      <defs>
                        <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}h`} />
                      <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'white' }} />
                      <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorStudy)" name="Study Forecast" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No study forecast available</div>
                )}
              </div>
            </div>

            {/* Habits Completion Probabilities */}
            <div className="glass-panel" style={{ padding: '28px', background: 'rgba(30, 27, 75, 0.2)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px' }}>Habit Completion Probabilities (Tomorrow)</h3>
              <div style={{ height: '240px' }}>
                {habitChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'white' }} />
                      <Bar dataKey="probability" fill="#ec4899" radius={[6, 6, 0, 0]} name="Completion Probability (%)" />
                      <Bar dataKey="completion" fill="#10b981" radius={[6, 6, 0, 0]} name="Historical Completion (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No habits data available</div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Recommendations & Health Indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* AI Insights Panel */}
            <div className="glass-panel" style={{ padding: '28px', background: 'rgba(30, 27, 75, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Brain style={{ color: '#c084fc' }} size={22} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI Recommendations</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recommendations.length > 0 ? (
                  recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.02)',
                        borderLeft: `4px solid ${
                          rec.category === 'FINANCE' ? '#ef4444' : rec.category === 'STUDY' ? '#6366f1' : '#ec4899'
                        }`,
                        fontSize: '0.85rem',
                        lineHeight: '1.4'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#94a3b8' }}>{rec.category}</span>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: rec.impactLevel === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'rgba(236,72,153,0.1)',
                          color: rec.impactLevel === 'HIGH' ? '#f87171' : '#f472b6'
                        }}>
                          {rec.impactLevel}
                        </span>
                      </div>
                      <p style={{ color: '#cbd5e1' }}>{rec.recommendationText}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>No current recommendations</div>
                )}
              </div>
            </div>

            {/* Savings Capacity / Financial Forecast Indicators */}
            <div className="glass-panel" style={{ padding: '28px', background: 'rgba(30, 27, 75, 0.3)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px' }}>Monthly Savings Forecast</h3>
              <div style={{ height: '180px', marginBottom: '16px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savingsChartData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'white' }} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} name="Amount ($)">
                      {savingsChartData.map((entry, index) => (
                        <Area key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Overspending Risk:</span>
                  <span style={{ fontWeight: 700, color: (finance?.overspending_probability || 0) > 50 ? '#ef4444' : '#10b981' }}>
                    {finance?.overspending_probability || 0}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Budget Utilization:</span>
                  <span style={{ fontWeight: 700 }}>{finance?.budget_utilization || 0}%</span>
                </div>
              </div>
            </div>

            {/* Accuracy & Confidence Dashboard */}
            <div className="glass-panel" style={{ padding: '24px', background: 'rgba(30, 27, 75, 0.3)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>Expected AI Accuracy</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Finance MAE:</span>
                  <span style={{ fontWeight: 600 }}>{finance?.expected_accuracy || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Study MAE:</span>
                  <span style={{ fontWeight: 600 }}>{study?.expected_accuracy || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Habits Accuracy:</span>
                  <span style={{ fontWeight: 600 }}>{habits?.expected_accuracy || 'N/A'}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Prediction History Table */}
        <div className="glass-panel" style={{ padding: '28px', background: 'rgba(30, 27, 75, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Activity style={{ color: '#6366f1' }} size={22} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Prediction History & Execution Log</h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date Logged</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Model Segment</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Confidence Index</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Predictive Insight Summary</th>
                </tr>
              </thead>
              <tbody>
                {predictionHistory.length > 0 ? (
                  predictionHistory.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#cbd5e1' }}>
                      <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} style={{ color: '#64748b' }} />
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: log.predictionType === 'FINANCE' ? 'rgba(16,185,129,0.1)' : log.predictionType === 'STUDY' ? 'rgba(99,102,241,0.1)' : 'rgba(236,72,153,0.1)',
                          color: log.predictionType === 'FINANCE' ? '#10b981' : log.predictionType === 'STUDY' ? '#818cf8' : '#f472b6'
                        }}>
                          {log.predictionType}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        {(log.confidenceScore * 100).toFixed(0)}%
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                        {log.predictionType === 'FINANCE'
                          ? `Monthly Spend: $${log.predictionResult.monthly_expense_prediction}. Overspend risk: ${log.predictionResult.overspending_probability}%.`
                          : log.predictionType === 'STUDY'
                          ? `Weekly study forecast: ${log.predictionResult.expected_weekly_study_hours} hrs. Focus index: ${log.predictionResult.focus_score.toFixed(0)}%.`
                          : `Completion prob. tomorrow of habits: ${Object.keys(log.predictionResult.habit_details || {}).length} items tracked.`
                        }
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b' }}>
                      No training logs found. Trigger model synchronization to run your first forecast.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default PredictiveAnalytics;
