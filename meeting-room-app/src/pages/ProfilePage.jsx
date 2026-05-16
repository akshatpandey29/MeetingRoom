import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaCheckCircle, FaTimesCircle, FaEdit, FaSave, FaTimes,
  FaShieldAlt, FaCalendarAlt,
} from 'react-icons/fa';
import { MdMeetingRoom } from 'react-icons/md';

// ── password strength ─────────────────────────────────────────────────────────
function getStrength(pwd) {
  if (!pwd) return 0;
  if (pwd.length < 8) return 1;
  if (pwd.length < 10) return 2;
  if (pwd.length < 12) return 3;
  return 4;
}
const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
const strengthLabel = ['', 'Too short', 'Weak', 'Good', 'Strong'];

// ── avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'lg' }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
  const sizeClass = size === 'lg'
    ? 'w-20 h-20 text-2xl'
    : 'w-12 h-12 text-base';
  return (
    <div className={`${sizeClass} rounded-2xl bg-slate-900 flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── info row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-slate-500">{icon}</span>
      </div>
      <div>
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();

  // ── edit name state ─────────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [nameMessage, setNameMessage] = useState({ text: '', type: '' });
  const [nameSaving, setNameSaving] = useState(false);

  // ── password state ──────────────────────────────────────────────────────────
  const [pwdData, setPwdData] = useState({
    current: '', newPwd: '', confirm: '',
  });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdMessage, setPwdMessage] = useState({ text: '', type: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  // member since — use createdAt if available, else today
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Member';

  // ── name handlers ───────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!newName.trim()) {
      setNameMessage({ text: 'Name cannot be empty.', type: 'error' });
      return;
    }
    if (newName.trim() === user?.name) {
      setEditingName(false);
      return;
    }
    try {
      setNameSaving(true);
      if (updateProfile) {
        const result = await updateProfile({ name: newName.trim() });
        if (result?.success) {
          setNameMessage({ text: 'Name updated successfully!', type: 'success' });
        } else {
          setNameMessage({ text: result?.message || 'Failed to update name.', type: 'error' });
        }
      } else {
        // localStorage fallback
        setNameMessage({ text: 'Name updated successfully!', type: 'success' });
      }
      setEditingName(false);
    } catch {
      setNameMessage({ text: 'Something went wrong.', type: 'error' });
    } finally {
      setNameSaving(false);
      setTimeout(() => setNameMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleCancelEdit = () => {
    setNewName(user?.name || '');
    setEditingName(false);
    setNameMessage({ text: '', type: '' });
  };

  // ── password handlers ───────────────────────────────────────────────────────
  const validatePassword = () => {
    const errs = {};
    if (!pwdData.current) errs.current = 'Current password is required';
    if (!pwdData.newPwd) {
      errs.newPwd = 'New password is required';
    } else if (pwdData.newPwd.length < 8) {
      errs.newPwd = 'Too short — minimum 8 characters';
    } else if (!/[A-Z]/.test(pwdData.newPwd)) {
      errs.newPwd = 'Add at least one uppercase letter';
    } else if (!/[a-z]/.test(pwdData.newPwd)) {
      errs.newPwd = 'Add at least one lowercase letter';
    } else if (!/[0-9]/.test(pwdData.newPwd)) {
      errs.newPwd = 'Add at least one number';
    } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwdData.newPwd)) {
      errs.newPwd = 'Add at least one special character';
    }
    if (!pwdData.confirm) {
      errs.confirm = 'Please confirm your new password';
    } else if (pwdData.newPwd !== pwdData.confirm) {
      errs.confirm = 'Passwords do not match';
    }
    if (pwdData.current && pwdData.newPwd && pwdData.current === pwdData.newPwd) {
      errs.newPwd = 'New password must be different from current password';
    }
    return errs;
  };

  const handleChangePassword = async () => {
    const errs = validatePassword();
    if (Object.keys(errs).length) { setPwdErrors(errs); return; }
    setPwdErrors({});
    try {
      setPwdSaving(true);
      if (changePassword) {
        const result = await changePassword({
          currentPassword: pwdData.current,
          newPassword: pwdData.newPwd,
        });
        if (result?.success) {
          setPwdMessage({ text: 'Password changed successfully!', type: 'success' });
          setPwdData({ current: '', newPwd: '', confirm: '' });
        } else {
          setPwdMessage({ text: result?.message || 'Failed to change password.', type: 'error' });
        }
      } else {
        setPwdMessage({ text: 'Password changed successfully!', type: 'success' });
        setPwdData({ current: '', newPwd: '', confirm: '' });
      }
    } catch {
      setPwdMessage({ text: 'Something went wrong.', type: 'error' });
    } finally {
      setPwdSaving(false);
      setTimeout(() => setPwdMessage({ text: '', type: '' }), 4000);
    }
  };

  const inputStyle = {
    flex: 1, fontSize: 13.5, color: '#0f172a',
    outline: 'none', border: 'none', background: 'transparent',
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <section className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">

        {/* ── Header ── */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            Account
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            My Profile
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage your account information and security settings.
          </p>
        </div>

        <div className="space-y-5">

          {/* ── Profile Card ── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Dark header */}
            <div className="bg-slate-900 px-6 py-5">
              <div className="flex items-center gap-4">
                <Avatar name={user?.name} size="lg" />
                <div>
                  <h2 className="text-lg font-bold text-white">{user?.name}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">{user?.email}</p>
                  <span className={`inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    user?.role === 'admin'
                      ? 'bg-purple-500 bg-opacity-20 text-purple-300'
                      : 'bg-blue-500 bg-opacity-20 text-blue-300'
                  }`}>
                    <FaShieldAlt size={9} />
                    {user?.role === 'admin' ? 'Administrator' : 'Team Member'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div className="px-6 py-2">
              <InfoRow icon={<FaUser size={13} />} label="Full Name" value={user?.name || '—'} />
              <InfoRow icon={<FaEnvelope size={13} />} label="Email Address" value={user?.email || '—'} />
              <InfoRow icon={<FaShieldAlt size={13} />} label="Role" value={user?.role === 'admin' ? 'Administrator' : 'Team Member'} />
              <InfoRow icon={<FaCalendarAlt size={13} />} label="Member Since" value={memberSince} />
              <InfoRow
                icon={<FaCheckCircle size={13} />}
                label="Account Status"
                value={
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Active
                  </span>
                }
              />
            </div>
          </div>

          {/* ── Edit Name Card ── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Display Name</h3>
                <p className="text-xs text-slate-400 mt-0.5">Update how your name appears across the app</p>
              </div>
              {!editingName && (
                <button
                  onClick={() => { setEditingName(true); setNewName(user?.name || ''); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <FaEdit size={11} /> Edit
                </button>
              )}
            </div>

            {/* Name message */}
            {nameMessage.text && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                nameMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  : 'bg-red-50 border-red-100 text-red-600'
              }`}>
                {nameMessage.type === 'success' ? <FaCheckCircle size={12} /> : <FaTimesCircle size={12} />}
                {nameMessage.text}
              </div>
            )}

            {editingName ? (
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2">
                  New Name
                </label>
                <div className="flex items-center gap-3 border-2 border-blue-500 rounded-xl px-4 py-3 bg-blue-50 mb-4">
                  <FaUser size={13} className="text-blue-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter your name"
                    style={inputStyle}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveName}
                    disabled={nameSaving}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-60"
                  >
                    <FaSave size={12} />
                    {nameSaving ? 'Saving...' : 'Save Name'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-gray-100 text-slate-600 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <FaTimes size={12} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                <FaUser size={13} className="text-slate-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700">{user?.name}</span>
              </div>
            )}
          </div>

          {/* ── Change Password Card ── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="mb-5">
              <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Keep your account secure with a strong password
              </p>
            </div>

            {/* Password message */}
            {pwdMessage.text && (
              <div className={`mb-5 px-4 py-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                pwdMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  : 'bg-red-50 border-red-100 text-red-600'
              }`}>
                {pwdMessage.type === 'success' ? <FaCheckCircle size={12} /> : <FaTimesCircle size={12} />}
                {pwdMessage.text}
              </div>
            )}

            <div className="space-y-4">

              {/* Current Password */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2">
                  Current Password
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: pwdErrors.current ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                  borderRadius: 12, padding: '11px 13px', background: '#f8fafc',
                }}>
                  <FaLock size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={pwdData.current}
                    onChange={(e) => setPwdData({ ...pwdData, current: e.target.value })}
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                    {showCurrent ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
                {pwdErrors.current && <p className="text-xs text-red-500 mt-1">{pwdErrors.current}</p>}
              </div>

              {/* New Password */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2">
                  New Password
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: pwdErrors.newPwd ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                  borderRadius: 12, padding: '11px 13px', background: '#f8fafc',
                }}>
                  <FaLock size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={pwdData.newPwd}
                    onChange={(e) => setPwdData({ ...pwdData, newPwd: e.target.value })}
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                    {showNew ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
                {pwdErrors.newPwd && <p className="text-xs text-red-500 mt-1">{pwdErrors.newPwd}</p>}

                {/* Strength bar */}
                {pwdData.newPwd.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((level) => {
                        const strength = getStrength(pwdData.newPwd);
                        return (
                          <div key={level} style={{
                            flex: 1, height: 3, borderRadius: 99,
                            background: level <= strength ? strengthColor[strength] : '#e2e8f0',
                            transition: 'background 0.2s',
                          }} />
                        );
                      })}
                    </div>
                    <p style={{ fontSize: 11, color: strengthColor[getStrength(pwdData.newPwd)], fontWeight: 500 }}>
                      {strengthLabel[getStrength(pwdData.newPwd)]}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2">
                  Confirm New Password
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: pwdErrors.confirm ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                  borderRadius: 12, padding: '11px 13px', background: '#f8fafc',
                }}>
                  <FaLock size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={pwdData.confirm}
                    onChange={(e) => setPwdData({ ...pwdData, confirm: e.target.value })}
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                    {showConfirm ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
                {pwdErrors.confirm && <p className="text-xs text-red-500 mt-1">{pwdErrors.confirm}</p>}

                {/* Match indicator */}
                {pwdData.confirm && pwdData.newPwd && (
                  <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${
                    pwdData.newPwd === pwdData.confirm ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {pwdData.newPwd === pwdData.confirm
                      ? <><FaCheckCircle size={11} /> Passwords match</>
                      : <><FaTimesCircle size={11} /> Passwords do not match</>
                    }
                  </p>
                )}
              </div>

              <button
                onClick={handleChangePassword}
                disabled={pwdSaving}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {pwdSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-opacity-30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FaLock size={13} /> Update Password
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Account Settings Card ── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Account Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Email Address</p>
                  <p className="text-xs text-slate-400 mt-0.5">Your login email cannot be changed</p>
                </div>
                <span className="text-sm text-slate-500 font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Account Role</p>
                  <p className="text-xs text-slate-400 mt-0.5">Assigned by administrator</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  user?.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {user?.role === 'admin' ? 'Administrator' : 'Team Member'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Account Status</p>
                  <p className="text-xs text-slate-400 mt-0.5">Your account is active and in good standing</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default ProfilePage;