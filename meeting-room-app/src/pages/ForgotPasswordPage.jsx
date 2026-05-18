import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { MdMeetingRoom } from 'react-icons/md';
import api from '../services/api';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) { setError('Please enter your email address.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address.'); return; }

    try {
      setLoading(true);
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* Left panel */}
      <div className="login-left-panel" style={{
        display: 'none', width: '42%', background: '#0f172a',
        flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px 44px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, #ffffff08 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdMeetingRoom size={20} color="#fff" />
          </div>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>RoomBook</span>
        </div>
        <div style={{ position: 'relative' }}>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, lineHeight: 1.3, margin: '0 0 14px' }}>
            Forgot your password?<br />
            <span style={{ color: '#60a5fa' }}>No worries.</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13.5, lineHeight: 1.75 }}>
            Enter your email and we'll send you a secure link to reset your password instantly.
          </p>
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: 36 }}>
          {[['Secure', 'Reset link'], ['15 min', 'Link expiry'], ['Instant', 'Email delivery']].map(([val, label]) => (
            <div key={label}>
              <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 3px' }}>{val}</p>
              <p style={{ color: '#64748b', fontSize: 11.5, margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '36px 20px',
        background: '#fff', minHeight: '100vh',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Mobile logo */}
          <div className="login-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdMeetingRoom size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>RoomBook</span>
          </div>

          {!sent ? (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
                  Forgot password?
                </h2>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div style={{
                  marginBottom: 16, padding: '12px 16px', borderRadius: 10,
                  background: '#fef2f2', border: '1px solid #fecaca',
                  fontSize: 13, color: '#dc2626', fontWeight: 500,
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Email address
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: '1.5px solid #e2e8f0', borderRadius: 10,
                  padding: '11px 13px', background: '#f8fafc', marginBottom: 20,
                }}>
                  <FaEnvelope size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    style={{ flex: 1, fontSize: 13.5, color: '#0f172a', outline: 'none', border: 'none', background: 'transparent' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 10,
                    background: loading ? '#94a3b8' : '#0f172a',
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    marginBottom: 20,
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Sending...
                    </>
                  ) : 'Send Reset Link →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 13.5, color: '#64748b' }}>
                Remember your password?{' '}
                <Link to="/" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            /* Success state */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#f0fdf4', border: '2px solid #bbf7d0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <FaCheckCircle size={28} style={{ color: '#22c55e' }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
                Check your email
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 8px' }}>
                We sent a reset link to
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 24px' }}>
                {email}
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 28px', lineHeight: 1.6 }}>
                The link expires in 15 minutes. Check your spam folder if you don't see it.
              </p>
              <Link
                to="/"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#0f172a', color: '#fff', padding: '12px 24px',
                  borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                }}
              >
                <FaArrowLeft size={12} /> Back to Sign in
              </Link>
            </div>
          )}

          <p style={{ textAlign: 'center', fontSize: 11.5, color: '#cbd5e1', marginTop: 32 }}>
            © 2026 Plaxonic Technologies · All rights reserved
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 768px) {
          .login-left-panel { display: flex !important; }
          .login-mobile-logo { display: none !important; }
        }
        @media (max-width: 767px) {
          .login-left-panel { display: none !important; }
          .login-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

export default ForgotPasswordPage;