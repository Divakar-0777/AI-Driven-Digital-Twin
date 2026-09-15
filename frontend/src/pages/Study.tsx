import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Clock,
  BarChart3,
  Calendar,
  X,
  Star,
  Search,
  Layers,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface StudySession {
  id: string;
  subject: string;
  topic: string;
  duration: number;
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

const PRESET_SUBJECTS = [
  'Machine Learning & AI',
  'Cloud Computing & DevOps',
  'System Design & Architecture',
  'Data Structures & Algorithms',
  'Full-Stack Web Development',
  'Cybersecurity & Compliance',
  'Mathematics & Statistics',
  'Database Engineering',
];

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Machine Learning & AI': { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.25)' },
  'Cloud Computing & DevOps': { bg: 'rgba(14, 165, 233, 0.1)', text: '#0ea5e9', border: 'rgba(14, 165, 233, 0.25)' },
  'System Design & Architecture': { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.25)' },
  'Data Structures & Algorithms': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' },
  'Full-Stack Web Development': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.25)' },
  'Cybersecurity & Compliance': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.25)' },
  'Mathematics & Statistics': { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.25)' },
  'Database Engineering': { bg: 'rgba(20, 184, 166, 0.1)', text: '#14b8a6', border: 'rgba(20, 184, 166, 0.25)' },
};

