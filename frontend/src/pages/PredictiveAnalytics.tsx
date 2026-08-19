import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  Brain,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Zap,
  AlertTriangle,
  Play,
  Trash2,
  Activity,
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
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

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

interface Simulation {
  id?: string;
  scenarioName: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedSavings: number;
  projectedBalance: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  goalImpact?: any[];
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

  // Decision Simulation State
  const [decisionTemplate, setDecisionTemplate] = useState('purchase');
  const [decisionName, setDecisionName] = useState('Buy a laptop');
  const [decisionAction, setDecisionAction] = useState('purchase');
  const [decisionCategory, setDecisionCategory] = useState('Finance + Education');
  const [affectedDomains, setAffectedDomains] = useState<string[]>(['Finance', 'Study', 'Goals']);
  const [parameters, setParameters] = useState<Record<string, any>>({ purchase_cost: 50000 });
  const [horizon, setHorizon] = useState('1 year');
  
  // Weights / Priorities (1 to 5 scale)
  const [prioSavings, setPrioSavings] = useState(4);
  const [prioGoals, setPrioGoals] = useState(3);
  const [prioProd, setPrioProd] = useState(2);
  const [prioRisk, setPrioRisk] = useState(4);
  const [prioCost, setPrioCost] = useState(3);

  const [activeDecisionSim, setActiveDecisionSim] = useState<any>(null);
  const [savedDecisionSims, setSavedDecisionSims] = useState<any[]>([]);
  const [simulating, setSimulating] = useState(false);

  const fetchDashboard = async () => {
    try {
      setError(null);
      const res = await api.get('/analytics/dashboard');
      
      setScores(res.data.scores);
      setFinance(res.data.finance);
      setStudy(res.data.study);
      setHabits(res.data.habits);
      setPredictionHistory(res.data.predictionHistory || []);

      // Pull recommendations & saved simulations
      const [recsRes, simsRes] = await Promise.all([
        api.get('/analytics/recommendations'),
        api.get('/decision-simulations')
      ]);
      setRecommendations(recsRes.data);
      setSavedDecisionSims(simsRes.data);
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

  // Run Decision Simulation
  const handleRunDecisionSim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSimulating(true);
      setError(null);
      
      const payload = {
        decisionName,
        category: decisionCategory,
        action: decisionAction,
        parameters,
        affectedDomains,
        horizon,
        selectedGoals: [],
        userPriorities: {
          maximize_savings: prioSavings,
          reach_goals_faster: prioGoals,
          improve_productivity: prioProd,
          minimize_risk: prioRisk,
          minimize_cost: prioCost
        }
      };

      const res = await api.post('/decision-simulations', payload);
      setActiveDecisionSim(res.data);
      
      const simsRes = await api.get('/decision-simulations');
      setSavedDecisionSims(simsRes.data);
    } catch (err) {
      console.error(err);
      setError('Simulation failed to run.');
    } finally {
      setSimulating(false);
    }
  };

