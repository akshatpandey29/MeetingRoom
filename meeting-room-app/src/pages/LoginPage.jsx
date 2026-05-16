import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaEnvelope, FaLock, FaUser,
  FaEye, FaEyeSlash, FaGoogle, FaCheckCircle,
} from 'react-icons/fa';
import { MdMeetingRoom } from 'react-icons/md';

// ── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };
  return { toasts, show };
}

function ToastContainer({ toasts }) {
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px',
          background: t.type === 'success' ? '#0f172a' : '#991b1b',
          color: '#fff', borderRadius: 14, fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          animation: 'slideIn 0.3s ease', minWidth: 240,
        }}>
          {t.type === 'success'
            ? <FaCheckCircle size={14} style={{ color: '#4ade80', flexShrink: 0 }} />
            : <span style={{ color: '#fca5a5', flexShrink: 0 }}>✕</span>
          }
          {t.message}
        </div>
      ))}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
}

// ── Field ────────────────────────────────────────────────────────────────────
function Field({ icon, label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, color: '#64748b',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: error ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
        borderRadius: 10, padding: '11px 13px',
        background: '#f8fafc', transition: 'border-color 0.15s',
      }}>
        <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </span>
        {children}
      </div>
      {error && <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{error}</p>}
    </div>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
      <span style={{ fontSize: 12, color: '#94a3b8' }}>or continue with</span>
      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
    </div>
  );
}

// ── Google Button ────────────────────────────────────────────────────────────
function GoogleButton() {
  return (
    <button
      type="button"
      onClick={() => {}}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 8, padding: '11px 0',
        borderRadius: 10, border: '1.5px solid #e2e8f0',
        background: '#fff', fontSize: 13.5, fontWeight: 500,
        color: '#0f172a', cursor: 'pointer',
      }}
    >
      <img
  src="https://www.svgrepo.com/show/475656/google-color.svg"
  alt="Google"
  style={{ width: 18, height: 18 }}
/>
      Continue with Google
    </button>
  );
}

