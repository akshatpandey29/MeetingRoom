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

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, colorClass, bgClass }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${bgClass} ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── booking card ──────────────────────────────────────────────────────────────
function BookingCard({ booking, onCancel, onReschedule, onCheckin, onEnd, onExtend, viewMode }) {
  const state = getBookingState(booking);
  const isToday = booking.date === getTodayDate();

  const stateConfig = {
    'upcoming':    { label: 'Upcoming',        bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
    'can-checkin': { label: 'Check in now',     bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
    'active':      { label: 'In use',           bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'completed':   { label: 'Completed',        bg: 'bg-slate-100',  text: 'text-slate-500',   dot: 'bg-slate-400' },
    'cancelled':   { label: 'Cancelled',        bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400' },
  };

  const cfg = stateConfig[state] || stateConfig['upcoming'];

  if (viewMode === 'list') {
    return (
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-5 py-4">
          <div>
            <p className="text-sm font-bold text-slate-800 whitespace-nowrap">{formatDisplayDate(booking.date)}</p>
            {isToday && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Today</span>}
          </div>
        </td>
        <td className="px-3 py-4">
          <div className="flex items-center gap-1.5 text-sm text-slate-600 whitespace-nowrap">
            <FaClock size={11} className="text-blue-400 flex-shrink-0" />
            {booking.slot}
          </div>
        </td>
        <td className="px-3 py-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FaDoorOpen size={12} className="text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">{booking.roomName}</p>
          </div>
        </td>
        <td className="px-3 py-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${state === 'active' ? 'animate-pulse' : ''}`} />
            {cfg.label}
          </span>
        </td>
        <td className="px-3 py-4">
          <ActionButtons
            state={state}
            booking={booking}
            onCancel={onCancel}
            onReschedule={onReschedule}
            onCheckin={onCheckin}
            onEnd={onEnd}
            onExtend={onExtend}
            compact
          />
        </td>
      </tr>
    );
  }

  // Grid card
  return (
    <div className={`border rounded-2xl p-4 hover:shadow-md transition-all ${
      state === 'active' ? 'border-emerald-200 bg-emerald-50/30' :
      state === 'can-checkin' ? 'border-amber-200 bg-amber-50/30' :
      'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
            <FaDoorOpen size={13} className={cfg.text} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 leading-tight">{booking.roomName}</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${state === 'active' ? 'animate-pulse' : ''}`} />
          {cfg.label}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <FaCalendarAlt size={10} className="text-blue-400 flex-shrink-0" />
          <span className="font-medium">{formatDisplayDate(booking.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <FaClock size={10} className="text-blue-400 flex-shrink-0" />
          <span>{booking.slot}</span>
        </div>
        {booking.purpose && (
          <div className="text-xs text-slate-400 italic">"{booking.purpose}"</div>
        )}
      </div>

      <ActionButtons
        state={state}
        booking={booking}
        onCancel={onCancel}
        onReschedule={onReschedule}
        onCheckin={onCheckin}
        onEnd={onEnd}
        onExtend={onExtend}
      />
    </div>
  );
}

// ── Action buttons ────────────────────────────────────────────────────────────
function ActionButtons({ state, booking, onCancel, onReschedule, onCheckin, onEnd, onExtend, compact }) {
  const btnBase = compact
    ? "flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
    : "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-colors";

  if (state === 'active') {
    return (
      <div className={compact ? "flex items-center gap-2" : "flex gap-2"}>
        <button onClick={() => onEnd(booking.id)}
          className={`${btnBase} bg-red-500 text-white hover:bg-red-600`}>
          <FaStopCircle size={11} /> End Meeting
        </button>
        <button onClick={() => onExtend(booking.id, 15)}
          className={`${btnBase} bg-white border border-gray-200 text-slate-700 hover:bg-slate-50`}>
          <FaPlusCircle size={11} /> Extend 15m
        </button>
      </div>
    );
  }

  if (state === 'can-checkin') {
    return (
      <div className={compact ? "flex items-center gap-2" : "flex gap-2"}>
        <button onClick={() => onCheckin(booking.id)}
          className={`${btnBase} bg-amber-500 text-white hover:bg-amber-600`}>
          <FaSignInAlt size={11} /> Check In
        </button>
        <button onClick={() => onCancel(booking.id)}
          className={`${btnBase} bg-red-50 text-red-600 hover:bg-red-100`}>
          <FaTimesCircle size={11} /> Cancel
        </button>
      </div>
    );
  }

  if (state === 'upcoming') {
    return (
      <div className={compact ? "flex items-center gap-2" : "flex gap-2"}>
        <button onClick={() => onReschedule(booking)}
          className={`${btnBase} bg-slate-100 text-slate-700 hover:bg-slate-200`}>
          <FaEdit size={11} /> Reschedule
        </button>
        <button onClick={() => onCancel(booking.id)}
          className={`${btnBase} bg-red-50 text-red-600 hover:bg-red-100`}>
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
  const [viewMode, setViewMode] = useState('list');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingModalDate, setBookingModalDate] = useState(null);
  const [bookingModalPrefilled, setBookingModalPrefilled] = useState(null);

  // Auto-refresh every 30 seconds for live status
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMyBookings();
    }, 30000);
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

  // ── handlers ─────────────────────────────────────────────────────────────
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleCancelClick = (bookingId) => {
    setSelectedBookingId(bookingId);
    setModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    const result = await cancelBooking(selectedBookingId);
    setModalOpen(false);
    setSelectedBookingId(null);
    showMessage(result.message || 'Booking cancelled.', result.success ? 'success' : 'error');
  };

  const handleReschedule = (booking) => {
    setBookingModalDate(new Date(booking.date + 'T00:00:00'));
    setBookingModalPrefilled(booking);
    setBookingModalOpen(true);
  };

  const handleCheckin = async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/checkin`);
      if (response.data?.success) {
        showMessage('✅ Checked in successfully! Enjoy your meeting!', 'success');
        fetchMyBookings();
      } else {
        showMessage(response.data?.message || 'Check-in failed.', 'error');
      }
    } catch (error) {
      showMessage(error.response?.data?.message || 'Check-in failed. Try again.', 'error');
    }
  };

  const handleEnd = async (bookingId) => {
  try {
    const response = await api.post(`/bookings/${bookingId}/end`);
    if (response.data?.success) {
      showMessage('Meeting ended. Room is now free for others!', 'success');
      await fetchMyBookings();
      // Force page reload to clear calendar state
      setTimeout(() => window.location.reload(), 1500);
    }
      else {
        showMessage(response.data?.message || 'Failed to end meeting.', 'error');
      }
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to end meeting.', 'error');
    }
  };

  const handleExtend = async (bookingId, minutes) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/extend`, { minutes });
      if (response.data?.success) {
        showMessage(`Meeting extended by ${minutes} minutes!`, 'success');
        fetchMyBookings();
      } else {
        showMessage(response.data?.message || 'Failed to extend meeting.', 'error');
      }
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to extend meeting.', 'error');
    }
  };

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">

        <ConfirmModal
          isOpen={modalOpen}
          title="Cancel Booking"
          message="Are you sure you want to cancel this booking? This action cannot be undone."
          confirmText="Yes, Cancel"
          cancelText="Keep Booking"
          onConfirm={handleConfirmCancel}
          onCancel={() => { setModalOpen(false); setSelectedBookingId(null); }}
        />

        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => { setBookingModalOpen(false); setBookingModalPrefilled(null); }}
          selectedDate={bookingModalDate}
          prefilledBooking={bookingModalPrefilled}
          mode="reschedule"
        />

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">My Bookings</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Upcoming Bookings</h1>
          <p className="text-slate-500 mt-1 text-sm">View and manage your scheduled room bookings.</p>
        </div>

        {/* Status message */}
        {message.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
              : 'bg-red-50 border-red-100 text-red-600'
          }`}>
            {message.type === 'success' ? <FaCheckCircle size={13} /> : <FaTimesCircle size={13} />}
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
          <StatCard icon={<FaCalendarAlt />} label="Upcoming" value={upcomingBookings.length} colorClass="text-blue-600" bgClass="bg-blue-50" />
          <StatCard icon={<FaClock />} label="Today" value={todayCount} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
          <StatCard icon={<FaSignInAlt />} label="Active Now" value={activeCount} colorClass="text-amber-600" bgClass="bg-amber-50" />
          <StatCard icon={<FaCalendarAlt />} label="This Week" value={thisWeekCount} colorClass="text-violet-600" bgClass="bg-violet-50" />
        </div>

        {/* Check-in guide banner — show when there are bookings that can be checked in */}
        {upcomingBookings.some(b => getBookingState(b) === 'can-checkin') && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaSignInAlt size={14} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">Meeting starting soon!</p>
              <p className="text-xs text-amber-600">You can now check in to your meeting. Click the Check In button below.</p>
            </div>
          </div>
        )}

        {/* Active meeting banner */}
        {activeCount > 0 && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">Meeting in progress</p>
              <p className="text-xs text-emerald-600">You can end your meeting early or extend it using the buttons below.</p>
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
                <input
                  type="text" placeholder="Search room, date..."
                  value={searchText} onChange={e => setSearchText(e.target.value)}
                  className="text-xs outline-none bg-transparent text-slate-700 placeholder-slate-400 w-32"
                />
              </div>
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <FaThList size={11} /> List
                </button>
                <button onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <FaTh size={11} /> Grid
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {filteredBookings.length > 0 ? (
            <>
              {viewMode === 'list' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100">
                        {['Date', 'Time', 'Room', 'Status', 'Actions'].map(h => (
                          <th key={h} className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-5 py-3 first:px-5 px-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredBookings.map(booking => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          viewMode="list"
                          onCancel={handleCancelClick}
                          onReschedule={handleReschedule}
                          onCheckin={handleCheckin}
                          onEnd={handleEnd}
                          onExtend={handleExtend}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewMode === 'grid' && (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBookings.map(booking => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      viewMode="grid"
                      onCancel={handleCancelClick}
                      onReschedule={handleReschedule}
                      onCheckin={handleCheckin}
                      onEnd={handleEnd}
                      onExtend={handleExtend}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center px-6">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaCalendarAlt size={24} className="text-slate-300" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">
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
            { dot: 'bg-blue-500', label: 'Upcoming' },
            { dot: 'bg-amber-500 animate-pulse', label: 'Check in now (within 15 min)' },
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