import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Check } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateUserProfile, deleteUserAccount } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    password: '',
    phoneNumber: user?.phoneNumber || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    occupation: user?.occupation || '',
    educationLevel: user?.educationLevel || '',
    monthlyIncome: Number(user?.monthlyIncome) || 0,
    monthlyExpenseTarget: Number(user?.monthlyExpenseTarget) || 0,
    studyGoal: user?.studyGoal || '',
    dailyStudyHoursTarget: Number(user?.dailyStudyHoursTarget) || 0,
    habitGoals: user?.habitGoals || '',
    profilePhotoUrl: user?.profilePhotoUrl || '',
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'monthlyIncome' || name === 'monthlyExpenseTarget' || name === 'dailyStudyHoursTarget'
        ? Number(value)
        : value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const payload: any = { ...formData };
      if (!payload.password) delete payload.password; // Only send password if editing
      if (!payload.dateOfBirth) payload.dateOfBirth = null;

      await updateUserProfile(payload);
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        'Failed to update profile. Please verify your entries.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setError(null);
      setLoading(true);
      await deleteUserAccount();
      // AuthContext will automatically logout and redirect
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete account.');
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <main style={{ flex: 1, marginLeft: '260px', padding: '40px', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-highlight)' }}>Profile Settings</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Manage your personal parameters, productivity targets, and account settings.
          </p>
        </div>

        {message && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid var(--success)',
            color: '#a7f3d0',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={18} /> {message}
          </div>
        )}

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

        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
          {/* Main Info Form */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                Account Identity
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Full Name
                  </label>
                  <input
                    id="profile-fullname"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Email Address
                  </label>
                  <input
                    id="profile-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Phone Number
                  </label>
                  <input
                    id="profile-phone"
                    name="phoneNumber"
                    type="text"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Date of Birth
                  </label>
                  <input
                    id="profile-dob"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Occupation
                  </label>
                  <input
                    id="profile-occupation"
                    name="occupation"
                    type="text"
                    value={formData.occupation}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Education Level
                  </label>
                  <input
                    id="profile-education"
                    name="educationLevel"
                    type="text"
                    value={formData.educationLevel}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                  Profile Photo URL
                </label>
                <input
                  id="profile-photourl"
                  name="profilePhotoUrl"
                  type="text"
                  value={formData.profilePhotoUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginTop: '16px' }}>
                Financial & Productivity Targets
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Monthly Income ($)
                  </label>
                  <input
                    id="profile-income"
                    name="monthlyIncome"
                    type="number"
                    min="0"
                    value={formData.monthlyIncome}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Monthly Expense Target ($)
                  </label>
                  <input
                    id="profile-expense-target"
                    name="monthlyExpenseTarget"
                    type="number"
                    min="0"
                    value={formData.monthlyExpenseTarget}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Daily Study Target (Hours)
                  </label>
                  <input
                    id="profile-study-target"
                    name="dailyStudyHoursTarget"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.dailyStudyHoursTarget}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Study Goal Description
                  </label>
                  <input
                    id="profile-study-goal"
                    name="studyGoal"
                    type="text"
                    value={formData.studyGoal}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                  Habit Goals Description
                </label>
                <textarea
                  id="profile-habit-goals"
                  name="habitGoals"
                  value={formData.habitGoals}
                  onChange={handleInputChange}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginTop: '16px' }}>
                Security Configuration
              </h3>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                  Change Password (Leave blank to keep current)
                </label>
                <input
                  id="profile-password"
                  name="password"
                  type="password"
                  placeholder="Enter new strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>

              <button
                id="btn-profile-submit"
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ height: '48px', marginTop: '12px', alignSelf: 'flex-start', padding: '0 32px' }}
              >
                Save Changes
              </button>

            </form>
          </div>

          {/* User Bio Card & Danger Zone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Bio Card */}
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
              {formData.profilePhotoUrl ? (
                <img
                  src={formData.profilePhotoUrl}
                  alt="Profile photo preview"
                  style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', margin: '0 auto 16px', display: 'block' }}
                />
              ) : (
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'var(--primary-glow)',
                  border: '3px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '2.5rem',
                  margin: '0 auto 16px'
                }}>
                  {formData.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                </div>
              )}
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-highlight)', fontWeight: 700 }}>{formData.fullName}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>{formData.occupation || 'Personal Account'}</p>
              
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '24px', paddingTop: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Member Since:</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{user ? new Date(user.createdAt).toLocaleDateString() : ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Account ID:</span>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: '0.75rem', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '140px' }}>
                    {user?.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-panel" style={{ padding: '32px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <h4 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 700 }}>
                <ShieldAlert size={20} /> Danger Zone
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '10px', lineHeight: '1.4' }}>
                Deleting your account will permanently remove all financial logs, study sessions, and habit configurations. This action is irreversible.
              </p>

              {!showDeleteConfirm ? (
                <button
                  id="btn-delete-account-trigger"
                  type="button"
                  className="btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{ width: '100%', marginTop: '20px', height: '40px' }}
                >
                  Delete Account
                </button>
              ) : (
                <div style={{ marginTop: '20px', background: 'rgba(239,68,68,0.05)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <span style={{ fontSize: '0.85rem', color: '#fca5a5', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                    Are you absolutely sure?
                  </span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      id="btn-delete-account-confirm"
                      type="button"
                      className="btn-danger"
                      onClick={handleDeleteAccount}
                      style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
                    >
                      Yes, Delete
                    </button>
                    <button
                      id="btn-delete-account-cancel"
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
