import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi, getApiError } from '../api';
import './Auth.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.data.message);
    } catch (err) {
      setError(getApiError(err, 'Failed to send reset email'));
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
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2>Forgot password</h2>
          <p className="auth-subtitle">Enter your campus email and we'll send a reset link</p>

          {message ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ color: 'var(--accent-green)', marginBottom: 16 }}>{message}</p>
              <Link to="/login" className="btn btn-outline">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>
              )}
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="s12345@campus.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

          <p className="auth-link">
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
