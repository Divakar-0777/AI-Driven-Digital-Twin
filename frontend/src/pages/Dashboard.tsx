import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Send, Bot, User as UserIcon, RefreshCw, Sparkles, AlertCircle,
  ArrowUpRight, ArrowDownRight, Activity, Calendar
} from 'lucide-react';

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

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [twin, setTwin] = useState<DigitalTwin | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [study, setStudy] = useState<any>(null);
  const [habitsCount, setHabitsCount] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard parameters
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '1Y' | '3Y'>('3M');

  // Conversational AI state
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: '1', role: 'user', content: 'Will I be able to save $50K in the next 3 years?' },
    { id: '2', role: 'assistant', content: "Based on your current savings rate of 20%, you'll reach approximately $45K in 3 years. To reach $50K, I recommend increasing your savings to 22% or reducing dining expenses by $150/month." },
    { id: '3', role: 'user', content: 'What about if I start investing 10% of my income?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [twinRes, notifRes, finRes, studyRes, habitRes] = await Promise.all([
        api.get('/digital-twin'),
        api.get('/notifications'),
        api.get('/transactions/summary'),
        api.get('/study/total-hours'),
        api.get('/habits'),
      ]);

      setTwin(twinRes.data);
      setNotifications(notifRes.data.filter((n: any) => !n.isRead));
      setFinance(finRes.data);
      setStudy(studyRes.data);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayHabits = habitRes.data.filter((h: any) => h.date.startsWith(todayStr));
      const completed = todayHabits.filter((h: any) => h.completed).length;
      setHabitsCount({ completed, total: todayHabits.length });
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to fetch latest digital twin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const query = chatInput;
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/chat', { query });
      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.reply || res.data.message || 'No response received from twin core.',
        mode: res.data.mode
      };
      setChatMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error communicating with AI Assistant. Please check if your AI microservice is online.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper to generate dynamic lines for charts based on selected time range
  const chartData = useMemo(() => {
    const generatePoints = (type: 'savings' | 'productivity' | 'fitness' | 'study') => {
      const netSavings = finance?.netSavings || 1200;
      const studyHours = study?.totalHours || 32;
      const prodScore = twin?.productivityScore || 75;
      const habitScore = twin?.habitScore || 80;

      let length = 10;
      if (timeRange === '1M') length = 6;
      if (timeRange === '3M') length = 10;
      if (timeRange === '1Y') length = 12;
      if (timeRange === '3Y') length = 12;

      const points = [];
      for (let i = 0; i < length; i++) {
        const fraction = i / (length - 1);
        let label = '';
        if (timeRange === '1M') label = `Day ${(i + 1) * 5}`;
        else if (timeRange === '3M') label = `Wk ${i + 1}`;
        else if (timeRange === '1Y') label = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i % 12];
        else if (timeRange === '3Y') label = `Qtr ${i + 1}`;

        let val = 0;
        if (type === 'savings') {
          const base = netSavings * 0.4;
          const target = netSavings * 1.4;
          val = base + (target - base) * fraction + Math.sin(i * 1.3) * (netSavings * 0.04);
        } else if (type === 'productivity') {
          val = prodScore - 6 + fraction * 8 + Math.cos(i * 1.6) * 4;
        } else if (type === 'fitness') {
          val = habitScore - 10 + fraction * 12 + Math.sin(i * 1.8) * 5;
        } else if (type === 'study') {
          const dailyAvg = (studyHours / 30) || 2.4;
          val = dailyAvg * 0.85 + (dailyAvg * 0.3) * fraction + Math.cos(i * 1.2) * 0.25;
        }

        points.push({ name: label, value: Math.max(0, Math.round(val * 10) / 10) });
      }
      return points;
    };

    return {
      savings: generatePoints('savings'),
      productivity: generatePoints('productivity'),
      fitness: generatePoints('fitness'),
      study: generatePoints('study')
    };
  }, [timeRange, finance, study, twin]);

  // Recommendations data
  const staticRecommendations = [
    {
      id: 'rec-1',
      title: 'Increase savings rate to 22% to reach $50K goal on time',
      category: 'Financial Goal',
      impact: '+13% savings',
      color: '#ef4444' // Red/Orange border
    },
    {
      id: 'rec-2',
      title: 'Optimize study schedule: Focus on mornings 9-11 AM for better retention',
      category: 'Productivity',
      impact: '+15% efficiency',
      color: '#fbbf24' // Yellow border
    },
    {
      id: 'rec-3',
      title: 'Add 2 more workout sessions per week to reach fitness goal',
      category: 'Fitness Goal',
      impact: '+20% activity',
      color: '#f97316' // Orange border
    },
    {
      id: 'rec-4',
      title: 'Maintain consistent sleep schedule to improve overall productivity',
      category: 'Well-being',
      impact: 'Stability',
      color: '#10b981' // Green border
    },
    {
      id: 'rec-5',
      title: 'Consider investing 10% of income for long-term wealth growth',
      category: 'Investment',
      impact: '+10% returns',
      color: '#06b6d4' // Teal border
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: 260, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: 24, color: 'var(--text-highlight)' }}>Loading Visual Risk & Compliance Assistant...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 260, padding: '32px 40px', boxSizing: 'border-box' }}>
        
        {/* Page Title & Subtitle */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
            Hello, {user?.fullName?.split(' ')[0] || 'Guest'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.95rem' }}>
            Conversational AI & Dashboard • Completed {habitsCount.completed}/{habitsCount.total} habits today.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', color: '#fca5a5', padding: '12px 20px', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Notifications Bar */}
        {notifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {notifications.map(n => (
              <div key={n.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 18px', background: 'rgba(79, 70, 229, 0.08)',
                border: '1px solid var(--primary)', borderRadius: 8, fontSize: '0.8rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📢</span>
                  <span>{n.message}</span>
                </div>
                <button onClick={() => api.put(`/notifications/${n.id}/read`).then(() => setNotifications(prev => prev.filter(x => x.id !== n.id)))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Browser Mock Card Frame */}
        <div className="glass-panel" style={{ padding: '24px', background: 'var(--card-bg)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)', borderRadius: '20px' }}>
          
          {/* Mock Window Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px', marginBottom: '24px' }}>
            {/* Dots */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fbbf24' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.03)', padding: '4px', borderRadius: '20px' }}>
              <button 
                onClick={() => navigate('/profile')}
                style={{ background: 'transparent', padding: '6px 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}
              >
                Profile & Data
              </button>
              <button 
                onClick={() => navigate('/predictive-analytics')}
                style={{ background: 'transparent', padding: '6px 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}
              >
                Forecasting
              </button>
              <button 
                onClick={() => navigate('/simulations')}
                style={{ background: 'transparent', padding: '6px 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}
              >
                Simulation
              </button>
              <button 
                style={{ background: 'var(--card-bg)', padding: '6px 16px', fontSize: '0.85rem', color: 'var(--text-highlight)', fontWeight: 700, borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              >
                Dashboard
              </button>
            </div>
            <div style={{ width: '60px' }} /> {/* spacer */}
          </div>

          {/* 3-Column Content Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 2fr 1fr', gap: '24px' }}>
            
            {/* COLUMN 1: Visual Risk & Compliance AI Chat */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: '16px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--card-border)', borderRadius: '16px' }}>
              
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                    Visual Risk & Compliance AI
                  </h3>
                  <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                </div>
                <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                  AI Powered
                </span>
              </div>

              {/* Chat Thread */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', marginBottom: '16px' }}>
                {chatMessages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '8px' }}>
                    {msg.role === 'assistant' && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bot size={14} style={{ color: 'var(--primary)' }} />
                      </div>
                    )}
                    <div style={{
                      maxWidth: '75%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                      background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.9)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--card-border)',
                      color: msg.role === 'user' ? 'white' : 'var(--text-highlight)',
                      fontSize: '0.85rem',
                      lineHeight: '1.4',
                      whiteSpace: 'pre-wrap',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}>
                      {msg.content}
                      {msg.mode && (
                        <div style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: '4px', fontStyle: 'italic' }}>
                          Source: {msg.mode}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UserIcon size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={14} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 0', background: 'rgba(255,255,255,0.9)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RefreshCw size={12} className="spinning" style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI Assistant is typing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your future..."
                  disabled={chatLoading}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid var(--card-border)' }}
                />
                <button type="submit" disabled={chatLoading || !chatInput.trim()} className="btn-primary" style={{ padding: '10px', borderRadius: '8px' }}>
                  <Send size={14} />
                </button>
              </form>
            </div>

            {/* COLUMN 2: Your Risk & Compliance Dashboard */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* Column Header & range selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={18} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
                    Visual Risk & Compliance Intelligence Dashboard
                  </h3>
                </div>
                
                {/* Time Range Selector */}
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.03)', padding: '2px', borderRadius: '8px', alignItems: 'center' }}>
                  <Calendar size={12} style={{ marginLeft: '4px', color: 'var(--text-muted)' }} />
                  {(['1M', '3M', '1Y', '3Y'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        background: timeRange === range ? 'var(--primary)' : 'transparent',
                        color: timeRange === range ? 'white' : 'var(--text-muted)',
                        borderRadius: '6px',
                        fontWeight: 600
                      }}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Line Charts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                
                {/* Chart 1: Savings Projection */}
                <div className="glass-card" style={{ padding: '14px', background: 'rgba(255,255,255,0.45)' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Savings Projection
                  </h4>
                  <div style={{ height: '110px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.savings}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                        <Tooltip formatter={(v) => `$${v}`} />
                        <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Productivity Score */}
                <div className="glass-card" style={{ padding: '14px', background: 'rgba(255,255,255,0.45)' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Productivity Score
                  </h4>
                  <div style={{ height: '110px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.productivity}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Fitness Activity */}
                <div className="glass-card" style={{ padding: '14px', background: 'rgba(255,255,255,0.45)' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Fitness Activity
                  </h4>
                  <div style={{ height: '110px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.fitness}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Study Hours */}
                <div className="glass-card" style={{ padding: '14px', background: 'rgba(255,255,255,0.45)' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Study Hours
                  </h4>
                  <div style={{ height: '110px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.study}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                        <Tooltip formatter={(v) => `${v} hrs`} />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Underneath: 3 KPI Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="glass-panel" style={{ padding: '14px', textAlign: 'center', background: 'var(--card-bg)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Goal Achievement</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-highlight)' }}>
                    {twin?.goalScore || 78}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    <ArrowUpRight size={12} /> +5%
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '14px', textAlign: 'center', background: 'var(--card-bg)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Financial Health</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-highlight)' }}>
                    {twin?.financialHealthScore || 82}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    <ArrowUpRight size={12} /> +3%
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '14px', textAlign: 'center', background: 'var(--card-bg)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Productivity</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-highlight)' }}>
                    {twin?.productivityScore || 75}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    <ArrowDownRight size={12} /> -2%
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: AI Recommendations */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '620px' }}>
              
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                    AI Recommendations
                  </h3>
                  <Sparkles size={14} style={{ color: '#a855f7' }} />
                </div>
                <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                  AI Powered
                </span>
              </div>

              {/* Recommendations list */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                {staticRecommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="glass-panel"
                    style={{
                      padding: '14px',
                      background: 'var(--card-bg)',
                      borderLeft: `4px solid ${rec.color}`,
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* Tags */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {rec.category}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                        {rec.impact}
                      </span>
                    </div>
                    {/* Text */}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-highlight)', margin: 0, fontWeight: 500, lineHeight: '1.4' }}>
                      {rec.title}
                    </p>
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