// ── Left Panel ───────────────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div style={{
      width: '85%', background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', padding: '40px 44px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, #ffffff08 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />
      <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, #2563eb20, transparent 70%)',
      }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, background: '#2563eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MdMeetingRoom size={20} color="#fff" />
        </div>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>
          RoomBook
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        <h1 style={{
          color: '#fff', fontSize: 26, fontWeight: 700,
          lineHeight: 1.3, margin: '0 0 14px', letterSpacing: '-0.5px',
        }}>
          Smart meeting rooms,<br />
          <span style={{ color: '#60a5fa' }}>zero conflicts.</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 13.5, lineHeight: 1.75, margin: 0 }}>
          Reserve the right room at the right time. Real-time availability, instant confirmation.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
          {['Real-time availability', 'Conflict detection', 'Admin controls', 'Booking calendar'].map((f) => (
            <span key={f} style={{
              fontSize: 11.5, fontWeight: 500, color: '#cbd5e1',
              background: '#ffffff0d', border: '1px solid #ffffff15',
              borderRadius: 20, padding: '5px 12px',
            }}>{f}</span>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', display: 'flex', gap: 36 }}>
        {[['0', 'Double bookings'], ['Live', 'Availability'], ['Instant', 'Confirmation']].map(([val, label]) => (
          <div key={label}>
            <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 3px' }}>{val}</p>
            <p style={{ color: '#64748b', fontSize: 11.5, margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { toasts, show: showToast } = useToast();

  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});

  const [regData, setRegData] = useState({ name: '', email: '', password: '' });
  const [regErrors, setRegErrors] = useState({});

  const inputStyle = {
    flex: 1, fontSize: 13.5, color: '#0f172a',
    outline: 'none', border: 'none', background: 'transparent',
  };

  const getStrength = (pwd) => {
    if (pwd.length === 0) return 0;
    if (pwd.length < 8) return 1;
    if (pwd.length < 10) return 2;
    if (pwd.length < 12) return 3;
    return 4;
  };
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
  const strengthLabel = ['', 'Too short', 'Weak', 'Good', 'Strong'];

  const validateLogin = () => {
    const errs = {};
    if (!loginData.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginData.email)) errs.email = 'Enter a valid email';
    if (!loginData.password) errs.password = 'Password is required';
    return errs;
  };

  const validateRegister = () => {
    const errs = {};
    if (!regData.name.trim()) errs.name = 'Full name is required';
    if (!regData.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(regData.email)) errs.email = 'Enter a valid email';
    if (!regData.password) {
  errs.password = 'Password is required';
} else if (regData.password.length < 8) {
  errs.password = 'Too short — minimum 8 characters required';
} else if (!/[A-Z]/.test(regData.password)) {
  errs.password = 'Add at least one uppercase letter (e.g. A, B, C)';
} else if (!/[a-z]/.test(regData.password)) {
  errs.password = 'Add at least one lowercase letter (e.g. a, b, c)';
} else if (!/[0-9]/.test(regData.password)) {
  errs.password = 'Add at least one number (e.g. 1, 2, 3)';
} else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(regData.password)) {
  errs.password = 'Add at least one special character (e.g. @, #, $, !)';
}
    return errs;
  };

  const handleLoginSubmit = async (e) => {
  e.preventDefault();
  const errs = validateLogin();
  if (Object.keys(errs).length) { setLoginErrors(errs); return; }
  setLoginErrors({});
  try {
    setLoading(true);
    const result = await login(loginData);
    if (result.success) {
      // keep spinner running, show toast, then navigate
      showToast(`Welcome back, ${result.user.name}! 👋`, 'success');
      setTimeout(() => {
        navigate(result.user.role === 'admin' ? '/admin' : '/rooms');
      }, 1500);
      // do NOT setLoading(false) on success — spinner stays until navigation
    } else {
      showToast(result.message || 'Login failed', 'error');
      setLoading(false);
    }
  } catch {
    showToast('Something went wrong', 'error');
    setLoading(false);
  }
};

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const errs = validateRegister();
    if (Object.keys(errs).length) { setRegErrors(errs); return; }
    setRegErrors({});
    try {
      setLoading(true);
      const result = await register({ ...regData, role: 'user' });
      if (result.success) {
        showToast('Account created! Please sign in.', 'success');
        setActiveTab('login');
        setRegData({ name: '', email: '', password: '' });
        setShowPassword(false);
      } else {
        showToast(result.message || 'Registration failed', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setLoginErrors({});
    setRegErrors({});
    setShowPassword(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      <ToastContainer toasts={toasts} />

      {/* Left panel — hidden on mobile */}
      <div className="login-left-panel" style={{ display: 'none', width: '52%' }}>
        <LeftPanel />
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '36px 20px',
        background: '#fff', minHeight: '100vh',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Mobile logo */}
          <div className="login-mobile-logo" style={{
            display: 'none', alignItems: 'center',
            gap: 8, marginBottom: 32, justifyContent: 'center',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, background: '#0f172a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MdMeetingRoom size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>RoomBook</span>
          </div>

          {/* ── SIGN IN ── */}
          {activeTab === 'login' && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
                  Sign in
                </h2>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                  Welcome back to RoomBook
                </p>
              </div>

              <form onSubmit={handleLoginSubmit}>
                <Field icon={<FaEnvelope size={13} />} label="Email address" error={loginErrors.email}>
                  <input
                    type="email" 
                    required
                    placeholder="you@company.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    style={inputStyle}
                  />
                </Field>

                <Field icon={<FaLock size={13} />} label="Password" error={loginErrors.password}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                    {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </Field>

                <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 18 }}>
                  <span style={{ fontSize: 13, color: '#2563eb', cursor: 'pointer', fontWeight: 500 }}>
                    Forgot password?
                  </span>
                </div>

                <button
  type="submit"
  disabled={loading}
  style={{
    width: '100%',
    padding: '13px 0',
    borderRadius: 10,
    background: loading ? '#1e293b' : '#0f172a',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    letterSpacing: '0.01em',
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    opacity: loading ? 0.9 : 1,
  }}
>
  {loading ? (
    <>
      <div
        style={{
          width: 16,
          height: 16,
          border: '2px solid rgba(255,255,255,0.3)',
          borderTop: '2px solid #fff',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      Signing in...
    </>
  ) : (
    'Sign in →'
  )}
</button>
                
              </form>

              <Divider />
              <GoogleButton />

              <p style={{ textAlign: 'center', fontSize: 13.5, color: '#64748b', marginTop: 20 }}>
                Don't have an account?{' '}
                <span onClick={() => switchTab('register')}
                  style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>
                  Sign up
                </span>
              </p>
            </>
          )}

          {/* ── SIGN UP ── */}
          {activeTab === 'register' && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
                  Create account
                </h2>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                  Join your team on RoomBook
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit}>
                <Field icon={<FaUser size={13} />} label="Full name" error={regErrors.name}>
                  <input
                    type="text" placeholder="Your full name"
                    required
                    value={regData.name}
                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                    style={inputStyle}
                  />
                </Field>

                <Field icon={<FaEnvelope size={13} />} label="Email address" error={regErrors.email}>
                  <input
                    type="email" placeholder="you@company.com"
                    required
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    style={inputStyle}
                  />
                </Field>

                <Field icon={<FaLock size={13} />} label="Password" error={regErrors.password}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 8 characters"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                    {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </Field>

                {/* Password strength */}
                {regData.password.length > 0 && (
                  <div style={{ marginTop: -8, marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                      {[1, 2, 3, 4].map((level) => {
                        const strength = getStrength(regData.password);
                        return (
                          <div key={level} style={{
                            flex: 1, height: 3, borderRadius: 99,
                            background: level <= strength ? strengthColor[strength] : '#e2e8f0',
                            transition: 'background 0.2s',
                          }} />
                        );
                      })}
                    </div>
                    <p style={{ fontSize: 11.5, color: strengthColor[getStrength(regData.password)], margin: 0, fontWeight: 500 }}>
                      {strengthLabel[getStrength(regData.password)]}
                    </p>
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
  width: '100%', padding: '13px 0', borderRadius: 10,
  background: loading ? '#1e293b' : '#0f172a',
  color: '#fff', fontSize: 14, fontWeight: 600,
  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
  letterSpacing: '0.01em', marginBottom: 4,
  display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: 10,
  opacity: loading ? 0.9 : 1,
}}>
  {loading ? (
    <>
      <div style={{
        width: 16, height: 16,
        border: '2px solid rgba(255,255,255,0.3)',
        borderTop: '2px solid #fff',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      Creating account...
    </>
  ) : (
    'Create account →'
  )}
</button>
              </form>

              <Divider />
              <GoogleButton />

              <p style={{ textAlign: 'center', fontSize: 13.5, color: '#64748b', marginTop: 20 }}>
                Already have an account?{' '}
                <span onClick={() => switchTab('login')}
                  style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>
                  Sign in
                </span>
              </p>
            </>
          )}

          <p style={{ textAlign: 'center', fontSize: 11.5, color: '#cbd5e1', marginTop: 28 }}>
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

export default LoginPage;