import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdMeetingRoom } from 'react-icons/md';
import {
  FaCalendarAlt, FaTachometerAlt,
  FaSignOutAlt, FaUser, FaBars, FaTimes,
} from 'react-icons/fa';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/rooms', label: 'Rooms', icon: <FaCalendarAlt size={13} /> },
    { to: '/mybookings', label: 'My Bookings', icon: <FaCalendarAlt size={13} /> },
    ...(isAdmin()
      ? [{ to: '/admin', label: 'Admin Panel', icon: <FaTachometerAlt size={13} /> }]
      : []),
  ];

  return (
    <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <div className="flex items-center gap-2">
            <MdMeetingRoom size={26} className="text-blue-500" />
            <span className="text-lg font-semibold text-slate-900 tracking-tight">
              RoomBook
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive(link.to)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-gray-100 hover:text-slate-800'
                  }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
              <FaUser size={11} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-800">
                {user?.name}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                ${user?.role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
                }`}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all duration-150 cursor-pointer"
            >
              <FaSignOutAlt size={13} />
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-gray-100"
          >
            {menuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>

        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2">

          {/* User info */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl mb-3">
            <FaUser size={11} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-800">{user?.name}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-auto
              ${user?.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
              }`}>
              {user?.role}
            </span>
          </div>

          {/* Nav links */}
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive(link.to)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-gray-100'
                }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-all"
          >
            <FaSignOutAlt size={13} />
            Logout
          </button>

        </div>
      )}
    </nav>
  );
}

export default Navbar;