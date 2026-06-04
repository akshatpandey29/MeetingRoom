import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalendarAlt, FaClock, FaTimesCircle,
  FaDoorOpen, FaThList, FaTh, FaEdit,
  FaCheckCircle, FaSearch, FaSignInAlt,
  FaStopCircle, FaPlusCircle,
} from 'react-icons/fa';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import BookingModal from '../components/BookingModal';
import api from '../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function formatDisplayDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatTime(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const dh = h % 12 || 12;
  return `${String(dh).padStart(2,'0')}:${String(m).padStart(2,'0')} ${period}`;
}

function isUpcoming(booking) {
  const today = getTodayDate();
  if (booking.status === 'cancelled' || booking.status === 'completed') return false;
  if (booking.date > today) return true;
  if (booking.date === today) {
    if (!booking.endTime) return true;
    const [eh, em] = booking.endTime.split(':').map(Number);
    const endDT = new Date();
    endDT.setHours(eh, em, 0, 0);
    return new Date() < endDT;
  }
  return false;
}

function getBookingState(booking) {
  const now = new Date();
  const today = getTodayDate();
  if (booking.status === 'checked-in') return 'active';
  if (booking.status === 'completed') return 'completed';
  if (booking.status === 'cancelled') return 'cancelled';
  if (booking.date !== today) return 'upcoming';
  if (booking.startTime) {
    const [sh, sm] = booking.startTime.split(':').map(Number);
    const startDT = new Date(`${today}T${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}:00`);
    const diffMins = (startDT - now) / 60000;
    if (diffMins <= 5 && diffMins > -60) return 'can-checkin';
    if (diffMins > 15) return 'upcoming';
  }
  return 'upcoming';
}