  const handleDeleteDecisionSim = async (id: string) => {
    try {
      await api.delete(`/decision-simulations/${id}`);
      setSavedDecisionSims(prev => prev.filter(s => s.id !== id));
      if (activeDecisionSim && activeDecisionSim.id === id) setActiveDecisionSim(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecisionTemplateChange = (val: string) => {
    setDecisionTemplate(val);
    if (val === 'purchase') {
      setDecisionName('Buy a laptop');
      setDecisionAction('purchase');
      setDecisionCategory('Finance + Education');
      setAffectedDomains(['Finance', 'Study', 'Goals']);
      setParameters({ purchase_cost: 50000 });
    } else if (val === 'study') {
      setDecisionName('Increase study schedule');
      setDecisionAction('study_hours_change');
      setDecisionCategory('Education');
      setAffectedDomains(['Study', 'Goals']);
      setParameters({ study_hours_change: 1.5 });
    } else if (val === 'expense') {
      setDecisionName('Reduce monthly dining expense');
      setDecisionAction('recurring_expense_change');
      setDecisionCategory('Finance');
      setAffectedDomains(['Finance', 'Goals']);
      setParameters({ expense_change: -4000 });
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
  const habitDetailsMap = habits?.habit_details || {};
  const anomalies = finance?.anomalies || [];
  const healthBreakout = finance?.health_breakout || null;
  const goalPredictions = finance?.goal_predictions || [];

  const habitChartData = Object.keys(habitDetailsMap).map(name => ({
    name: name.length > 15 ? name.substring(0, 15) + '...' : name,
    probability: habitDetailsMap[name].prediction_probability_tomorrow,
    completion: habitDetailsMap[name].completion_percentage,
    streak: habitDetailsMap[name].current_streak
  }));

  const savingsChartData = [
    { name: 'Income', amount: finance?.monthly_income_prediction || 0, fill: '#10b981' },
    { name: 'Expenses', amount: finance?.monthly_expense_prediction || 0, fill: '#ef4444' },
    { name: 'Net Savings', amount: finance?.monthly_savings_prediction || 0, fill: '#6366f1' }
  ];

  const baselineMonthlySavings = finance?.monthly_savings_prediction || 1000.0;

  const renderComparisonChart = () => {
    if (!activeDecisionSim || !activeDecisionSim.outcomes) return null;
    
    const horizonMonths = activeDecisionSim.outcomes[0].balance_trajectory.length;
    const chartData = Array.from({ length: horizonMonths }, (_, i) => {
      const monthNum = i + 1;
      const dataPoint: any = { month: `Month ${monthNum}` };
      activeDecisionSim.outcomes.forEach((o: any) => {
        dataPoint[o.scenario_name] = o.balance_trajectory[i];
      });
      return dataPoint;
    });

    const colors = ['#94a3b8', '#38bdf8', '#6366f1', '#ec4899', '#facc15'];

    return (
      <div style={{ height: '240px', marginTop: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
            <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `₹${v.toLocaleString()}`} />
            <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white' }} formatter={(v: any) => `₹${v.toLocaleString()}`} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            {activeDecisionSim.outcomes.map((o: any, idx: number) => (
              <Line
                key={o.scenario_id}
                type="monotone"
                dataKey={o.scenario_name}
                stroke={colors[idx % colors.length]}
                strokeWidth={o.scenario_id === activeDecisionSim.recommendation.recommended_scenario_id ? 3 : 1.5}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <main style={{ flex: 1, marginLeft: '260px', padding: '40px', boxSizing: 'border-box', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#f8fafc' }}>
        
        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
              AI Predictive Analytics & Simulations
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '4px' }}>
              Compare financial decisions, analyze unusual spending anomalies, and track digital twin health metrics.
            </p>
          </div>

          <button onClick={handleRetrain} disabled={retraining} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)' }}>
            <RefreshCw size={18} className={retraining ? 'spin' : ''} />
            {retraining ? 'Recalculating Models...' : 'Sync & Retrain AI Models'}
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#fca5a5', marginBottom: '28px' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Scores Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '1px' }}>Overall AI Index</span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: 'white' }}>{scores.overallAIScore.toFixed(0)}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '0.8rem', color: '#cbd5e1' }}>
              <Zap size={14} style={{ color: '#facc15' }} />
              <span>Weighted multi-domain indicator</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(30, 27, 75, 0.3)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Financial Health</span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: '#10b981' }}>{scores.financialHealthScore.toFixed(0)}</h2>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
              Confidence Level: <span style={{ color: 'white', fontWeight: 600 }}>{finance?.confidence_score}%</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(30, 27, 75, 0.3)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Productivity Index</span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: '#6366f1' }}>{scores.productivityScore.toFixed(0)}</h2>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
              Confidence Level: <span style={{ color: 'white', fontWeight: 600 }}>{study?.confidence_score}%</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(30, 27, 75, 0.3)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Habits Consistency</span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: '#ec4899' }}>{scores.habitScore.toFixed(0)}</h2>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
              Streak: <span style={{ color: 'white', fontWeight: 600 }}>{habits?.overall_current_streak} days</span>
            </div>
          </div>
        </div>

        {/* Anomaly Detections Block */}
        {anomalies.length > 0 && (
          <div className="glass-panel" style={{ padding: '28px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertTriangle size={20} /> Unusual Spending Detected (Anomaly Log)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {anomalies.map((anom: any, idx: number) => (
                <div key={idx} style={{ padding: '12px 18px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#fca5a5', fontWeight: 700 }}>[{anom.category.toUpperCase()}]</span> {anom.reason} 
                  <span style={{ color: '#cbd5e1', float: 'right' }}>{anom.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goal predictions block */}
        {goalPredictions.length > 0 && (
          <div className="glass-panel" style={{ padding: '28px', background: 'rgba(30, 27, 75, 0.2)', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Savings Goal Timeline Projections</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {goalPredictions.map((gp: any, idx: number) => (
                <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{gp.goalName}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: gp.status === 'ON_TRACK' ? '#10b981' : '#f87171' }}>
                      {gp.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: '4px 0' }}>
                    Est. Completion: **{gp.estimatedCompletionDate}** ({gp.estimatedMonths} months)
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                    Required monthly contribution: **${gp.requiredMonthlyContribution.toFixed(2)}**
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts & Health Breakdown Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '40px' }}>
          
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
                      <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white' }} />
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
                      <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white' }} />
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
                      <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white' }} />
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

          {/* Right Column: Health indicators & advisor & savings breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Health Indicators Breakdown */}
            <div className="glass-panel" style={{ padding: '28px', background: 'rgba(30, 27, 75, 0.3)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px' }}>Financial Health Breakdown</h3>
              
              {healthBreakout ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ color: '#cbd5e1' }}>Savings Rate Capacity</span>
                      <span style={{
                        fontWeight: 700,
                        color: healthBreakout.indicators.savingsRate === 'Good' ? '#10b981' : healthBreakout.indicators.savingsRate === 'Moderate' ? '#fbbf24' : '#ef4444'
                      }}>{healthBreakout.indicators.savingsRate}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Compares monthly savings surplus to total income.</p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ color: '#cbd5e1' }}>Budget Adherence Target</span>
                      <span style={{
                        fontWeight: 700,
                        color: healthBreakout.indicators.budgetAdherence === 'Good' ? '#10b981' : healthBreakout.indicators.budgetAdherence === 'Moderate' ? '#fbbf24' : '#ef4444'
                      }}>{healthBreakout.indicators.budgetAdherence}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Measures spending ratios against overall profile target limit.</p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ color: '#cbd5e1' }}>Emergency Fund Months</span>
                      <span style={{
                        fontWeight: 700,
                        color: healthBreakout.indicators.emergencyFund === 'Good' ? '#10b981' : healthBreakout.indicators.emergencyFund === 'Moderate' ? '#fbbf24' : '#ef4444'
                      }}>{healthBreakout.indicators.emergencyFund}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Evaluates monthly reserves cover in case of income drop.</p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ color: '#cbd5e1' }}>Spending Volatility</span>
                      <span style={{
                        fontWeight: 700,
                        color: healthBreakout.indicators.spendingVolatility === 'Stable' ? '#10b981' : '#fbbf24'
                      }}>{healthBreakout.indicators.spendingVolatility}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Tracks fluctuation of daily expenditures over the past 28 days.</p>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>Breakout metrics pending first forecast.</div>
              )}
            </div>

            {/* AI Advisor Panel */}
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
                      <p style={{ color: '#cbd5e1', margin: 0 }}>{rec.recommendationText}</p>
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
                    <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white' }} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} name="Amount ($)">
                      {savingsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
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
                  <span>Budget Target Limit:</span>
                  <span style={{ fontWeight: 700 }}>{finance?.budget_utilization || 0}%</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Future Scenario Simulation Section */}
        <div className="glass-panel" style={{ padding: '32px', background: 'rgba(30, 27, 75, 0.2)', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} style={{ color: 'var(--primary)' }} /> Future Scenario Simulation
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '24px' }}>
            Choose a decision template, enter its parameters, specify time horizons, adjust priorities, and inspect simulated outcome scenarios side-by-side.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
            
            {/* Input Form - Steps 1-4 */}
            <form onSubmit={handleRunDecisionSim} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>Step 1: Choose Decision Template</label>
                <select
                  value={decisionTemplate}
                  onChange={(e) => handleDecisionTemplateChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e1b4b', color: 'white' }}
                >
                  <option value="purchase">Make a purchase (e.g., Buy Laptop)</option>
                  <option value="study">Increase daily study hours</option>
                  <option value="expense">Reduce recurring expenses</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>Decision Title</label>
                <input
                  type="text"
                  value={decisionName}
                  onChange={(e) => setDecisionName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
              </div>

              {/* Dynamic Parameter Entry - Step 2 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>Step 2: Enter Parameters</label>
                {decisionTemplate === 'purchase' && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Purchase Cost (₹)</span>
                    <input
                      type="number"
                      value={parameters.purchase_cost || 0}
                      onChange={(e) => setParameters({ purchase_cost: Number(e.target.value) })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', marginTop: '4px' }}
                    />
                  </div>
                )}
                {decisionTemplate === 'study' && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Hours to Add Daily (hrs)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={parameters.study_hours_change || 0}
                      onChange={(e) => setParameters({ study_hours_change: Number(e.target.value) })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', marginTop: '4px' }}
                    />
                  </div>
                )}
                {decisionTemplate === 'expense' && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Monthly Spending Change (₹, negative to reduce)</span>
                    <input
                      type="number"
                      value={parameters.expense_change || 0}
                      onChange={(e) => setParameters({ expense_change: Number(e.target.value) })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', marginTop: '4px' }}
                    />
                  </div>
                )}
              </div>

              {/* Time Horizon Selector - Step 3 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>Step 3: Choose Time Horizon</label>
                <select
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e1b4b', color: 'white' }}
                >
                  <option value="1 month">1 Month</option>
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="1 year">1 Year</option>
                  <option value="3 years">3 Years</option>
                  <option value="5 years">5 Years</option>
                </select>
              </div>

              {/* User-Controllable Priorities - Step 4 */}
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '12px', fontWeight: 600 }}>Step 4: Set Priorities (1-5)</label>
                
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>Maximize Savings</span>
                    <span>{prioSavings}</span>
                  </div>
                  <input type="range" min="1" max="5" value={prioSavings} onChange={(e) => setPrioSavings(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>Reach Goals Faster</span>
                    <span>{prioGoals}</span>
                  </div>
                  <input type="range" min="1" max="5" value={prioGoals} onChange={(e) => setPrioGoals(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>Improve Learning/Study</span>
                    <span>{prioProd}</span>
                  </div>
                  <input type="range" min="1" max="5" value={prioProd} onChange={(e) => setPrioProd(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>Minimize Financial Risk</span>
                    <span>{prioRisk}</span>
                  </div>
                  <input type="range" min="1" max="5" value={prioRisk} onChange={(e) => setPrioRisk(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>Minimize Setup Cost</span>
                    <span>{prioCost}</span>
                  </div>
                  <input type="range" min="1" max="5" value={prioCost} onChange={(e) => setPrioCost(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>
              </div>

              {/* Step 5: Run Simulation */}
              <button type="submit" disabled={simulating} className="btn-primary" style={{ padding: '12px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Play size={16} /> {simulating ? 'Running Engine...' : 'Run Decision Simulation'}
              </button>
            </form>

            {/* Results Panel - Steps 6 & 7 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {activeDecisionSim ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Step 7: Personalized Recommendation Panel */}
                  <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Advisor Recommendation</span>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                        RECOMMENDED
                      </span>
                    </div>
                    
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                      {activeDecisionSim.recommendation.recommended_scenario_name}
                    </h4>
                    
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4', marginBottom: '14px' }}>
                      {activeDecisionSim.recommendation.why_selected}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Key Benefits:</span>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                          {activeDecisionSim.recommendation.main_benefits.map((b: string, i: number) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Key Risks:</span>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                          {activeDecisionSim.recommendation.main_risks.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 10px 0' }}>
                      <strong>Trade-offs:</strong> {activeDecisionSim.recommendation.trade_offs}
                    </p>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', fontSize: '0.75rem' }}>
                      <div style={{ color: '#fbbf24', marginBottom: '4px' }}>
                        <strong>Alternative Choice:</strong> {activeDecisionSim.recommendation.alternative_option}
                      </div>
                      <div style={{ color: '#f87171' }}>
                        <strong>Avoid Scenario:</strong> {activeDecisionSim.recommendation.avoid_scenario_name} — <em>{activeDecisionSim.recommendation.avoid_reason}</em>
                      </div>
                    </div>
                  </div>

                  {/* Step 6: Multi-Scenario Comparison Table */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Scenario Comparison Metrics</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                            <th style={{ padding: '8px 12px' }}>Metric</th>
                            {activeDecisionSim.outcomes.map((o: any) => (
                              <th key={o.scenario_id} style={{ padding: '8px 12px', color: o.scenario_id === activeDecisionSim.recommendation.recommended_scenario_id ? 'var(--primary)' : 'white' }}>
                                {o.scenario_name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>Decision Score</td>
                            {activeDecisionSim.ranking.map((r: any) => {
                              const scoreObj = activeDecisionSim.ranking.find((item: any) => item.scenario_id === r.scenario_id);
                              return (
                                <td key={r.scenario_id} style={{ padding: '10px 12px', fontWeight: 700, color: r.scenario_id === activeDecisionSim.recommendation.recommended_scenario_id ? '#10b981' : 'white' }}>
                                  {scoreObj ? scoreObj.overall_score : 'N/A'}
                                </td>
                              );
                            })}
                          </tr>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>Final Proj. Balance</td>
                            {activeDecisionSim.outcomes.map((o: any) => (
                              <td key={o.scenario_id} style={{ padding: '10px 12px' }}>
                                ₹{o.horizon_balance.toLocaleString()}
                              </td>
                            ))}
                          </tr>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>Weekly Study Hours</td>
                            {activeDecisionSim.outcomes.map((o: any) => (
                              <td key={o.scenario_id} style={{ padding: '10px 12px' }}>
                                {o.horizon_study_hours} hrs
                              </td>
                            ))}
                          </tr>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>Risk Level</td>
                            {activeDecisionSim.outcomes.map((o: any) => (
                              <td key={o.scenario_id} style={{ padding: '10px 12px' }}>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: o.risk_level === 'HIGH' ? 'rgba(239,68,68,0.12)' : o.risk_level === 'MODERATE' ? 'rgba(251,191,36,0.12)' : 'rgba(16,185,129,0.12)',
                                  color: o.risk_level === 'HIGH' ? '#f87171' : o.risk_level === 'MODERATE' ? '#fbbf24' : '#10b981'
                                }}>
                                  {o.risk_level}
                                </span>
                              </td>
                            ))}
                          </tr>
                          
                          {/* Goal Projections impact side-by-side */}
                          {activeDecisionSim.outcomes[0].goals_impact.map((gi: any, gIdx: number) => (
                            <tr key={gIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '10px 12px', fontWeight: 600 }}>Goal: {gi.goalName} Proj.</td>
                              {activeDecisionSim.outcomes.map((o: any) => {
                                const matchedGoal = o.goals_impact.find((g: any) => g.goalName === gi.goalName);
                                return (
                                  <td key={o.scenario_id} style={{ padding: '10px 12px' }}>
                                    {matchedGoal ? `${matchedGoal.simulatedMonths} mos` : 'N/A'} 
                                    {matchedGoal && matchedGoal.monthsSaved !== 0 && (
                                      <span style={{ fontSize: '0.7rem', marginLeft: '4px', color: matchedGoal.monthsSaved > 0 ? '#10b981' : '#f87171' }}>
                                        ({matchedGoal.monthsSaved > 0 ? `+${matchedGoal.monthsSaved}` : matchedGoal.monthsSaved} mos)
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Multi-Scenario Timeline Line Chart */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>Projected Cumulative Balance Timeline</h4>
                    {renderComparisonChart()}
                  </div>

                  {/* Assumptions Transparency Banner */}
                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <h5 style={{ margin: '0 0 4px 0', color: '#cbd5e1', fontWeight: 600 }}>Simulation Assumptions:</h5>
                    <ul style={{ margin: 0, paddingLeft: '14px' }}>
                      {activeDecisionSim.assumptions.map((a: string, i: number) => (
                        <li key={i} style={{ marginBottom: '2px' }}>{a}</li>
                      ))}
                    </ul>
                    <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Model Version: {activeDecisionSim.model_version || 'Comparative-MDP-v1.2'}</span>
                      <span>Timestamp: {new Date(activeDecisionSim.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', color: '#64748b', padding: '60px 40px', textAlign: 'center', gap: '12px' }}>
                  <Brain size={36} className="pulse" />
                  <div>
                    <h5 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '4px' }}>Ready for Simulation</h5>
                    <span style={{ fontSize: '0.8rem' }}>Set decision templates, goals, and weights on the left, then click run.</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Stored decision simulations list */}
          {savedDecisionSims.length > 0 && (
            <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
              <h5 style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '12px', fontWeight: 700 }}>Saved Simulation Runs</h5>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {savedDecisionSims.map((s: any) => (
                  <div
                    key={s.id}
                    onClick={() => setActiveDecisionSim(s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: activeDecisionSim && activeDecisionSim.id === s.id ? 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168, 85, 247, 0.2) 100%)' : 'rgba(255,255,255,0.04)',
                      border: activeDecisionSim && activeDecisionSim.id === s.id ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'white' }}>{s.decision.decisionName} ({s.decision.horizon})</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDecisionSim(s.id);
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, marginLeft: '4px', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
