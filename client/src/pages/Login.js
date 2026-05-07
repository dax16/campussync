import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
          <p>Smart resource booking for campus students</p>
        </div>
        <div className="auth-features">
          <div className="feature-item"><span>⚡</span><p>Real-time room availability</p></div>
          <div className="feature-item"><span>🤖</span><p>AI-powered slot suggestions</p></div>
          <div className="feature-item"><span>📊</span><p>Campus usage analytics</p></div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Sign in</h2>
          <p className="auth-subtitle">Access your campus bookings</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="student@campus.ca" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="auth-link">Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
}
