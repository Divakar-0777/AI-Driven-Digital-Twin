import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';

interface Goal {
  id: string;
  goalName: string;
  description?: string;
  goalType: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  deadline?: string;
  priority: string;
  status: string;
  progressPercent: number;
  riskLevel?: string;
  aiRecommendation?: string;
  createdAt: string;
}

const goalTypeColors: Record<string, string> = {
  FINANCIAL: '#10b981',
  ACADEMIC: '#6366f1',
  FITNESS: '#f59e0b',
  CAREER: '#8b5cf6',
  PERSONAL: '#06b6d4',
  LIFESTYLE: '#ec4899',
};

const GOAL_PRESETS = [
  {
    goalName: 'AWS Solutions Architect SAA-C03',
    description: 'Master cloud architecture patterns and pass AWS SAA-C03 exam',
    goalType: 'ACADEMIC',
    targetValue: 100,
    currentValue: 60,
    unit: 'percent',
    priority: 'HIGH',
    daysAhead: 90,
  },
  {
    goalName: 'Solve 150 LeetCode DSA Problems',
    description: 'Practice DP, Trees, Graphs, Heaps, and Backtracking algorithms',
    goalType: 'ACADEMIC',
    targetValue: 150,
    currentValue: 75,
    unit: 'problems',
    priority: 'MEDIUM',
    daysAhead: 90,
  },
  {
    goalName: 'Build $15,000 Emergency Fund',
    description: 'Liquid cash buffer in high-yield savings account for financial peace of mind',
    goalType: 'FINANCIAL',
    targetValue: 15000,
    currentValue: 10000,
    unit: 'dollars',
    priority: 'HIGH',
    daysAhead: 120,
  },
  {
    goalName: 'Run 5K in Under 25 Minutes',
    description: 'Interval training and endurance running 3x per week',
    goalType: 'FITNESS',
    targetValue: 25,
    currentValue: 28,
    unit: 'minutes',
    priority: 'MEDIUM',
    daysAhead: 60,
  },
  {
    goalName: 'Launch SaaS MVP with 100 Beta Users',
    description: 'Develop, deploy, and launch AI productivity application',
    goalType: 'CAREER',
    targetValue: 100,
    currentValue: 40,
    unit: 'percent',
    priority: 'HIGH',
    daysAhead: 100,
  },
  {
    goalName: 'Read 24 Non-Fiction Books',
    description: 'Read books on system design, psychology, business, and leadership',
    goalType: 'PERSONAL',
    targetValue: 24,
    currentValue: 12,
    unit: 'books',
    priority: 'LOW',
    daysAhead: 180,
  },
];