export const Study: React.FC = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [summary, setSummary] = useState<StudySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(60);
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

  // Compute subject breakdown
  const subjectBreakdown = useMemo(() => {
    const map: Record<string, { totalMinutes: number; count: number; totalRating: number }> = {};
    sessions.forEach((s) => {
      const sub = s.subject || 'Other';
      if (!map[sub]) {
        map[sub] = { totalMinutes: 0, count: 0, totalRating: 0 };
      }
      map[sub].totalMinutes += s.duration;
      map[sub].count += 1;
      map[sub].totalRating += s.productivityRating;
    });

    return Object.entries(map).map(([subj, stats]) => ({
      subject: subj,
      hours: Math.round((stats.totalMinutes / 60) * 10) / 10,
      count: stats.count,
      avgRating: Math.round((stats.totalRating / stats.count) * 10) / 10,
    })).sort((a, b) => b.hours - a.hours);
  }, [sessions]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSubject = selectedSubjectFilter === 'ALL' || s.subject === selectedSubjectFilter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSubject && matchesSearch;
    });
  }, [sessions, selectedSubjectFilter, searchQuery]);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setSubject(PRESET_SUBJECTS[0]);
    setTopic('');
    setDuration(60);
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

      <main
        style={{
          flex: 1,
          marginLeft: '260px',
          padding: '40px',
          boxSizing: 'border-box',
          minHeight: '100vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  padding: '8px',
                  borderRadius: '10px',
                  color: 'var(--primary)',
                }}
              >
                <GraduationCap size={26} />
              </div>
              <h2
                style={{
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  color: 'var(--text-highlight)',
                  margin: 0,
                }}
              >
                Study & Subject Intelligence
              </h2>
            </div>

            <p
              style={{
                color: 'var(--text-muted)',
                marginTop: '8px',
                marginBottom: 0,
                fontSize: '1rem',
              }}
            >
              Track academic subjects, record deep-work study sessions, and audit productivity ratings.
            </p>
          </div>

          <button
            id="btn-add-study"
            onClick={openAddModal}
            className="btn-primary"
          >
            <Plus size={18} /> Log Study Session
          </button>
        </div>

        {/* Error Notification */}
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

        {/* Top Summary Cards */}
        {summary && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              marginBottom: '32px',
            }}
          >
            {/* Total Hours */}
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
              }}
            >
              <div
                style={{
                  background: 'rgba(79, 70, 229, 0.12)',
                  padding: '14px',
                  borderRadius: '12px',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={26} />
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Total Study Hours
                </span>
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: 'var(--text-highlight)',
                    marginTop: '4px',
                  }}
                >
                  {summary.totalHours.toFixed(1)} hrs
                </div>
              </div>
            </div>

            {/* Sessions Tracked */}
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
              }}
            >
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '14px',
                  borderRadius: '12px',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={26} />
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Sessions Tracked
                </span>
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: 'var(--text-highlight)',
                    marginTop: '4px',
                  }}
                >
                  {summary.sessionCount}
                </div>
              </div>
            </div>

            {/* Productivity */}
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
              }}
            >
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  padding: '14px',
                  borderRadius: '12px',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart3 size={26} />
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Average Productivity
                </span>
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: 'var(--text-highlight)',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#f59e0b' }}>★</span>
                  {summary.averageProductivity.toFixed(1)} / 5.0
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Study Subjects Breakdown Section */}
        {subjectBreakdown.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-highlight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="var(--primary)" /> Study Subject Distribution
              </h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {subjectBreakdown.length} active subject domains
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {subjectBreakdown.map((item) => {
                const colors = SUBJECT_COLORS[item.subject] || {
                  bg: 'rgba(99, 102, 241, 0.08)',
                  text: 'var(--primary)',
                  border: 'rgba(99, 102, 241, 0.2)',
                };
                const isSelected = selectedSubjectFilter === item.subject;

                return (
                  <div
                    key={item.subject}
                    className="glass-card"
                    onClick={() => setSelectedSubjectFilter(isSelected ? 'ALL' : item.subject)}
                    style={{
                      cursor: 'pointer',
                      border: isSelected ? `2px solid ${colors.text}` : `1px solid ${colors.border}`,
                      background: isSelected ? colors.bg : 'var(--card-bg)',
                      borderRadius: '14px',
                      padding: '18px 20px',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 8px 24px rgba(79, 70, 229, 0.12)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: colors.text,
                          background: colors.bg,
                          padding: '3px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {item.count} {item.count === 1 ? 'Session' : 'Sessions'}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        ★ {item.avgRating}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)', margin: '0 0 8px 0' }}>
                      {item.subject}
                    </h4>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>Total Time:</span>
                      <span style={{ fontWeight: 700, color: colors.text }}>{item.hours} hrs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Study History & Filters */}
        <div className="glass-panel" style={{ padding: '28px', overflowX: 'auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-highlight)',
                  margin: 0,
                }}
              >
                Study Log History
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                Showing {filteredSessions.length} of {sessions.length} sessions
              </p>
            </div>

            {/* Search and Subject Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search subject, topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: '36px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    fontSize: '0.85rem',
                    width: '200px',
                    borderRadius: '8px',
                  }}
                />
              </div>

              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                }}
              >
                <option value="ALL">All Subjects</option>
                {Array.from(new Set(sessions.map((s) => s.subject))).map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Loading Sessions...</div>
          ) : filteredSessions.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                padding: '40px 0',
              }}
            >
              No study sessions matched your filter. Click "Log Study Session" to record one.
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.9rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--input-border)',
                    background: 'rgba(0,0,0,0.02)',
                  }}
                >
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>Subject</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>Topic</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>Duration</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>Rating</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>Date</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>Notes</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSessions.map((s) => {
                  const colors = SUBJECT_COLORS[s.subject] || {
                    bg: 'rgba(99, 102, 241, 0.08)',
                    text: 'var(--primary)',
                    border: 'rgba(99, 102, 241, 0.2)',
                  };

                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: '1px solid var(--input-border)',
                      }}
                    >
                      <td style={{ padding: '16px' }}>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: colors.text,
                            background: colors.bg,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {s.subject}
                        </span>
                      </td>

                      <td style={{ padding: '16px', color: 'var(--text-highlight)', fontWeight: 600 }}>
                        {s.topic}
                      </td>

                      <td
                        style={{
                          padding: '16px',
                          fontWeight: 700,
                          color: 'var(--primary)',
                        }}
                      >
                        {s.duration} mins
                      </td>

                      <td style={{ padding: '16px' }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: '2px',
                            color: '#f59e0b',
                          }}
                        >
                          {Array.from({ length: s.productivityRating }).map((_, i) => (
                            <Star key={i} size={14} fill="currentColor" />
                          ))}

                          {Array.from({ length: 5 - s.productivityRating }).map((_, i) => (
                            <Star key={i} size={14} color="#cbd5e1" />
                          ))}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: '16px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Calendar size={14} />
                          {new Date(s.date).toLocaleDateString()}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '16px',
                          color: 'var(--text-muted)',
                          maxWidth: '240px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.notes || '-'}
                      </td>

                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => openEditModal(s)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--primary)',
                              padding: 0,
                              cursor: 'pointer',
                            }}
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(s.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--danger)',
                              padding: 0,
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '520px',
                padding: '32px',
                boxSizing: 'border-box',
                background: '#ffffff',
                borderRadius: '18px',
                boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--text-highlight)',
                    margin: 0,
                  }}
                >
                  {isEditing ? 'Edit Study Session' : 'Record Study Session'}
                </h3>

                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-highlight)',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Quick Subject Selector Chips */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                    fontWeight: 600,
                  }}
                >
                  <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} /> Quick Select Subject:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PRESET_SUBJECTS.map((ps) => (
                    <button
                      key={ps}
                      type="button"
                      onClick={() => setSubject(ps)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        border: subject === ps ? '1px solid var(--primary)' : '1px solid var(--input-border)',
                        background: subject === ps ? 'rgba(99, 102, 241, 0.15)' : 'var(--input-bg)',
                        color: subject === ps ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {ps}
                    </button>
                  ))}
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    Subject Name
                  </label>

                  <input
                    id="study-subject"
                    type="text"
                    placeholder="e.g. Machine Learning & AI, Cloud Computing..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    Topic / Concept Covered
                  </label>

                  <input
                    id="study-topic"
                    type="text"
                    placeholder="e.g. Transformers & Attention, Docker, LeetCode..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '14px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                        marginBottom: '6px',
                      }}
                    >
                      Duration (Minutes)
                    </label>

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
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                        marginBottom: '6px',
                      }}
                    >
                      Date
                    </label>

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
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      marginBottom: '8px',
                    }}
                  >
                    Productivity Rating
                  </label>

                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
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
                          color: rating <= productivityRating ? '#f59e0b' : '#cbd5e1',
                        }}
                      >
                        <Star
                          size={26}
                          fill={rating <= productivityRating ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}

                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                        marginLeft: '8px',
                        fontWeight: 600,
                      }}
                    >
                      ({productivityRating} of 5)
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    Study Notes & Key Takeaways
                  </label>

                  <textarea
                    id="study-notes"
                    placeholder="Key concepts learned, practice problems solved, links..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '8px',
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 2 }}
                  >
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