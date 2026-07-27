import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Plus, Trash2, CheckCircle2, Circle, Calendar, X, RefreshCw } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  targetFrequency: string;
  completed: boolean;
  date: string;
}

export const Habits: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      // Update habit completed status
      await api.put(`/habits/${habit.id}`, updated);
      
      // Update state locally
      setHabits((prev) =>
        prev.map((h) => (h.id === habit.id ? { ...h, completed: !h.completed } : h))
      );
    } catch (err) {
      console.error('Failed to toggle completion:', err);
      setError('Could not update habit completion status.');
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

  // Group habits by date for cleaner visual breakdown
  const groupHabitsByDate = () => {
    const groups: Record<string, Habit[]> = {};
    habits.forEach((habit) => {
      const d = new Date(habit.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-highlight)' }}>Habit Tracker</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              Create daily checklists, target routine repeat rates, and mark completions.
            </p>
          </div>
          <button id="btn-add-habit" onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={18} /> Add Habit
          </button>
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

        {loading ? (
          <div>Loading habits checklist...</div>
        ) : habits.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No habits registered. Log a habit to begin.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {Object.keys(groupedHabits).map((dateGroup) => (
              <div key={dateGroup}>
                <h4 style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} /> {dateGroup}
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  {groupedHabits[dateGroup].map((habit) => (
                    <div
                      key={habit.id}
                      className="glass-card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderLeft: habit.completed ? '4px solid var(--success)' : '4px solid var(--input-border)',
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flex: 1 }}
                        onClick={() => handleToggleComplete(habit)}
                      >
                        <button
                          style={{ background: 'transparent', border: 'none', padding: 0, color: habit.completed ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          {habit.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                        <div>
                          <span style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: habit.completed ? 'var(--text-muted)' : 'white',
                            textDecoration: habit.completed ? 'line-through' : 'none'
                          }}>
                            {habit.name}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            display: 'block',
                            marginTop: '2px',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            letterSpacing: '0.5px'
                          }}>
                            <RefreshCw size={10} style={{ display: 'inline', marginRight: '4px' }} /> {habit.targetFrequency}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(habit.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
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

        {/* Modal Form */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                  Add New Habit Tracker
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', padding: 0, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Habit Name</label>
                  <input
                    id="habit-name"
                    type="text"
                    placeholder="Drink 3L water, Meditate, Code..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Frequency</label>
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
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Target Date</label>
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
                    Add Habit
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
