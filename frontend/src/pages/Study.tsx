import React, { useState, useEffect } from 'react';
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
  Star
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

export const Study: React.FC = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [summary, setSummary] = useState<StudySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const pageBackground = '#f8fafc';
  const cardBackground = '#ffffff';
  const primaryText = '#1e293b';
  const secondaryText = '#64748b';
  const borderColor = '#e2e8f0';
  const primaryColor = '#4f46e5';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: pageBackground
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          marginLeft: '260px',
          padding: '40px',
          boxSizing: 'border-box',
          background: pageBackground,
          minHeight: '100vh'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '2.25rem',
                fontWeight: 800,
                color: primaryText,
                margin: 0
              }}
            >
              Study Tracker
            </h2>

            <p
              style={{
                color: secondaryText,
                marginTop: '8px',
                marginBottom: 0,
                fontSize: '1rem'
              }}
            >
              Log academic sessions, specify topics, record durations, and audit learning productivity.
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

        {/* Error */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '24px'
            }}
          >
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              marginBottom: '32px'
            }}
          >
            {/* Total Hours */}
            <div
              style={{
                background: cardBackground,
                border: `1px solid ${borderColor}`,
                borderRadius: '18px',
                padding: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)'
              }}
            >
              <div
                style={{
                  background: '#eef2ff',
                  padding: '14px',
                  borderRadius: '12px',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Clock size={26} />
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.9rem',
                    color: secondaryText,
                    fontWeight: 500
                  }}
                >
                  Total Study Hours
                </span>

                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: primaryText,
                    marginTop: '5px'
                  }}
                >
                  {summary.totalHours.toFixed(1)} hrs
                </div>
              </div>
            </div>

            {/* Sessions */}
            <div
              style={{
                background: cardBackground,
                border: `1px solid ${borderColor}`,
                borderRadius: '18px',
                padding: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)'
              }}
            >
              <div
                style={{
                  background: '#ecfdf5',
                  padding: '14px',
                  borderRadius: '12px',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BookOpen size={26} />
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.9rem',
                    color: secondaryText,
                    fontWeight: 500
                  }}
                >
                  Sessions Tracked
                </span>

                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: primaryText,
                    marginTop: '5px'
                  }}
                >
                  {summary.sessionCount}
                </div>
              </div>
            </div>

            {/* Productivity */}
            <div
              style={{
                background: cardBackground,
                border: `1px solid ${borderColor}`,
                borderRadius: '18px',
                padding: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)'
              }}
            >
              <div
                style={{
                  background: '#fff7ed',
                  padding: '14px',
                  borderRadius: '12px',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BarChart3 size={26} />
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.9rem',
                    color: secondaryText,
                    fontWeight: 500
                  }}
                >
                  Average Productivity
                </span>

                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: primaryText,
                    marginTop: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ color: '#f59e0b' }}>★</span>
                  {summary.averageProductivity.toFixed(1)} / 5
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Study History */}
        <div
          style={{
            background: cardBackground,
            border: `1px solid ${borderColor}`,
            borderRadius: '18px',
            padding: '28px',
            overflowX: 'auto',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)'
          }}
        >
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: primaryText,
              marginBottom: '22px',
              marginTop: 0
            }}
          >
            Study Log History
          </h3>

          {loading ? (
            <div style={{ color: secondaryText }}>Loading Sessions...</div>
          ) : sessions.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: secondaryText,
                padding: '40px 0'
              }}
            >
              No study sessions tracked yet. Click Log Study Session to record one.
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.9rem'
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${borderColor}`,
                    background: '#f8fafc'
                  }}
                >
                  <th style={{ padding: '14px 16px', color: secondaryText }}>Subject</th>
                  <th style={{ padding: '14px 16px', color: secondaryText }}>Topic</th>
                  <th style={{ padding: '14px 16px', color: secondaryText }}>Duration</th>
                  <th style={{ padding: '14px 16px', color: secondaryText }}>Productivity Rating</th>
                  <th style={{ padding: '14px 16px', color: secondaryText }}>Date</th>
                  <th style={{ padding: '14px 16px', color: secondaryText }}>Notes</th>
                  <th style={{ padding: '14px 16px', color: secondaryText }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: `1px solid ${borderColor}`
                    }}
                  >
                    <td
                      style={{
                        padding: '16px',
                        fontWeight: 600,
                        color: primaryText
                      }}
                    >
                      {s.subject}
                    </td>

                    <td style={{ padding: '16px', color: secondaryText }}>
                      {s.topic}
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        fontWeight: 700,
                        color: primaryColor
                      }}
                    >
                      {s.duration} mins
                    </td>

                    <td style={{ padding: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '2px',
                          color: '#f59e0b'
                        }}
                      >
                        {Array.from({ length: s.productivityRating }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill="currentColor"
                          />
                        ))}

                        {Array.from({ length: 5 - s.productivityRating }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            color="#cbd5e1"
                          />
                        ))}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        color: secondaryText
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Calendar size={14} />
                        {new Date(s.date).toLocaleDateString()}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        color: secondaryText,
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {s.notes || '-'}
                    </td>

                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '14px' }}>
                        <button
                          onClick={() => openEditModal(s)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: primaryColor,
                            padding: 0,
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(s.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#dc2626',
                            padding: 0,
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                padding: '32px',
                boxSizing: 'border-box',
                background: '#ffffff',
                borderRadius: '18px',
                border: `1px solid ${borderColor}`,
                boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}
              >
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: primaryText,
                    margin: 0
                  }}
                >
                  {isEditing ? 'Edit Study Session' : 'Record Study Session'}
                </h3>

                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: primaryText,
                    padding: 0,
                    cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: secondaryText,
                      marginBottom: '6px'
                    }}
                  >
                    Subject
                  </label>

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
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: secondaryText,
                      marginBottom: '6px'
                    }}
                  >
                    Topic
                  </label>

                  <input
                    id="study-topic"
                    type="text"
                    placeholder="Algorithms, Biochemistry, Calculus..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px'
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: secondaryText,
                        marginBottom: '6px'
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
                        color: secondaryText,
                        marginBottom: '6px'
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
                      color: secondaryText,
                      marginBottom: '10px'
                    }}
                  >
                    Productivity Rating
                  </label>

                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
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
                          color:
                            rating <= productivityRating
                              ? '#f59e0b'
                              : '#cbd5e1'
                        }}
                      >
                        <Star
                          size={28}
                          fill={
                            rating <= productivityRating
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                      </button>
                    ))}

                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: secondaryText,
                        marginLeft: '8px'
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
                      color: secondaryText,
                      marginBottom: '6px'
                    }}
                  >
                    Notes
                  </label>

                  <textarea
                    id="study-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '10px'
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