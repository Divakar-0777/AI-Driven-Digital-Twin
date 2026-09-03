import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Target, Plus, Trash2, Edit2, Calendar } from 'lucide-react';

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

export const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState({
    goalName: '', description: '', goalType: 'PERSONAL', targetValue: 0,
    currentValue: 0, unit: '', deadline: '', priority: 'MEDIUM',
  });

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGoals(); }, []);

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
      setForm({ goalName: '', description: '', goalType: 'PERSONAL', targetValue: 0, currentValue: 0, unit: '', deadline: '', priority: 'MEDIUM' });
      fetchGoals();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this goal?')) return;
    try { await api.delete(`/goals/${id}`); fetchGoals(); }
    catch (err) { console.error(err); }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      goalName: goal.goalName, description: goal.description || '', goalType: goal.goalType,
      targetValue: goal.targetValue, currentValue: goal.currentValue, unit: goal.unit || '',
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '', priority: goal.priority,
    });
    setShowModal(true);
  };

  const getPriorityColor = (p: string) => p === 'HIGH' ? 'var(--danger)' : p === 'MEDIUM' ? 'var(--warning)' : 'var(--primary)';

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
      <main style={{ flex: 1, marginLeft: 260, padding: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-highlight)' }}>🎯 Goals</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Track your personal, academic, fitness, and career goals</p>
          </div>
          <button className="btn-primary" onClick={() => { setEditingGoal(null); setForm({ goalName: '', description: '', goalType: 'PERSONAL', targetValue: 0, currentValue: 0, unit: '', deadline: '', priority: 'MEDIUM' }); setShowModal(true); }}>
            <Plus size={16} /> New Goal
          </button>
        </div>

        {/* Goals Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {goals.map(goal => (
            <div key={goal.id} className="glass-panel" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, color: goalTypeColors[goal.goalType] || 'var(--primary)',
                    background: `${goalTypeColors[goal.goalType] || 'var(--primary)'}15`, padding: '2px 8px', borderRadius: 4,
                  }}>
                    {goal.goalType}
                  </span>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, color: getPriorityColor(goal.priority),
                    marginLeft: 6, padding: '2px 6px', borderRadius: 4,
                    background: `${getPriorityColor(goal.priority)}15`,
                  }}>
                    {goal.priority}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => handleEdit(goal)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(goal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 6 }}>
                {goal.goalName}
              </h3>
              {goal.description && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                  {goal.description}
                </p>
              )}

              {/* Progress */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{goal.currentValue} / {goal.targetValue} {goal.unit || ''}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{goal.progressPercent}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.min(100, goal.progressPercent)}%`,
                    background: `linear-gradient(90deg, ${goalTypeColors[goal.goalType] || 'var(--primary)'}, ${goalTypeColors[goal.goalType] || 'var(--primary)'}cc)`,
                    borderRadius: 3, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {goal.deadline && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> Due {new Date(goal.deadline).toLocaleDateString()}
                  </span>
                )}
                <span style={{
                  color: goal.status === 'COMPLETED' ? 'var(--success)' : goal.status === 'FAILED' ? 'var(--danger)' : 'var(--text-muted)',
                  fontWeight: 600,
                }}>
                  {goal.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {goals.length === 0 && (
          <div className="glass-panel" style={{ padding: 60, textAlign: 'center' }}>
            <Target size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <h3 style={{ color: 'var(--text-highlight)', marginBottom: 8 }}>No Goals Yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Create your first goal to start tracking your progress</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Create Goal</button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-panel" style={{ padding: 32, width: 480, maxHeight: '80vh', overflow: 'auto' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 20 }}>
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input placeholder="Goal Name" value={form.goalName} onChange={e => setForm({ ...form, goalName: e.target.value })} required />
                <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <select value={form.goalType} onChange={e => setForm({ ...form, goalType: e.target.value })}>
                    <option value="FINANCIAL">Financial</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="FITNESS">Fitness</option>
                    <option value="CAREER">Career</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="LIFESTYLE">Lifestyle</option>
                  </select>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <input type="number" placeholder="Target Value" value={form.targetValue || ''} onChange={e => setForm({ ...form, targetValue: Number(e.target.value) })} required />
                  <input type="number" placeholder="Current Value" value={form.currentValue || ''} onChange={e => setForm({ ...form, currentValue: Number(e.target.value) })} />
                  <input placeholder="Unit (e.g. $, hrs)" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
                </div>
                <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setEditingGoal(null); }}>Cancel</button>
                  <button type="submit" className="btn-primary">{editingGoal ? 'Update' : 'Create'} Goal</button>
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
