import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdMeetingRoom } from 'react-icons/md';
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';

function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!loginData.email || !loginData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const result = await login(loginData);

      if (result.success) {
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/rooms');
        }
      } else {
        setError(result.message);
      }

    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!registerData.name || !registerData.email || !registerData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (registerData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      const result = await register(registerData);

      if (result.success) {
        setActiveTab('login');
        setError('');
      } else {
        setError(result.message);
      }

    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Left Panel */}
      <div className="hidden md:flex md:w-5/12 bg-slate-900 flex-col justify-between p-10">
        <div className="flex items-center gap-2">
          <img src="/plax logo.png" alt="Plaxonic logo" className='h-7 w-auto object-contain rounded-1xl' />
          
          <span className="text-white text-xl font-semibold" sr> Plaxonic Technologies</span>
        </div>
        <div>
          <h1 className="text-white text-3xl font-semibold leading-snug mb-4">
            Smart meeting room booking for your team
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Reserve the right room at the right time. No conflicts, no double bookings, no hassle.
          </p>
        </div>
        <div className="flex gap-10">
          <div>
            <p className="text-white text-2xl font-semibold">0</p>
            <p className="text-slate-500 text-xs mt-1">Double bookings</p>
          </div>
          <div>
            <p className="text-white text-2xl font-semibold">Real-time</p>
            <p className="text-slate-500 text-xs mt-1">Availability</p>
          </div>
          <div>
            <p className="text-white text-2xl font-semibold">Fast</p>
            <p className="text-slate-500 text-xs mt-1">Room booking</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-gray-50 min-h-screen md:min-h-0">
        <div className="w-full max-w-md">

          {/* Tabs */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-8 bg-white">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 py-3 text-sm font-medium transition-all duration-150
                ${activeTab === 'login'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Login
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`flex-1 py-3 text-sm font-medium transition-all duration-150
                ${activeTab === 'register'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form
              onSubmit={handleLoginSubmit}
              className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col gap-5"
            >
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Welcome back</h2>
                <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-blue-400 transition-colors bg-white">
                  <FaEnvelope size={13} className="text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder="you@company.com"
                    className="flex-1 text-sm text-slate-800 outline-none bg-transparent placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Password
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-blue-400 transition-colors bg-white">
                  <FaLock size={13} className="text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="••••••••"
                    className="flex-1 text-sm text-slate-800 outline-none bg-transparent placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form
              onSubmit={handleRegisterSubmit}
              className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col gap-5"
            >
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Create account</h2>
                <p className="text-sm text-slate-500 mt-1">Join your team workspace</p>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-blue-400 transition-colors bg-white">
                  <FaUser size={13} className="text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    placeholder="Your full name"
                    className="flex-1 text-sm text-slate-800 outline-none bg-transparent placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-blue-400 transition-colors bg-white">
                  <FaEnvelope size={13} className="text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    placeholder="you@company.com"
                    className="flex-1 text-sm text-slate-800 outline-none bg-transparent placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Password
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-blue-400 transition-colors bg-white">
                  <FaLock size={13} className="text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="Min 8 characters"
                    className="flex-1 text-sm text-slate-800 outline-none bg-transparent placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
              </div>

              {/* Role Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  I am a
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRegisterData({ ...registerData, role: 'user' })}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-all duration-150
                      ${registerData.role === 'user'
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'border-gray-200 text-slate-500 hover:border-gray-300'
                      }`}
                  >
                    User
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterData({ ...registerData, role: 'admin' })}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-all duration-150
                      ${registerData.role === 'admin'
                        ? 'bg-purple-50 border-purple-400 text-purple-700'
                        : 'border-gray-200 text-slate-500 hover:border-gray-300'
                      }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>

            </form>
          )}

        </div>
      </div>

    </div>
  );
}

export default LoginPage;