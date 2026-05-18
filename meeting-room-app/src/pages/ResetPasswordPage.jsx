import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { MdMeetingRoom } from 'react-icons/md';
import api from '../services/api';

function getStrength(pwd) {
  if (!pwd) return 0;
  if (pwd.length < 8) return 1;
  if (pwd.length < 10) return 2;
  if (pwd.length < 12) return 3;
  return 4;
}
const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
const strengthLabel = ['', 'Too short', 'Weak', 'Good', 'Strong'];

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // If no token or email in URL, redirect to forgot password
  useEffect(() => {
    if (!token || !email) {
      navigate('/forgot-password');
    }
  }, [token, email, navigate]);

  const validatePassword = () => {
    if (!newPassword) return 'Password is required';
    if (newPassword.length < 8) return 'Too short — minimum 8 characters';
    if (!/[A-Z]/.test(newPassword)) return 'Add at least one uppercase letter';
    if (!/[a-z]/.test(newPassword)) return 'Add at least one lowercase letter';
    if (!/[0-9]/.test(newPassword)) return 'Add at least one number';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) return 'Add at least one special character';
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validatePassword();
    if (validationError) { setError(validationError); return; }

    try {
      setLoading(true);
      const response = await api.post('/auth/reset-password', {
        token,
        email,
        newPassword,
      });

      if (response.data?.success) {
        setSuccess(true);
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError(response.data?.message || 'Reset failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link is invalid or expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    flex: 1, fontSize: 13.5, color: '#0f172a',
    outline: 'none', border: 'none', background: 'transparent',
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
            Set a new<br />
            <span style={{ color: '#60a5fa' }}>secure password.</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13.5, lineHeight: 1.75 }}>
            Choose a strong password to keep your account safe.
          </p>
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: 36 }}>
          {[['8+', 'Min characters'], ['Strong', 'Recommended'], ['Safe', 'Encrypted']].map(([val, label]) => (
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

          {!success ? (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
                  Reset password
                </h2>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                  Enter your new password below.
                </p>
                {email && (
                  <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                    Resetting for: <strong style={{ color: '#0f172a' }}>{email}</strong>
                  </p>
                )}
              </div>

              {error && (
                <div style={{
                  marginBottom: 16, padding: '12px 16px', borderRadius: 10,
                  background: '#fef2f2', border: '1px solid #fecaca',
                  fontSize: 13, color: '#dc2626', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <FaTimesCircle size={13} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* New Password */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    New Password
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    border: '1.5px solid #e2e8f0', borderRadius: 10,
                    padding: '11px 13px', background: '#f8fafc',
                  }}>
                    <FaLock size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <input
                      type={showNew ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      style={inputStyle}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                      {showNew ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {newPassword.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3, 4].map((level) => {
                          const strength = getStrength(newPassword);
                          return (
                            <div key={level} style={{
                              flex: 1, height: 3, borderRadius: 99,
                              background: level <= strength ? strengthColor[strength] : '#e2e8f0',
                              transition: 'background 0.2s',
                            }} />
                          );
                        })}
                      </div>
                      <p style={{ fontSize: 11.5, color: strengthColor[getStrength(newPassword)], margin: 0, fontWeight: 500 }}>
                        {strengthLabel[getStrength(newPassword)]}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Confirm Password
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    border: '1.5px solid #e2e8f0', borderRadius: 10,
                    padding: '11px 13px', background: '#f8fafc',
                  }}>
                    <FaLock size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      style={inputStyle}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                      {showConfirm ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>

                  {/* Match indicator */}
                  {confirmPassword && newPassword && (
                    <p style={{
                      fontSize: 12, marginTop: 6, fontWeight: 500,
                      color: newPassword === confirmPassword ? '#22c55e' : '#ef4444',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {newPassword === confirmPassword
                        ? <><FaCheckCircle size={11} /> Passwords match</>
                        : <><FaTimesCircle size={11} /> Passwords do not match</>
                      }
                    </p>
                  )}
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
                      Resetting...
                    </>
                  ) : 'Reset Password →'}
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
                Password reset!
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
                Your password has been changed successfully. Redirecting you to sign in...
              </p>
              <Link
                to="/"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#0f172a', color: '#fff', padding: '12px 24px',
                  borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                }}
              >
                Go to Sign in
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

export default ResetPasswordPage;