export const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [form, setForm] = useState({
    goalName: '',
    description: '',
    goalType: 'PERSONAL',
    targetValue: 0,
    currentValue: 0,
    unit: '',
    deadline: '',
    priority: 'MEDIUM',
  });

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleQuickAdd = async (preset: typeof GOAL_PRESETS[0]) => {
    const deadline = new Date(Date.now() + preset.daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    try {
      await api.post('/goals', {
        goalName: preset.goalName,
        description: preset.description,
        goalType: preset.goalType,
        targetValue: preset.targetValue,
        currentValue: preset.currentValue,
        unit: preset.unit,
        deadline,
        priority: preset.priority,
        status: 'ACTIVE',
      });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await api.put(`/goals/${editingGoal.id}`, form);
      } else {
        await api.post('/goals', form);
      }
      setShowModal(false);
      setEditingGoal(null);
      setForm({
        goalName: '',
        description: '',
        goalType: 'PERSONAL',
        targetValue: 0,
        currentValue: 0,
        unit: '',
        deadline: '',
        priority: 'MEDIUM',
      });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      goalName: goal.goalName,
      description: goal.description || '',
      goalType: goal.goalType,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit || '',
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
      priority: goal.priority,
    });
    setShowModal(true);
  };

  const getPriorityColor = (p: string) =>
    p === 'HIGH' ? 'var(--danger)' : p === 'MEDIUM' ? 'var(--warning)' : 'var(--primary)';

  // Compute goal stats
  const stats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((g) => g.status === 'COMPLETED' || g.progressPercent >= 100).length;
    const active = goals.filter((g) => g.status === 'ACTIVE' && g.progressPercent < 100).length;
    const avgProgress = total > 0 ? Math.round(goals.reduce((acc, g) => acc + (g.progressPercent || 0), 0) / total) : 0;
    return { total, completed, active, avgProgress };
  }, [goals]);

  // Filtered goals
  const filteredGoals = useMemo(() => {
    if (selectedTypeFilter === 'ALL') return goals;
    return goals.filter((g) => g.goalType === selectedTypeFilter);
  }, [goals, selectedTypeFilter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: 260, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: 24 }}>Loading Goals...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 260, padding: 40, boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  padding: 8,
                  borderRadius: 10,
                  color: 'var(--primary)',
                }}
              >
                <Target size={26} />
              </div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-highlight)', margin: 0 }}>
                Goals & Milestones
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '1rem', margin: 0 }}>
              Set ambitious multi-domain targets across academic, financial, fitness, and career domains.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setEditingGoal(null);
              setForm({
                goalName: '',
                description: '',
                goalType: 'PERSONAL',
                targetValue: 0,
                currentValue: 0,
                unit: '',
                deadline: '',
                priority: 'MEDIUM',
              });
              setShowModal(true);
            }}
          >
            <Plus size={18} /> New Goal
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.12)', padding: 12, borderRadius: 10, color: 'var(--primary)' }}>
              <Target size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Goals</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-highlight)' }}>{stats.total}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'rgba(14, 165, 233, 0.12)', padding: 12, borderRadius: 10, color: '#0ea5e9' }}>
              <Clock size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Goals</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-highlight)' }}>{stats.active}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: 12, borderRadius: 10, color: 'var(--success)' }}>
              <CheckCircle size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-highlight)' }}>{stats.completed}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: 12, borderRadius: 10, color: '#d97706' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Progress</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-highlight)' }}>{stats.avgProgress}%</div>
            </div>
          </div>
        </div>

        {/* Quick-Add Goal Templates */}
        <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Sparkles size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', margin: 0 }}>
              Quick Add Goal Templates
            </h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {GOAL_PRESETS.map((p) => (
              <button
                key={p.goalName}
                type="button"
                onClick={() => handleQuickAdd(p)}
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-highlight)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus size={14} color="var(--primary)" /> {p.goalName}
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: `${goalTypeColors[p.goalType] || 'var(--primary)'}20`,
                    color: goalTypeColors[p.goalType] || 'var(--primary)',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {p.goalType}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['ALL', 'ACADEMIC', 'FINANCIAL', 'FITNESS', 'CAREER', 'PERSONAL', 'LIFESTYLE'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedTypeFilter(type)}
              style={{
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: 8,
                border: selectedTypeFilter === type ? 'none' : '1px solid var(--input-border)',
                background: selectedTypeFilter === type ? 'var(--primary)' : 'var(--card-bg)',
                color: selectedTypeFilter === type ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Goals Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
          {filteredGoals.map((goal) => (
            <div key={goal.id} className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: goalTypeColors[goal.goalType] || 'var(--primary)',
                      background: `${goalTypeColors[goal.goalType] || 'var(--primary)'}15`,
                      padding: '3px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {goal.goalType}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: getPriorityColor(goal.priority),
                      marginLeft: 6,
                      padding: '3px 6px',
                      borderRadius: 4,
                      background: `${getPriorityColor(goal.priority)}15`,
                    }}
                  >
                    {goal.priority}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleEdit(goal)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 6 }}>
                {goal.goalName}
              </h3>

              {goal.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
                  {goal.description}
                </p>
              )}

              {/* Progress Bar */}
              <div style={{ marginBottom: 14, marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                    {goal.currentValue} / {goal.targetValue} {goal.unit || ''}
                  </span>
                  <span style={{ fontWeight: 800, color: goalTypeColors[goal.goalType] || 'var(--primary)' }}>
                    {Math.round(goal.progressPercent || (goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0))}%
                  </span>
                </div>
                <div style={{ height: 7, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, goal.progressPercent || (goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0)))}%`,
                      background: `linear-gradient(90deg, ${goalTypeColors[goal.goalType] || 'var(--primary)'}, ${goalTypeColors[goal.goalType] || 'var(--primary)'}cc)`,
                      borderRadius: 4,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>

              {/* AI Recommendation Insight */}
              {goal.aiRecommendation && (
                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.06)',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    color: 'var(--text-highlight)',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                  }}
                >
                  <Lightbulb size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{goal.aiRecommendation}</span>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {goal.deadline ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} /> Due {new Date(goal.deadline).toLocaleDateString()}
                  </span>
                ) : (
                  <span>No deadline</span>
                )}
                <span
                  style={{
                    color: goal.status === 'COMPLETED' ? 'var(--success)' : goal.status === 'FAILED' ? 'var(--danger)' : 'var(--text-muted)',
                    fontWeight: 700,
                  }}
                >
                  {goal.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredGoals.length === 0 && (
          <div className="glass-panel" style={{ padding: 60, textAlign: 'center' }}>
            <Target size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <h3 style={{ color: 'var(--text-highlight)', marginBottom: 8 }}>No Goals Found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
              Create your first goal or select a template above to start tracking your progress
            </p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Create Goal
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div className="glass-panel" style={{ padding: 32, width: 480, maxHeight: '85vh', overflow: 'auto' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 20 }}>
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input
                  placeholder="Goal Name"
                  value={form.goalName}
                  onChange={(e) => setForm({ ...form, goalName: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <select value={form.goalType} onChange={(e) => setForm({ ...form, goalType: e.target.value })}>
                    <option value="ACADEMIC">Academic</option>
                    <option value="FINANCIAL">Financial</option>
                    <option value="FITNESS">Fitness</option>
                    <option value="CAREER">Career</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="LIFESTYLE">Lifestyle</option>
                  </select>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <input
                    type="number"
                    placeholder="Target Value"
                    value={form.targetValue || ''}
                    onChange={(e) => setForm({ ...form, targetValue: Number(e.target.value) })}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Current Value"
                    value={form.currentValue || ''}
                    onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })}
                  />
                  <input
                    placeholder="Unit (e.g. $, hrs, books)"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </div>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      setEditingGoal(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingGoal ? 'Update' : 'Create'} Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Goals;
