import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRooms } from "../context/RoomContext";
import { MdMeetingRoom } from "react-icons/md";
import {
  FaTachometerAlt, FaSignOutAlt, FaBars, FaTimes,
  FaUsers, FaDoorOpen, FaCalendarCheck, FaFileExport,
  FaBell, FaIdCard, FaCheckCircle, FaTimesCircle,
  FaClock, FaCalendarAlt,
} from "react-icons/fa";

// ── Notification helpers ──────────────────────────────────────────────────────
function getBookingNotifications(bookings, userEmail) {
  const notifications = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  bookings
    .filter(b => b.userEmail === userEmail)
    .forEach(booking => {
      // Check-in reminder — 15 mins before start
      if (booking.status === 'confirmed' && booking.date === todayStr && booking.startTime) {
        const [sh, sm] = booking.startTime.split(':').map(Number);
        const startDT = new Date(`${booking.date}T${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}:00`);
        const diffMins = (startDT - now) / 60000;
        if (diffMins >= 0 && diffMins <= 15) {
          notifications.push({
            id: `checkin-${booking.id}`,
            type: 'checkin_reminder',
            message: `Your meeting in ${booking.roomName} starts in ${Math.ceil(diffMins)} min — check in now!`,
            time: 'Now',
            icon: 'clock',
            color: 'amber',
            bookingId: booking.id,
          });
        }
      }

      // Meeting ending soon — 10 mins before end
      if (booking.status === 'checked-in' && booking.date === todayStr && booking.endTime) {
        const [eh, em] = booking.endTime.split(':').map(Number);
        const endDT = new Date(`${booking.date}T${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}:00`);
        const diffMins = (endDT - now) / 60000;
        if (diffMins >= 0 && diffMins <= 10) {
          notifications.push({
            id: `ending-${booking.id}`,
            type: 'meeting_ending_soon',
            message: `Your meeting in ${booking.roomName} ends in ${Math.ceil(diffMins)} min`,
            time: 'Now',
            icon: 'clock',
            color: 'red',
            bookingId: booking.id,
          });
        }
      }

      // Booking confirmed (recent — last 24hrs)
      if (booking.status === 'confirmed' && booking.createdAt) {
        const createdAt = new Date(booking.createdAt);
        const hoursDiff = (now - createdAt) / 3600000;
        if (hoursDiff <= 24) {
          notifications.push({
            id: `confirmed-${booking.id}`,
            type: 'booking_confirmed',
            message: `Booking confirmed: ${booking.roomName} on ${booking.date} at ${booking.slot}`,
            time: getTimeAgo(createdAt),
            icon: 'check',
            color: 'green',
          });
        }
      }
    });

  return notifications;
}

