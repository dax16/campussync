import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../api';
import toast from 'react-hot-toast';
import type { RegisterData } from '../types';
import './Auth.css';

const STUDENT_EMAIL_DOMAIN = 'campus.ca';

interface RegisterForm extends Omit<RegisterData, 'semester'> {
  semester: number;
}

const PROGRAMS = [
  { value: 'ITS', label: 'Information Technology Solutions' },
  { value: 'ESD', label: 'Enterprise Software Development' },
  { value: 'CS', label: 'Computer Science' },
  { value: 'BUS', label: 'Business' },
];

const Register: React.FC = () => {
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    studentId: '',
    program: 'ITS',
    semester: 2,
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const studentId = form.studentId.trim().toLowerCase();
    const email = form.email.trim().toLowerCase();
    const expectedEmail = `${studentId}@${STUDENT_EMAIL_DOMAIN}`;

    if (!/^s[0-9]+$/.test(studentId)) {
      toast.error('Student ID must start with s and contain only numbers after it');
      return;
    }
    if (email !== expectedEmail) {
      toast.error(`Email must match your Student ID: ${expectedEmail}`);
      return;
    }

    setLoading(true);
    try {
      await register({ ...form, studentId, email });
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getApiError(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="brand-icon">◈</span>
          <h1>CampusSync</h1>
          <p>Join students booking campus spaces smarter</p>
        </div>
        <div className="auth-features">
          <div className="feature-item"><span>🏫</span><p>Study rooms &amp; computer labs</p></div>
          <div className="feature-item"><span>📅</span><p>Instant booking confirmation</p></div>
          <div className="feature-item"><span>🔔</span><p>Email notifications</p></div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2>Create account</h2>
          <p className="auth-subtitle">Start booking campus resources</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                placeholder="John Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Student ID</label>
                <input
                  placeholder="s0123456"
                  pattern="^[sS][0-9]+$"
                  title="Student ID must start with s and contain only numbers after it"
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value, 10) })}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="s0123456@campus.ca"
                pattern="^[sS][0-9]+@campus\.ca$"
                title="Email must match your Student ID, for example s0123456@campus.ca"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <p className="field-hint">
                Use your Student ID as your email name, for example s0123456@campus.ca.
              </p>
            </div>
            <div className="form-group">
              <label>Program</label>
              <select
                value={form.program}
                onChange={(e) => setForm({ ...form, program: e.target.value })}
              >
                {PROGRAMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
