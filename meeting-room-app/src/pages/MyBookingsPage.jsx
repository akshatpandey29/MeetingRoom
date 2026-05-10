import { useState } from 'react';
import {
  FaCalendarAlt, FaClock, FaTimesCircle,
  FaDoorOpen, FaLock, FaThList, FaTh, FaEdit,
} from 'react-icons/fa';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import BookingModal from '../components/BookingModal';

function MyBookingsPage() {
  const { bookings, cancelBooking } = useRooms();
  const { user } = useAuth();

  const [message, setMessage] = useState({ text: '', type: '' });
  const [viewMode, setViewMode] = useState('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [hoveredBookingId, setHoveredBookingId] = useState(null);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
const [bookingModalDate, setBookingModalDate] = useState(null);
const [bookingModalPrefilled, setBookingModalPrefilled] = useState(null);

  const myBookings = bookings.filter(
    (booking) => booking.userEmail === user?.email
  );

  const isCancelDisabled = (booking) => {
    const today = new Date().toISOString().split('T')[0];
    if (booking.date !== today) return false;
    const startTimeStr = booking.slot.split(' - ')[0].trim();
    const timeParts = startTimeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!timeParts) return false;
    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3];
    if (period) {
      if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    const slotStartTime = new Date();
    slotStartTime.setHours(hours, minutes, 0, 0);
    const cutoffTime = new Date(slotStartTime.getTime() - 60 * 60 * 1000);
    return new Date() >= cutoffTime;
  };

  const isPastBooking = (booking) => {
    const today = new Date().toISOString().split('T')[0];
    return booking.date < today;
  };

  const formatDisplayDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedBookingId(null);
  };

  const handleReschedule = (booking) => {
  setBookingModalDate(new Date(booking.date + 'T00:00:00'));
  setBookingModalPrefilled(booking);
  setBookingModalOpen(true);
};

  return (
    <section className="min-h-screen px-4 md:px-6 py-8">
      <div className="max-w-5xl mx-auto">

        <ConfirmModal
          isOpen={modalOpen}
          title="Cancel Booking"
          message="Are you sure you want to cancel this booking? This action cannot be undone."
          onConfirm={handleConfirmCancel}
          onCancel={handleModalClose}
        />

        <BookingModal
  isOpen={bookingModalOpen}
  onClose={() => {
    setBookingModalOpen(false);
    setBookingModalPrefilled(null);
  }}
  selectedDate={bookingModalDate}
  prefilledBooking={bookingModalPrefilled}
  mode="reschedule"
/>

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-600 mb-1">My Bookings</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            My Bookings
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            View and manage all your room bookings.
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm border
            ${message.type === 'success'
              ? 'bg-green-50 border-green-100 text-green-700'
              : 'bg-red-50 border-red-100 text-red-600'
            }`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500 mb-1">Total Bookings</p>
            <p className="text-3xl font-semibold text-slate-900">
              {myBookings.length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500 mb-1">Booked By</p>
            <p className="text-lg font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        {/* Bookings section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6">

          {/* Header + Toggle */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Your Bookings</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Showing {myBookings.length} of {myBookings.length} bookings
              </p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <FaThList size={11} /> List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <FaTh size={11} /> Grid
              </button>
            </div>
          </div>

          {myBookings.length > 0 ? (
            viewMode === 'list' ? (

              /* ── TABLE LIST VIEW ── */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide pb-3 pr-6">
                        Date
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide pb-3 pr-6">
                        Time
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide pb-3 pr-6">
                        Room
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide pb-3 pr-6">
                        Status
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide pb-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myBookings.map((booking) => {
                      const cancelDisabled = isCancelDisabled(booking);
                      const isPast = isPastBooking(booking);
                      return (
                        <tr
                          key={booking.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Date */}
                          <td className="py-4 pr-6">
                            <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                              {formatDisplayDate(booking.date)}
                            </p>
                          </td>

                          {/* Time */}
                          <td className="py-4 pr-6">
                            <p className="text-sm text-slate-600 whitespace-nowrap">
                              {booking.slot}
                            </p>
                          </td>

                          {/* Room */}
                          <td className="py-4 pr-6">
                            <div className="flex items-center gap-2">
                              <FaDoorOpen size={13} className="text-blue-500 flex-shrink-0" />
                              <p className="text-sm font-medium text-slate-800">
                                {booking.roomName}
                              </p>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 pr-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium
                              ${isPast
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-blue-50 text-blue-700'
                              }`}>
                              {isPast ? 'Completed' : 'Booked'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4">
                            {!isPast ? (
                              <div className="flex items-center gap-2">

                                {/* Reschedule button */}
                                <button
                                onClick={() => handleReschedule(booking)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                                >
                                  <FaEdit size={11} />
                                  Reschedule
                                </button>

                                {/* Cancel button */}
                                <div
                                  className="relative"
                                  onMouseEnter={() => cancelDisabled && setHoveredBookingId(booking.id)}
                                  onMouseLeave={() => setHoveredBookingId(null)}
                                >
                                  <button
                                    onClick={() => !cancelDisabled && handleCancelClick(booking.id)}
                                    disabled={cancelDisabled}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap
                                      ${cancelDisabled
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer'
                                      }`}
                                  >
                                    {cancelDisabled
                                      ? <FaLock size={11} />
                                      : <FaTimesCircle size={11} />
                                    }
                                    Cancel
                                  </button>

                                  {/* Tooltip */}
                                  {hoveredBookingId === booking.id && cancelDisabled && (
                                    <div className="absolute bottom-full right-0 mb-2 w-48 z-10">
                                      <div className="bg-slate-800 text-white text-xs rounded-xl px-3 py-2 text-center leading-relaxed">
                                        You can't cancel now. Closes 1 hour before slot.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                      </div>
                                    </div>
                                  )}
                                </div>

                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            ) : (

              /* ── GRID VIEW ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myBookings.map((booking) => {
                  const cancelDisabled = isCancelDisabled(booking);
                  const isPast = isPastBooking(booking);
                  return (
                    <div
                      key={booking.id}
                      className="border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow"
                    >
                      <div className="space-y-3">

                        {/* Room name + status badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FaDoorOpen className="text-blue-500 flex-shrink-0" size={14} />
                            <h3 className="font-semibold text-slate-900 text-sm">
                              {booking.roomName}
                            </h3>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium flex-shrink-0
                            ${isPast
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-blue-50 text-blue-700'
                            }`}>
                            {isPast ? 'Completed' : 'Booked'}
                          </span>
                        </div>

                        {/* Date and time */}
                        <div className="flex flex-col gap-1.5">
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <FaCalendarAlt size={10} className="text-blue-500" />
                            {formatDisplayDate(booking.date)}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <FaClock size={10} className="text-blue-500" />
                            {booking.slot}
                          </span>
                        </div>

                        {/* Cancel warning */}
                        {cancelDisabled && !isPast && (
                          <div className="flex items-center gap-1 text-xs text-orange-500">
                            <FaLock size={10} />
                            <span>Cannot cancel now</span>
                          </div>
                        )}

                        {/* Action buttons */}
                        {!isPast && (
                          <div className="flex gap-2 pt-1">
                            <button
                            onClick={() => handleReschedule(booking)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                            >
                              <FaEdit size={11} />
                              Reschedule
                            </button>

                            <div
                              className="relative flex-1"
                              onMouseEnter={() => cancelDisabled && setHoveredBookingId(booking.id)}
                              onMouseLeave={() => setHoveredBookingId(null)}
                            >
                              <button
                                onClick={() => !cancelDisabled && handleCancelClick(booking.id)}
                                disabled={cancelDisabled}
                                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors
                                  ${cancelDisabled
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer'
                                  }`}
                              >
                                {cancelDisabled
                                  ? <FaLock size={11} />
                                  : <FaTimesCircle size={11} />
                                }
                                Cancel
                              </button>

                              {/* Tooltip */}
                              {hoveredBookingId === booking.id && cancelDisabled && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 z-10">
                                  <div className="bg-slate-800 text-white text-xs rounded-xl px-3 py-2 text-center leading-relaxed">
                                    You can't cancel now. Closes 1 hour before slot.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-center py-10">
              <FaCalendarAlt size={36} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                No bookings yet
              </h3>
              <p className="text-slate-500 text-sm">
                Go to Rooms page and click Book Now to make your first booking.
              </p>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}

export default MyBookingsPage;