function getTimeAgo(date) {
  const diff = (new Date() - new Date(date)) / 60000;
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${Math.floor(diff)}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

// ── Notification Bell ─────────────────────────────────────────────────────────
function NotificationBell({ bookings, userEmail }) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState([]);
  const bellRef = useRef(null);
  const navigate = useNavigate();

  const notifications = getBookingNotifications(bookings, userEmail);
  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  useEffect(() => {
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = () => setReadIds(notifications.map(n => n.id));

  const colorMap = {
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
    red: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  };

  const iconMap = {
    check: <FaCheckCircle size={13} />,
    clock: <FaClock size={13} />,
    calendar: <FaCalendarAlt size={13} />,
    cancel: <FaTimesCircle size={13} />,
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
      >
        <FaBell size={15} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-400">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(n => {
                const colors = colorMap[n.color] || colorMap.blue;
                const isRead = readIds.includes(n.id);
                return (
                  <div
                      key={n.id}
                      onClick={() => {
                        setReadIds(prev => [...prev, n.id]);
                        setOpen(false);
                        navigate(n.bookingId ? '/mybookings' : '/mybookings');
                      }}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                        isRead ? 'opacity-60' : ''
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}>
                      {iconMap[n.icon] || <FaBell size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                    {!isRead && (
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${colors.dot}`} />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaBell size={16} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">No notifications</p>
                <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-slate-50">
            <Link
              to="/mybookings"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View all bookings →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { bookings } = useRooms();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropOpen, setProfileDropOpen] = useState(false);
  const profileRef = useRef(null);

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

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const userNavLinks = [
  { to: "/rooms", label: "Rooms", icon: <FaDoorOpen size={13} /> },
  { to: "/mybookings", label: "My Bookings", icon: <FaCalendarCheck size={13} /> },
  // { to: "/calendar", label: "Calendar", icon: <FaCalendarAlt size={13} /> },
];

  const adminMobileLinks = [
    { id: "bookings", label: "Bookings", icon: <FaCalendarCheck size={14} /> },
    { id: "requests", label: "Requests", icon: <FaBell size={14} /> },
    { id: "users", label: "Users", icon: <FaUsers size={14} /> },
    { id: "rooms", label: "Rooms", icon: <FaDoorOpen size={14} /> },
    { id: "reports", label: "Reports", icon: <FaFileExport size={14} /> },
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

          {/* Brand */}
          <Link to={isAdmin() ? "/admin" : "/rooms"} className="flex items-center gap-2.5 no-underline">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
              <MdMeetingRoom size={18} className="text-white" />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">RoomBook</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {isAdmin() ? (
              <Link to="/admin" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive("/admin") ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-gray-100 hover:text-slate-800"
              }`}>
                <FaTachometerAlt size={13} /> Admin Panel
              </Link>
            ) : (
              userNavLinks.map((link) => (
                <Link key={link.to} to={link.to} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.to) ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-gray-100 hover:text-slate-800"
                }`}>
                  {link.icon} {link.label}
                </Link>
              ))
            )}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-2">

            {/* Notification Bell — only for regular users */}
            {!isAdmin() && (
              <NotificationBell
                bookings={bookings}
                userEmail={user?.email}
              />
            )}

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropOpen(!profileDropOpen)}
                className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <span className="text-xs font-bold text-white">{initials}</span>
              </button>

              {profileDropOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 bg-slate-50 border-b border-gray-100">
                    <p className="text-xs font-bold text-slate-700">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1.5">
                    <Link to="/profile" onClick={() => setProfileDropOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive('/profile') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-gray-50'
                      }`}>
                      <FaIdCard size={13} className="text-slate-400" /> My Profile
                    </Link>
                    {!isAdmin() && (
                      <Link to="/mybookings" onClick={() => setProfileDropOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                          isActive('/mybookings') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-gray-50'
                        }`}>
                        <FaCalendarCheck size={13} className="text-slate-400" /> My Bookings
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-gray-100 py-1.5">
                    <button type="button" onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                      <FaSignOutAlt size={13} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button type="button" onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-gray-100 transition-colors">
            {menuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1">
          <div className="flex items-center gap-3 px-3 py-3 bg-slate-50 rounded-xl mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">{initials}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{user?.name}</p>
              <p className={`text-xs font-medium ${user?.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}`}>
                {user?.role === 'admin' ? 'Administrator' : 'Team Member'}
              </p>
            </div>
          </div>

          <Link to="/profile" onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive('/profile') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-gray-100'
            }`}>
            <FaIdCard size={13} /> My Profile
          </Link>

          {isAdmin() ? (
            adminMobileLinks.map((item) => (
              <button key={item.id} type="button" onClick={() => handleAdminMobileClick(item.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all">
                {item.icon} {item.label}
              </button>
            ))
          ) : (
            userNavLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.to) ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-gray-100'
                }`}>
                {link.icon} {link.label}
              </Link>
            ))
          )}

          {/* Notification Bell — mobile */}
{!isAdmin() && (
  <div className="px-4 py-2.5 flex items-center justify-between">
    <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
      <FaBell size={13} className="text-slate-400" /> Notifications
    </span>
    <NotificationBell
      bookings={bookings}
      userEmail={user?.email}
    />
  </div>
)}

          <div className="h-px bg-gray-100 my-2" />
          <button type="button" onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-all">
            <FaSignOutAlt size={13} /> Sign out
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;