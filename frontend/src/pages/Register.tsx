import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Register: React.FC = () => {
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    profilePhotoUrl: '',
    dateOfBirth: '',
    occupation: '',
    educationLevel: '',
    monthlyIncome: 0,
    monthlyExpenseTarget: 0,
    studyGoal: '',
    dailyStudyHoursTarget: 0,
    habitGoals: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'monthlyIncome' || name === 'monthlyExpenseTarget' || name === 'dailyStudyHoursTarget'
        ? Number(value)
        : value,
    }));
  };

  const handleNextStep = () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill in the required fields (Full Name, Email, and Password).');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Structure values to fit backend validator schema
      const payload: any = { ...formData };
      if (!payload.phoneNumber) delete payload.phoneNumber;
      if (!payload.dateOfBirth) {
        payload.dateOfBirth = null;
      }
      if (!payload.occupation) delete payload.occupation;
      if (!payload.educationLevel) delete payload.educationLevel;
      if (!payload.studyGoal) delete payload.studyGoal;
      if (!payload.habitGoals) delete payload.habitGoals;
      if (!payload.profilePhotoUrl) delete payload.profilePhotoUrl;

      await registerUser(payload);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.details) {
        const details = err.response.data.details;
        const messages = Object.keys(details).map(k => `${k}: ${details[k]}`).join(', ');
        setError(`Registration failed: ${messages}`);
      } else {
        setError(err.response?.data?.error || 'Registration failed. Please review fields and try again.');
      }
      setStep(1); // Return to first step to fix core fields
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '40px 20px',
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '540px',
        padding: '40px',
        boxSizing: 'border-box',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-highlight)' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            {step === 1 ? 'Step 1: Security & Credentials' : 'Step 2: Productivity & Financial Targets'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                  Full Name *
                </label>
                <input
                  id="register-fullname"
                  name="fullName"
                  type="text"
                  placeholder="Enter Your Name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                  Email Address *
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                  Password *
                </label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Must be at least 8 chars, containing uppercase, lowercase, number, and special character.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                  Phone Number
                </label>
                <input
                  id="register-phone"
                  name="phoneNumber"
                  type="text"
                  placeholder="Enter Your PhoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                  Profile Photo URL
                </label>
                <input
                  id="register-photourl"
                  name="profilePhotoUrl"
                  type="text"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.profilePhotoUrl}
                  onChange={handleInputChange}
                />
              </div>

              <button
                id="btn-register-next"
                type="button"
                className="btn-primary"
                onClick={handleNextStep}
                style={{ width: '100%', height: '48px', marginTop: '10px' }}
              >
                Continue to Targets
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Date of Birth
                  </label>
                  <input
                    id="register-dob"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Occupation
                  </label>
                  <input
                    id="register-occupation"
                    name="occupation"
                    type="text"
                    placeholder="Enter Your Occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Education Level
                  </label>
                  <input
                    id="register-education"
                    name="educationLevel"
                    type="text"
                    placeholder="Bachelor's"
                    value={formData.educationLevel}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Monthly Income ($)
                  </label>
                  <input
                    id="register-income"
                    name="monthlyIncome"
                    type="number"
                    min="0"
                    placeholder="5000"
                    value={formData.monthlyIncome}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Monthly Expense Target ($)
                  </label>
                  <input
                    id="register-expense-target"
                    name="monthlyExpenseTarget"
                    type="number"
                    min="0"
                    placeholder="2000"
                    value={formData.monthlyExpenseTarget}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Daily Study Target (Hrs)
                  </label>
                  <input
                    id="register-study-target"
                    name="dailyStudyHoursTarget"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="2"
                    value={formData.dailyStudyHoursTarget}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                  Core Study Goal
                </label>
                <input
                  id="register-study-goal"
                  name="studyGoal"
                  type="text"
                  placeholder="Enter Your Goal"
                  value={formData.studyGoal}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                  Habit Goals Description
                </label>
                <textarea
                  id="register-habit-goals"
                  name="habitGoals"
                  placeholder="e.g., Run 3x/week, Meditate 10 mins daily"
                  rows={2}
                  value={formData.habitGoals}
                  onChange={handleInputChange}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                <button
                  id="btn-register-back"
                  type="button"
                  className="btn-secondary"
                  onClick={handlePrevStep}
                  style={{ flex: 1, height: '48px' }}
                >
                  Back
                </button>
                <button
                  id="btn-register-submit"
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ flex: 2, height: '48px' }}
                >
                  {loading ? 'Creating Account...' : 'Complete Register'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