// ── End Meeting Modal ─────────────────────────────────────────────────────────
function EndMeetingModal({ isOpen, booking, onConfirm, onCancel }) {
  if (!isOpen || !booking) return null;
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 z-10 overflow-hidden">
        <div className="bg-slate-900 px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-red-500 bg-opacity-20 rounded-xl flex items-center justify-center">
            <FaStopCircle size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">End Meeting Early?</p>
            <p className="text-[11px] text-slate-400">This will free up the room for others</p>
          </div>
        </div>
        <div className="p-5">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Room</span>
              <span className="font-semibold text-slate-800">{booking.roomName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Scheduled until</span>
              <span className="font-semibold text-slate-800">{formatTime(booking.endTime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Ending now at</span>
              <span className="font-semibold text-red-500">{formatTime(currentTime)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-2.5 text-sm font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">
              Keep Going
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-2.5 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5">
              <FaStopCircle size={12} /> Yes, End Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card — matches screenshot style ──────────────────────────────────────
function StatCard({ icon, label, value, bgClass, iconClass, textClass }) {
  return (
    <div className={`${bgClass} rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1`}>
      <div className={`text-lg ${iconClass}`}>{icon}</div>
      <p className={`text-2xl font-bold leading-tight ${textClass}`}>{value}</p>
      <p className={`text-xs font-medium ${textClass} opacity-80`}>{label}</p>
    </div>
  );
}

// ── Booking Card ──────────────────────────────────────────────────────────────
function BookingCard({ booking, onCancel, onReschedule, onCheckin, onEnd, onExtend, viewMode }) {
  const state = getBookingState(booking);
  const isToday = booking.date === getTodayDate();

  const stateConfig = {
    'upcoming':    { label: 'Upcoming',     badgeBg: 'bg-blue-50',    badgeText: 'text-blue-600',    borderColor: '#3b82f6' },
    'can-checkin': { label: 'Check in now', badgeBg: 'bg-amber-50',   badgeText: 'text-amber-700',   borderColor: '#f59e0b' },
    'active':      { label: 'In use',       badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700', borderColor: '#10b981' },
    'completed':   { label: 'Completed',    badgeBg: 'bg-slate-100',  badgeText: 'text-slate-500',   borderColor: '#94a3b8' },
    'cancelled':   { label: 'Cancelled',    badgeBg: 'bg-red-50',     badgeText: 'text-red-600',     borderColor: '#ef4444' },
  };

  const cfg = stateConfig[state] || stateConfig['upcoming'];

  if (viewMode === 'list') {
    return (
      <tr className="hover:bg-slate-50 transition-colors border-b border-gray-50 last:border-0">
        <td className="px-5 py-4">
          <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">{formatDisplayDate(booking.date)}</p>
          {isToday && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Today</span>}
        </td>
        <td className="px-3 py-4">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 whitespace-nowrap">
            <FaClock size={10} className="text-slate-400" />
            {booking.slot}
          </div>
        </td>
        <td className="px-3 py-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FaDoorOpen size={11} className="text-blue-500" />
            </div>
            <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">{booking.roomName}</p>
          </div>
        </td>
        <td className="px-3 py-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${state === 'active' ? 'bg-emerald-500 animate-pulse' : state === 'can-checkin' ? 'bg-amber-500' : 'bg-blue-400'}`} />
            {cfg.label}
          </span>
        </td>
        <td className="px-3 py-4">
          <ActionButtons state={state} booking={booking}
            onCancel={onCancel} onReschedule={onReschedule}
            onCheckin={onCheckin} onEnd={onEnd} onExtend={onExtend} compact />
        </td>
      </tr>
    );
  }

  // Grid card — matches screenshot with left border accent
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all"
      style={{
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${cfg.borderColor}`,
      }}
    >
      <div className="p-4">
        {/* Room name + status badge */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900">{booking.roomName}</h3>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
            {cfg.label}
          </span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <FaClock size={10} className="text-slate-400 flex-shrink-0" />
          <span>
            {isToday ? 'Today' : formatDisplayDate(booking.date)}, {booking.slot}
          </span>
        </div>

        {booking.purpose && (
          <p className="text-xs text-slate-400 italic mb-3">"{booking.purpose}"</p>
        )}

        {/* Action buttons */}
        <ActionButtons state={state} booking={booking}
          onCancel={onCancel} onReschedule={onReschedule}
          onCheckin={onCheckin} onEnd={onEnd} onExtend={onExtend} />
      </div>
    </div>
  );
}

// ── Action Buttons — matches screenshot style ─────────────────────────────────
function ActionButtons({ state, booking, onCancel, onReschedule, onCheckin, onEnd, onExtend, compact }) {
  const btnBase = compact
    ? "flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
    : "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-colors border";

  if (state === 'active') {
    return (
      <div className={compact ? "flex items-center gap-2" : "flex gap-2"}>
        <button onClick={() => onEnd(booking)}
          className={`${btnBase} ${compact ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'}`}>
          <FaStopCircle size={11} /> End Meeting
        </button>
        <button onClick={() => onExtend(booking.id, 15)}
          className={`${btnBase} ${compact ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
          <FaPlusCircle size={11} /> Extend 15m
        </button>
      </div>
    );
  }
  if (state === 'can-checkin') {
    return (
      <div className={compact ? "flex items-center gap-2" : "flex gap-2"}>
        <button onClick={() => onCheckin(booking.id)}
          className={`${btnBase} ${compact ? 'bg-amber-500 text-white hover:bg-amber-600' : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
          <FaSignInAlt size={11} /> Check In
        </button>
        <button onClick={() => onCancel(booking.id)}
          className={`${btnBase} ${compact ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'}`}>
          <FaTimesCircle size={11} /> Cancel
        </button>
      </div>
    );
  }
  if (state === 'upcoming') {
    return (
      <div className={compact ? "flex items-center gap-2" : "flex gap-2"}>
        <button onClick={() => onReschedule(booking)}
          className={`${btnBase} ${compact ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
          <FaEdit size={11} /> Reschedule
        </button>
        <button onClick={() => onCancel(booking.id)}
          className={`${btnBase} ${compact ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'}`}>
          <FaTimesCircle size={11} /> Cancel
        </button>
      </div>
    );
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
function MyBookingsPage() {
  const { bookings, myBookings, cancelBooking, fetchMyBookings } = useRooms();
  const { user } = useAuth();

  const [message, setMessage] = useState({ text: '', type: '' });
  const [viewMode, setViewMode] = useState('grid');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [endBooking, setEndBooking] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingModalDate, setBookingModalDate] = useState(null);
  const [bookingModalPrefilled, setBookingModalPrefilled] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => { fetchMyBookings(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchMyBookings]);

  const myAllBookings = myBookings.length > 0
    ? myBookings
    : bookings.filter(b => b.userEmail === user?.email);

  const upcomingBookings = myAllBookings
    .filter(b => isUpcoming(b))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      return 0;
    });

  const filteredBookings = upcomingBookings.filter(b => {
    const s = searchText.toLowerCase();
    return b.roomName.toLowerCase().includes(s) || b.date.includes(s) || b.slot.toLowerCase().includes(s);
  });

  const todayCount = upcomingBookings.filter(b => b.date === getTodayDate()).length;
  const activeCount = upcomingBookings.filter(b => b.status === 'checked-in').length;
  const now = new Date();
  const weekEnd = new Date(); weekEnd.setDate(now.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  const thisWeekCount = upcomingBookings.filter(b => b.date >= getTodayDate() && b.date <= weekEndStr).length;

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleCancelClick = (bookingId) => { setSelectedBookingId(bookingId); setModalOpen(true); };
  const handleConfirmCancel = async () => {
    const result = await cancelBooking(selectedBookingId);
    setModalOpen(false); setSelectedBookingId(null);
    showMessage(result.message || 'Booking cancelled.', result.success ? 'success' : 'error');
  };
  const handleReschedule = (booking) => {
    setBookingModalDate(new Date(booking.date + 'T00:00:00'));
    setBookingModalPrefilled(booking); setBookingModalOpen(true);
  };
  const handleCheckin = async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/checkin`);
      if (response.data?.success) { showMessage('Checked in successfully! Enjoy your meeting!', 'success'); fetchMyBookings(); }
      else showMessage(response.data?.message || 'Check-in failed.', 'error');
    } catch (error) { showMessage(error.response?.data?.message || 'Check-in failed. Try again.', 'error'); }
  };
  const handleEnd = (booking) => { setEndBooking(booking); setEndModalOpen(true); };
  const handleConfirmEnd = async () => {
    setEndModalOpen(false);
    try {
      const response = await api.post(`/bookings/${endBooking.id}/end`);
      if (response.data?.success) {
        showMessage('Meeting ended. Room is now free for others!', 'success');
        await fetchMyBookings();
        setTimeout(() => window.location.reload(), 1500);
      } else showMessage(response.data?.message || 'Failed to end meeting.', 'error');
    } catch (error) { showMessage(error.response?.data?.message || 'Failed to end meeting.', 'error'); }
    finally { setEndBooking(null); }
  };
  const handleExtend = async (bookingId, minutes) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/extend`, { minutes });
      if (response.data?.success) { showMessage(`Meeting extended by ${minutes} minutes!`, 'success'); fetchMyBookings(); }
      else showMessage(response.data?.message || 'Failed to extend meeting.', 'error');
    } catch (error) { showMessage(error.response?.data?.message || 'Failed to extend meeting.', 'error'); }
  };

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">

        <ConfirmModal isOpen={modalOpen} title="Cancel Booking"
          message="Are you sure you want to cancel this booking? This action cannot be undone."
          confirmText="Yes, Cancel" cancelText="Keep Booking"
          onConfirm={handleConfirmCancel}
          onCancel={() => { setModalOpen(false); setSelectedBookingId(null); }} />

        <EndMeetingModal isOpen={endModalOpen} booking={endBooking}
          onConfirm={handleConfirmEnd}
          onCancel={() => { setEndModalOpen(false); setEndBooking(null); }} />

        <BookingModal isOpen={bookingModalOpen}
          onClose={() => { setBookingModalOpen(false); setBookingModalPrefilled(null); }}
          selectedDate={bookingModalDate} prefilledBooking={bookingModalPrefilled} mode="reschedule" />

        {/* Header */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">My Bookings</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Upcoming Bookings</h1>
          <p className="text-slate-400 mt-1 text-sm">View and manage your scheduled room bookings.</p>
        </div>

        {/* Status message */}
        {message.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {message.type === 'success' ? <FaCheckCircle size={13} /> : <FaTimesCircle size={13} />}
            {message.text}
          </div>
        )}

        {/* Stats — matches screenshot colored cards */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard icon={<FaCalendarAlt />} label="Upcoming" value={upcomingBookings.length}
            bgClass="bg-blue-50" iconClass="text-blue-500" textClass="text-blue-700" />
          <StatCard icon={<FaClock />} label="Today" value={todayCount}
            bgClass="bg-emerald-50" iconClass="text-emerald-500" textClass="text-emerald-700" />
          <StatCard icon={<FaSignInAlt />} label="Active" value={activeCount}
            bgClass="bg-amber-50" iconClass="text-amber-500" textClass="text-amber-700" />
          <StatCard icon={<FaCalendarAlt />} label="This week" value={thisWeekCount}
            bgClass="bg-slate-100" iconClass="text-slate-500" textClass="text-slate-700" />
        </div>

        {/* Check-in banner */}
        {upcomingBookings.some(b => getBookingState(b) === 'can-checkin') && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaSignInAlt size={13} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Meeting starting soon!</p>
              <p className="text-xs text-amber-600">You can now check in to your meeting.</p>
            </div>
          </div>
        )}

        {/* Active meeting banner — matches screenshot green banner */}
        {activeCount > 0 && (
          <div className="mb-4 bg-emerald-50 border border-emerald-300 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="w-3 h-3 bg-emerald-500 rounded-sm flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Meeting in progress</p>
              <p className="text-xs text-emerald-600">End early or extend below</p>
            </div>
          </div>
        )}

        {/* Bookings Panel */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Panel header */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Your Upcoming Bookings</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} scheduled
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-slate-50">
                <FaSearch size={11} className="text-slate-400 flex-shrink-0" />
                <input type="text" placeholder="Search room, date..."
                  value={searchText} onChange={e => setSearchText(e.target.value)}
                  className="text-xs outline-none bg-transparent text-slate-700 placeholder-slate-400 w-32" />
              </div>
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <FaThList size={10} /> List
                </button>
                <button onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <FaTh size={10} /> Grid
                </button>
              </div>
            </div>
          </div>

          {filteredBookings.length > 0 ? (
            <>
              {viewMode === 'list' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100">
                        {['Date', 'Time', 'Room', 'Status', 'Actions'].map(h => (
                          <th key={h} className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(booking => (
                        <BookingCard key={booking.id} booking={booking} viewMode="list"
                          onCancel={handleCancelClick} onReschedule={handleReschedule}
                          onCheckin={handleCheckin} onEnd={handleEnd} onExtend={handleExtend} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {viewMode === 'grid' && (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} viewMode="grid"
                      onCancel={handleCancelClick} onReschedule={handleReschedule}
                      onCheckin={handleCheckin} onEnd={handleEnd} onExtend={handleExtend} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center px-6">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaCalendarAlt size={24} className="text-slate-300" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-2">
                {searchText ? 'No bookings match your search' : 'No upcoming bookings'}
              </h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
                {searchText ? 'Try a different room name or date.' : 'You have no scheduled meetings. Book a room to get started.'}
              </p>
              {!searchText && (
                <Link to="/rooms" className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
                  <FaDoorOpen size={13} /> Browse Rooms
                </Link>
              )}
              {searchText && (
                <button onClick={() => setSearchText('')}
                  className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400 px-1">
          {[
            { dot: 'bg-blue-400', label: 'Upcoming' },
            { dot: 'bg-amber-400 animate-pulse', label: 'Check in now' },
            { dot: 'bg-emerald-500 animate-pulse', label: 'Active / In use' },
          ].map(({ dot, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              {label}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default MyBookingsPage;