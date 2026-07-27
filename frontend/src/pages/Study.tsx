import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Plus, Edit2, Trash2, BookOpen, Clock, BarChart3, Calendar, X, Star } from 'lucide-react';

interface StudySession {
  id: string;
  subject: string;
  topic: string;
  duration: number; // in mins
  date: string;
  productivityRating: number;
  notes?: string;
}

interface StudySummary {
  totalMinutes: number;
  totalHours: number;
  sessionCount: number;
  averageProductivity: number;
}

export const Study: React.FC = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [summary, setSummary] = useState<StudySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [productivityRating, setProductivityRating] = useState(5);
  const [notes, setNotes] = useState('');

  const fetchStudyData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, hoursRes] = await Promise.all([
        api.get('/study'),
        api.get('/study/total-hours'),
      ]);
      setSessions(sessionsRes.data);
      setSummary(hoursRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch study sessions data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyData();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setSubject('');
    setTopic('');
    setDuration(0);
    setDate(new Date().toISOString().split('T')[0]);
    setProductivityRating(5);
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (session: StudySession) => {
    setIsEditing(true);
    setCurrentId(session.id);
    setSubject(session.subject);
    setTopic(session.topic);
    setDuration(session.duration);
    setDate(new Date(session.date).toISOString().split('T')[0]);
    setProductivityRating(session.productivityRating);
    setNotes(session.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (duration <= 0) {
      setError('Duration must be greater than 0 minutes');
      return;
    }

    const payload = {
      subject,
      topic,
      duration: Number(duration),
      date: new Date(date).toISOString(),
      productivityRating: Number(productivityRating),
      notes: notes || null,
    };

    try {
      if (isEditing && currentId) {
        await api.put(`/study/${currentId}`, payload);
      } else {
        await api.post('/study', payload);
      }
      setShowModal(false);
      fetchStudyData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save study session');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this study session?')) return;
    try {
      await api.delete(`/study/${id}`);
      fetchStudyData();
    } catch (err: any) {
      setError('Failed to delete study session.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <main style={{ flex: 1, marginLeft: '260px', padding: '40px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-highlight)' }}>Study Tracker</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              Log academic sessions, specify topics, record durations, and audit learning productivity.
            </p>
          </div>
          <button id="btn-add-study" onClick={openAddModal} className="btn-primary">
            <Plus size={18} /> Log Study Session
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

        {/* Study aggregates summary */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '10px', color: 'var(--primary)' }}>
                <Clock size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Study Hours</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginTop: '2px' }}>
                  {summary.totalHours.toFixed(1)} hrs
                </div>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '10px', color: 'var(--success)' }}>
                <BookOpen size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sessions Tracked</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginTop: '2px' }}>
                  {summary.sessionCount}
                </div>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '10px', color: 'var(--warning)' }}>
                <BarChart3 size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average Productivity</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ★ {summary.averageProductivity.toFixed(1)} / 5
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions History Table */}
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: '20px' }}>
            Study Log History
          </h3>

          {loading ? (
            <div>Loading Sessions...</div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
              No study sessions tracked yet. Click Log Study Session to record one.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Subject</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Topic</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Duration</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Productivity Rating</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Date</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Notes</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'white' }}>{s.subject}</td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{s.topic}</td>
                    <td style={{ padding: '16px', fontWeight: 700, color: 'var(--primary)' }}>{s.duration} mins</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '2px', color: 'var(--warning)' }}>
                        {Array.from({ length: s.productivityRating }).map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                        {Array.from({ length: 5 - s.productivityRating }).map((_, i) => (
                          <Star key={i} size={14} />
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} /> {new Date(s.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.notes || '-'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => openEditModal(s)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--primary)', padding: 0, cursor: 'pointer' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', padding: 0, cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
            <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                  {isEditing ? 'Edit Study Session' : 'Record Study Session'}
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', padding: 0, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Subject</label>
                  <input
                    id="study-subject"
                    type="text"
                    placeholder="Mathematics, Biology, Programming..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Topic</label>
                  <input
                    id="study-topic"
                    type="text"
                    placeholder="Algorithms, Biochemistry, Calculus..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Duration (Minutes)</label>
                    <input
                      id="study-duration"
                      type="number"
                      min="1"
                      placeholder="60"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Date</label>
                    <input
                      id="study-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Productivity Rating</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setProductivityRating(rating)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: rating <= productivityRating ? 'var(--warning)' : 'var(--text-muted)'
                        }}
                      >
                        <Star size={28} fill={rating <= productivityRating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                      ({productivityRating} of 5)
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Notes</label>
                  <textarea
                    id="study-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                    {isEditing ? 'Save Changes' : 'Log Session'}
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

export default Study;
