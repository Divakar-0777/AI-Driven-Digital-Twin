import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  X,
  RefreshCw,
  Flame,
  CheckCheck,
  Sparkles,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  targetFrequency: string;
  completed: boolean;
  date: string;
}

const HABIT_PRESETS = [
  { name: 'Morning Exercise & Stretch', targetFrequency: 'Daily' },
  { name: 'Read Technical Books (20 mins)', targetFrequency: 'Daily' },
  { name: 'Mindfulness & Meditation (10 mins)', targetFrequency: 'Daily' },
  { name: 'Drink 3 Liters Water', targetFrequency: 'Daily' },
  { name: 'Deep Work / Coding Session (1 hr)', targetFrequency: 'Daily' },
  { name: 'Sleep by 11:00 PM', targetFrequency: 'Daily' },
  { name: 'Gym Strength Training (4x/Week)', targetFrequency: '4x/Week' },
  { name: 'Weekly Financial Review & Audit', targetFrequency: 'Weekly' },
];

export const Habits: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'COMPLETED' | 'PENDING'>('ALL');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [targetFrequency, setTargetFrequency] = useState('Daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/habits');
      setHabits(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch habit listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleToggleComplete = async (habit: Habit) => {
    try {
      const updated = {
        name: habit.name,
        targetFrequency: habit.targetFrequency,
        completed: !habit.completed,
        date: habit.date,
      };

      await api.put(`/habits/${habit.id}`, updated);

      setHabits((prev) =>
        prev.map((h) => (h.id === habit.id ? { ...h, completed: !h.completed } : h))
      );
    } catch (err) {
      console.error('Failed to toggle completion:', err);
      setError('Could not update habit completion status.');
    }
  };

  const handleQuickAdd = async (preset: { name: string; targetFrequency: string }) => {
    const payload = {
      name: preset.name,
      targetFrequency: preset.targetFrequency,
      completed: false,
      date: new Date().toISOString(),
    };

    try {
      await api.post('/habits', payload);
      fetchHabits();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add preset habit');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      targetFrequency,
      completed: false,
      date: new Date(date).toISOString(),
    };

    try {
      await api.post('/habits', payload);
      setShowModal(false);
      setName('');
      setTargetFrequency('Daily');
      fetchHabits();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save habit');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this habit?')) return;
    try {
      await api.delete(`/habits/${id}`);
      fetchHabits();
    } catch (err: any) {
      setError('Failed to delete habit.');
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = habits.length;
    const completed = habits.filter((h) => h.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayHabits = habits.filter((h) => h.date && h.date.startsWith(todayStr));
    const todayCompleted = todayHabits.filter((h) => h.completed).length;

    return {
      total,
      completed,
      completionRate,
      todayTotal: todayHabits.length,
      todayCompleted,
    };
  }, [habits]);

  // Filtered habits
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      if (filter === 'DAILY') return h.targetFrequency.toLowerCase().includes('daily');
      if (filter === 'WEEKLY') return h.targetFrequency.toLowerCase().includes('week');
      if (filter === 'COMPLETED') return h.completed;
      if (filter === 'PENDING') return !h.completed;
      return true;
    });
  }, [habits, filter]);

  // Group habits by date for cleaner visual breakdown
  const groupHabitsByDate = () => {
    const groups: Record<string, Habit[]> = {};
    filteredHabits.forEach((habit) => {
      const d = new Date(habit.date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[d]) groups[d] = [];
      groups[d].push(habit);
    });
    return groups;
  };

  const groupedHabits = groupHabitsByDate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <main style={{ flex: 1, marginLeft: '260px', padding: '40px', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '8px',
                  borderRadius: '10px',
                  color: 'var(--success)',
                }}
              >
                <Activity size={26} />
              </div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-highlight)', margin: 0 }}>
                Habit Tracking & Consistency
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '1rem', margin: 0 }}>
              Build positive momentum, track recurring daily routines, and optimize habit completion streaks.
            </p>
          </div>
          <button id="btn-add-habit" onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={18} /> Add Habit
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '24px',
            }}
          >
            {error}
          </div>
        )}

        {/* Top Habit Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.12)',
                padding: '12px',
                borderRadius: '10px',
                color: 'var(--primary)',
              }}
            >
              <TrendingUp size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Check-ins</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-highlight)' }}>{stats.total}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '12px',
                borderRadius: '10px',
                color: 'var(--success)',
              }}
            >
              <CheckCheck size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Total</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
                {stats.completed}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                padding: '12px',
                borderRadius: '10px',
                color: '#d97706',
              }}
            >
              <Flame size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completion Rate</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
                {stats.completionRate}%
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.12)',
                padding: '12px',
                borderRadius: '10px',
                color: '#06b6d4',
              }}
            >
              <Calendar size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Today's Progress</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
                {stats.todayCompleted} / {stats.todayTotal || habits.length > 0 ? (stats.todayTotal || '-') : 0}
              </div>
            </div>
          </div>
        </div>

        {/* Quick-Add Habit Presets */}
        <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sparkles size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', margin: 0 }}>
              Quick Add Popular Habit Templates
            </h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {HABIT_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleQuickAdd(p)}
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-highlight)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Plus size={14} color="var(--primary)" /> {p.name}
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: 'var(--primary)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {p.targetFrequency}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Habit List & Filter Tabs */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', margin: 0 }}>
                Habit Tracking History
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                Click any habit checkmark to toggle its completion status
              </p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.03)', padding: '4px', borderRadius: '10px' }}>
              {(['ALL', 'DAILY', 'WEEKLY', 'COMPLETED', 'PENDING'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '7px',
                    border: 'none',
                    background: filter === tab ? 'var(--primary)' : 'transparent',
                    color: filter === tab ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Loading habits checklist...</div>
          ) : Object.keys(groupedHabits).length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No habits found for the selected filter. Click "Add Habit" or choose a quick template above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {Object.keys(groupedHabits).map((dateGroup) => (
                <div key={dateGroup}>
                  <h4
                    style={{
                      fontSize: '0.95rem',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Calendar size={16} /> {dateGroup}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    {groupedHabits[dateGroup].map((habit) => (
                      <div
                        key={habit.id}
                        className="glass-card"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          borderLeft: habit.completed ? '4px solid var(--success)' : '4px solid var(--input-border)',
                          background: habit.completed ? 'rgba(16, 185, 129, 0.04)' : 'var(--card-bg)',
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flex: 1 }}
                          onClick={() => handleToggleComplete(habit)}
                        >
                          <button
                            type="button"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              color: habit.completed ? 'var(--success)' : 'var(--text-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            {habit.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                          </button>
                          <div>
                            <span
                              style={{
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                color: habit.completed ? 'var(--text-muted)' : 'var(--text-highlight)',
                                textDecoration: habit.completed ? 'line-through' : 'none',
                              }}
                            >
                              {habit.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--text-muted)',
                                display: 'block',
                                marginTop: '2px',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                              }}
                            >
                              <RefreshCw size={10} style={{ display: 'inline', marginRight: '4px' }} /> {habit.targetFrequency}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete(habit.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Form */}
        {showModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', margin: 0 }}>
                  Add New Habit Tracker
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-highlight)', padding: 0, cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Habit Name
                  </label>
                  <input
                    id="habit-name"
                    type="text"
                    placeholder="e.g. Drink 3L water, Meditate, Code..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Frequency
                    </label>
                    <select
                      id="habit-frequency"
                      value={targetFrequency}
                      onChange={(e) => setTargetFrequency(e.target.value)}
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="3x/Week">3x/Week</option>
                      <option value="4x/Week">4x/Week</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Target Date
                    </label>
                    <input
                      id="habit-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                    Save Habit
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

export default Habits;
