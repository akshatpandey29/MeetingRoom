import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MdMeetingRoom } from "react-icons/md";
import {
  FaCalendarAlt, FaTachometerAlt, FaSignOutAlt, FaUser,
  FaBars, FaTimes, FaUsers, FaDoorOpen, FaCalendarCheck,
  FaFileExport, FaBell, FaChevronDown, FaIdCard,
} from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropOpen, setProfileDropOpen] = useState(false);
  const profileRef = useRef(null);

  // close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setProfileDropOpen(false);
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  // initials avatar
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const userNavLinks = [
    { to: "/rooms", label: "Rooms", icon: <FaDoorOpen size={13} /> },
    { to: "/mybookings", label: "My Bookings", icon: <FaCalendarCheck size={13} /> },
  ];

  const adminMobileLinks = [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt size={14} /> },
    { id: "users", label: "Users", icon: <FaUsers size={14} /> },
    { id: "rooms", label: "Rooms", icon: <FaDoorOpen size={14} /> },
    { id: "bookings", label: "Booking Management", icon: <FaCalendarCheck size={14} /> },
    { id: "requests", label: "Booking Requests", icon: <FaBell size={14} /> },
    { id: "exports", label: "Admin Exports", icon: <FaFileExport size={14} /> },
  ];

  const handleAdminMobileClick = (sectionId) => {
    navigate("/admin");
    window.dispatchEvent(new CustomEvent("change-admin-section", { detail: sectionId }));
    setMenuOpen(false);
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand ── */}
          <Link
            to={isAdmin() ? "/admin" : "/rooms"}
            className="flex items-center gap-2.5 no-underline"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
              <MdMeetingRoom size={18} className="text-white" />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">
              RoomBook
            </span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-1">
            {isAdmin() ? (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive("/admin")
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-gray-100 hover:text-slate-800"
                }`}
              >
                <FaTachometerAlt size={13} /> Admin Panel
              </Link>
            ) : (
              userNavLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-500 hover:bg-gray-100 hover:text-slate-800"
                  }`}
                >
                  {link.icon} {link.label}
                </Link>
              ))
            )}
          </div>

          {/* ── Desktop Right ── */}
          <div className="hidden md:flex items-center gap-3">

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
  type="button"
  onClick={() => setProfileDropOpen(!profileDropOpen)}
  className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center hover:opacity-80 transition-opacity"
>
  <span className="text-xs font-bold text-white">{initials}</span>
</button>

              {/* Dropdown menu */}
              {profileDropOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
                  {/* User info header */}
                  <div className="px-4 py-3 bg-slate-50 border-b border-gray-100">
                    <p className="text-xs font-bold text-slate-700">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{user?.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive('/profile')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-gray-50'
                      }`}
                    >
                      <FaIdCard size={13} className="text-slate-400" />
                      My Profile
                    </Link>

                    {!isAdmin() && (
                      <Link
                        to="/mybookings"
                        onClick={() => setProfileDropOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                          isActive('/mybookings')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-gray-50'
                        }`}
                      >
                        <FaCalendarCheck size={13} className="text-slate-400" />
                        My Bookings
                      </Link>
                    )}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 py-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <FaSignOutAlt size={13} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-gray-100 transition-colors"
          >
            {menuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1">

          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-3 bg-slate-50 rounded-xl mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">{initials}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{user?.name}</p>
              <p className={`text-xs font-medium ${
                user?.role === 'admin' ? 'text-purple-600' : 'text-blue-600'
              }`}>
                {user?.role === 'admin' ? 'Administrator' : 'Team Member'}
              </p>
            </div>
          </div>

          {/* Profile link */}
          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive('/profile') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-gray-100'
            }`}
          >
            <FaIdCard size={13} /> My Profile
          </Link>

          {/* Admin links */}
          {isAdmin() ? (
            adminMobileLinks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAdminMobileClick(item.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
              >
                {item.icon} {item.label}
              </button>
            ))
          ) : (
            userNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.to) ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-gray-100'
                }`}
              >
                {link.icon} {link.label}
              </Link>
            ))
          )}

          <div className="h-px bg-gray-100 my-2" />

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-all"
          >
            <FaSignOutAlt size={13} /> Sign out
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;