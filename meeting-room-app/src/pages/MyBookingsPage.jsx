import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalendarAlt, FaClock, FaTimesCircle,
  FaDoorOpen, FaThList, FaTh, FaEdit,
  FaCheckCircle, FaSearch,
} from 'react-icons/fa';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import BookingModal from '../components/BookingModal';

// ── helpers ──────────────────────────────────────────────────────────────────
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
  if (booking.date > today) return true;
  if (booking.date === today) {
    // if today, check if end time has not passed yet
    if (!booking.endTime) return true;
    const [eh, em] = booking.endTime.split(':').map(Number);
    const endDT = new Date();
    endDT.setHours(eh, em, 0, 0);
    return new Date() < endDT;
  }
  return false;
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

// ── main ──────────────────────────────────────────────────────────────────────
function MyBookingsPage() {
  const { bookings, cancelBooking } = useRooms();
  const { user } = useAuth();

  const [message, setMessage] = useState({ text: '', type: '' });
  const [viewMode, setViewMode] = useState('list');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingModalDate, setBookingModalDate] = useState(null);
  const [bookingModalPrefilled, setBookingModalPrefilled] = useState(null);

  // ── only my bookings, only upcoming, sorted soonest first ──────────────────
  const myAllBookings = bookings.filter(
    (b) => b.userEmail === user?.email
  );

  const upcomingBookings = myAllBookings
    .filter((b) => isUpcoming(b))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      return 0;
    });

  // search filter on top of upcoming
  const filteredBookings = upcomingBookings.filter((b) => {
    const s = searchText.toLowerCase();
    return (
      b.roomName.toLowerCase().includes(s) ||
      b.date.includes(s) ||
      b.slot.toLowerCase().includes(s)
    );
  });

  // today's upcoming bookings count
  const todayCount = upcomingBookings.filter((b) => b.date === getTodayDate()).length;

  // this week count
  const now = new Date();
  const weekEnd = new Date();
  weekEnd.setDate(now.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  const thisWeekCount = upcomingBookings.filter(
    (b) => b.date >= getTodayDate() && b.date <= weekEndStr
  ).length;

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleCancelClick = (bookingId) => {
    setSelectedBookingId(bookingId);
    setModalOpen(true);
  };

  const handleConfirmCancel = () => {
    cancelBooking(selectedBookingId);
    setModalOpen(false);
    setSelectedBookingId(null);
    setMessage({ text: 'Booking cancelled successfully.', type: 'success' });
  };

  const handleReschedule = (booking) => {
    setBookingModalDate(new Date(booking.date + 'T00:00:00'));
    setBookingModalPrefilled(booking);
    setBookingModalOpen(true);
  };

  // ── render ──────────────────────────────────────────────────────────────────
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

        {/* ── Header ── */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            My Bookings
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Upcoming Bookings
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            View and manage your scheduled room bookings.
          </p>
        </div>

        {/* ── Status message ── */}
        {message.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
              : 'bg-red-50 border-red-100 text-red-600'
          }`}>
            {message.type === 'success'
              ? <FaCheckCircle size={13} />
              : <FaTimesCircle size={13} />
            }
            {message.text}
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<FaCalendarAlt />}
            label="Upcoming"
            value={upcomingBookings.length}
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
          />
          <StatCard
            icon={<FaClock />}
            label="Today"
            value={todayCount}
            colorClass="text-emerald-600"
            bgClass="bg-emerald-50"
          />
          <StatCard
            icon={<FaDoorOpen />}
            label="This Week"
            value={thisWeekCount}
            colorClass="text-violet-600"
            bgClass="bg-violet-50"
          />
          <StatCard
            icon={<FaCalendarAlt />}
            label="Total Ever"
            value={myAllBookings.length}
            colorClass="text-amber-600"
            bgClass="bg-amber-50"
          />
        </div>

        {/* ── Bookings Panel ── */}
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
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-slate-50">
                <FaSearch size={11} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search room, date..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="text-xs outline-none bg-transparent text-slate-700 placeholder-slate-400 w-32"
                />
              </div>

              {/* View toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FaThList size={11} /> List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FaTh size={11} /> Grid
                </button>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          {filteredBookings.length > 0 ? (
            <>
              {/* LIST VIEW */}
              {viewMode === 'list' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100">
                        <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-5 py-3">Date</th>
                        <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-3 py-3">Time</th>
                        <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-3 py-3">Room</th>
                        <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-3 py-3">Status</th>
                        <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-3 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredBookings.map((booking) => {
                        const isToday = booking.date === getTodayDate();
                        return (
                          <tr key={booking.id} className="hover:bg-slate-50 transition-colors">

                            {/* Date */}
                            <td className="px-5 py-4">
                              <div>
                                <p className="text-sm font-bold text-slate-800 whitespace-nowrap">
                                  {formatDisplayDate(booking.date)}
                                </p>
                                {isToday && (
                                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    Today
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Time */}
                            <td className="px-3 py-4">
                              <div className="flex items-center gap-1.5 text-sm text-slate-600 whitespace-nowrap">
                                <FaClock size={11} className="text-blue-400 flex-shrink-0" />
                                {booking.slot}
                              </div>
                            </td>

                            {/* Room */}
                            <td className="px-3 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FaDoorOpen size={12} className="text-slate-500" />
                                </div>
                                <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                                  {booking.roomName}
                                </p>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-3 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isToday
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                {isToday ? 'Today' : 'Upcoming'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleReschedule(booking)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                                >
                                  <FaEdit size={11} /> Reschedule
                                </button>
                                <button
                                  onClick={() => handleCancelClick(booking.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
                                >
                                  <FaTimesCircle size={11} /> Cancel
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* GRID VIEW */}
              {viewMode === 'grid' && (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBookings.map((booking) => {
                    const isToday = booking.date === getTodayDate();
                    return (
                      <div key={booking.id}
                        className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all hover:border-gray-300">

                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FaDoorOpen size={13} className="text-slate-500" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 leading-tight">
                              {booking.roomName}
                            </h3>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                            isToday
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {isToday ? 'Today' : 'Upcoming'}
                          </span>
                        </div>

                        {/* Date and time */}
                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <FaCalendarAlt size={10} className="text-blue-400 flex-shrink-0" />
                            <span className="font-medium">{formatDisplayDate(booking.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <FaClock size={10} className="text-blue-400 flex-shrink-0" />
                            <span>{booking.slot}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReschedule(booking)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                          >
                            <FaEdit size={11} /> Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelClick(booking.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                          >
                            <FaTimesCircle size={11} /> Cancel
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* ── Empty state ── */
            <div className="py-16 text-center px-6">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaCalendarAlt size={24} className="text-slate-300" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">
                {searchText ? 'No bookings match your search' : 'No upcoming bookings'}
              </h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
                {searchText
                  ? 'Try a different room name or date.'
                  : 'You have no scheduled meetings. Book a room to get started.'
                }
              </p>
              {!searchText && (
                <Link
                  to="/rooms"
                  className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
                >
                  <FaDoorOpen size={13} /> Browse Rooms
                </Link>
              )}
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

export default MyBookingsPage;