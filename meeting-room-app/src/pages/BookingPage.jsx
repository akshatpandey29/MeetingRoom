import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  FaUsers, FaMapMarkerAlt, FaCheckCircle,
  FaTimesCircle, FaArrowLeft, FaClock,
  FaCalendarAlt, FaEdit, FaTrash, FaBell, FaLock,
} from 'react-icons/fa';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import BookingModal from '../components/BookingModal';
import ConfirmModal from '../components/ConfirmModal';
import TimePickerWheel from '../components/TimePickerWheel';

function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getRoomById,
    getBookingsByRoom,
    getBookingsByRoomAndDate,
    bookSlot,
    cancelBooking,
    addAdminRequest,
  } = useRooms();

  const selectedRoom = getRoomById(id);

  // ─── All states at top ───────────────────────────────
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingModalDate, setBookingModalDate] = useState(null);
  const [bookingModalMode, setBookingModalMode] = useState('book');
  const [bookingModalPrefilled, setBookingModalPrefilled] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [conflictDetails, setConflictDetails] = useState(null);
  const [adminRequestSent, setAdminRequestSent] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
const [cancelBookingId, setCancelBookingId] = useState(null);

//const [adminRequestSent, setAdminRequestSent] = useState(false);

// ─── Cancel restriction check ────────────────────────
const isCancelDisabled = (booking) => {
  const today = new Date().toISOString().split('T')[0];
  if (booking.date !== today) return false;
  const startTimeStr = booking.startTime;
  if (!startTimeStr) return false;
  const [hours, minutes] = startTimeStr.split(':').map(Number);
  const slotStartTime = new Date();
  slotStartTime.setHours(hours, minutes, 0, 0);
  const cutoffTime = new Date(slotStartTime.getTime() - 60 * 60 * 1000);
  return new Date() >= cutoffTime;
};

  // ─── Room not found ──────────────────────────────────
  if (!selectedRoom) {
    return (
      <section className="min-h-screen px-6 py-8">
        <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <FaTimesCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Room Not Found
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            This room does not exist or has been removed.
          </p>
          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            <FaArrowLeft size={13} /> Back to Rooms
          </Link>
        </div>
      </section>
    );
  }

  // ─── Helper functions ────────────────────────────────
  const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // convert "HH:MM" to "hh:MM AM/PM"
const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${String(displayH).padStart(2, '0')}:${m === 0 ? '00' : String(m).padStart(2, '0')} ${period}`;
};

const formatTime24 = (time) => time || '';

  // ─── Booking data ────────────────────────────────────
  const bookedSlotsForDate = selectedDate
    ? getBookingsByRoomAndDate(selectedRoom.id, formatDate(selectedDate))
    : [];

  const allRoomBookings = getBookingsByRoom(selectedRoom.id);

  // calendar events
  const calendarEvents = allRoomBookings.map((booking) => {
    const isOwner = booking.userEmail === user?.email;
    const dateStr = booking.date;
    const startStr = booking.startTime
      ? `${dateStr}T${booking.startTime}`
      : dateStr;
    const endStr = booking.endTime
      ? `${dateStr}T${booking.endTime}`
      : dateStr;
    return {
      id: String(booking.id),
      title: booking.slot,
      start: startStr,
      end: endStr,
      backgroundColor: isOwner ? '#2563eb' : '#94a3b8',
      borderColor: isOwner ? '#1d4ed8' : '#64748b',
      textColor: '#ffffff',
      extendedProps: { booking, isOwner },
    };
  });

  // ─── Conflict check ──────────────────────────────────
  const hasTimeConflict = (date, start, end) => {
  const dateStr = formatDate(date);
  const existing = getBookingsByRoomAndDate(selectedRoom.id, dateStr);
  return existing.some((booking) => {
    const bStart = new Date(`${dateStr} ${booking.startTime}`);
    const bEnd = new Date(`${dateStr} ${booking.endTime}`);
    const nStart = new Date(`${dateStr} ${start}`);
    const nEnd = new Date(`${dateStr} ${end}`);
    return nStart < bEnd && nEnd > bStart;
  });
};

  // ─── Book slot ───────────────────────────────────────
  const handleBookSlot = () => {
    if (!selectedDate) {
      setMessage({ text: 'Please select a date.', type: 'error' });
      return;
    }
    if (!startTime) {
      setMessage({ text: 'Please select a start time.', type: 'error' });
      return;
    }
    if (!endTime) {
      setMessage({ text: 'Please select an end time.', type: 'error' });
      return;
    }



    // Check if selected date is today and time is in the past
const now = new Date();
const selectedDateStr = formatDate(selectedDate);
const todayStr = formatDate(now);

if (selectedDateStr === todayStr) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const startDateTime = new Date();
  startDateTime.setHours(startHour, startMin, 0, 0);

  if (startDateTime <= now) {
    setMessage({
      text: 'Cannot book a meeting in the past. Please select a future time.',
      type: 'error'
    });
    return;
  }
}

    if (endTime <= startTime || !endTime || !startTime) {
  setMessage({ text: 'End time must be after start time.', type: 'error' });
  return;
}

    if (hasTimeConflict(selectedDate, startTime, endTime)) {
      const dateStr = formatDate(selectedDate);
      const existing = getBookingsByRoomAndDate(selectedRoom.id, dateStr);
      const conflicting = existing.find((booking) => {
        const bStart = new Date(`${dateStr} ${booking.startTime}`);
        const bEnd = new Date(`${dateStr} ${booking.endTime}`);
       const nStart = new Date(`${dateStr} ${startTime}`);
const nEnd = new Date(`${dateStr} ${endTime}`);
        return nStart < bEnd && nEnd > bStart;
      });
      setConflict(true);
      setConflictDetails({
        roomName: selectedRoom.name,
        date: new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        }),
        slot: conflicting?.slot || `${formatTime(startTime)} - ${formatTime(endTime)}`,
      });
      return;
    }

    setConflict(false);
    setConflictDetails(null);
    setAdminRequestSent(false);
    setLoading(true);

    const slot = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    const result = bookSlot({
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      date: formatDate(selectedDate),
      slot,
      startTime: startTime,
      endTime: endTime,
      bookedBy: user?.name || 'Unknown',
      userEmail: user?.email || '',
    });

    setLoading(false);

    if (result.success) {
      setMessage({ text: 'Room booked successfully!', type: 'success' });
      setStartTime(null);
      setEndTime(null);
      setConflict(false);
    } else {
      setMessage({ text: result.message, type: 'error' });
    }
  };

  // ─── Admin request ───────────────────────────────────
  const handleAdminRequest = () => {
    if (!selectedDate || !startTime || !endTime) {
      setMessage({ text: 'Please select date and time first.', type: 'error' });
      return;
    }
    const slot = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    const result = addAdminRequest({
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      date: formatDate(selectedDate),
      slot,
      startTime: formatTime24(startTime),
      endTime: formatTime24(endTime),
      requestedBy: user?.name || 'Unknown',
      userEmail: user?.email || '',
    });
    if (result.success) {
      setAdminRequestSent(true);
      setConflict(false);
      setMessage({ text: '', type: '' });
    }
  };

  // ───  booking ──────────────────────────────────
//   const handleCancelBooking = (bookingId) => {
//   setCancelBookingId(bookingId);
//   setShowCancelModal(true);
// };

// const handleConfirmCancelBooking = () => {
//   cancelBooking(cancelBookingId);
//   setShowCancelModal(false);
//   setCancelBookingId(null);
//   setMessage({ text: 'Booking cancelled.', type: 'success' });
// };

// const handleCloseCancelModal = () => {
//   setShowCancelModal(false);
//   setCancelBookingId(null);
// };

  // ─── Calendar handlers ───────────────────────────────
  const handleCalendarDateClick = (info) => {
    setBookingModalDate(info.date);
    setBookingModalMode('book');
    setBookingModalPrefilled(null);
    setBookingModalOpen(true);
  };

  const handleCalendarEventClick = (info) => {
    setSelectedEvent(info.event);
    setShowEventPopup(true);
  };

  const handleRescheduleFromPopup = () => {
    const booking = selectedEvent.extendedProps.booking;
    setShowEventPopup(false);
    setBookingModalDate(new Date(booking.date));
    setBookingModalMode('reschedule');
    setBookingModalPrefilled(booking);
    setBookingModalOpen(true);
  };


    const handleCancelFromPopup = () => {
  if (!selectedEvent.extendedProps.isOwner) {
    setMessage({ text: 'You can only cancel your own bookings.', type: 'error' });
    setShowEventPopup(false);
    return;
  }
  const booking = selectedEvent.extendedProps.booking;
  // close popup first
  setShowEventPopup(false);

  // open confirm modal
  setCancelBookingId(booking.id);
  setShowCancelModal(true);
};
 



const handleCancelBooking = (bookingId) => {
  const booking = bookedSlotsForDate.find((b) => b.id === bookingId);
  if (booking && isCancelDisabled(booking)) {
    setMessage({
      text: 'Cannot cancel — less than 1 hour before slot.',
      type: 'error'
    });
    return;
  }
  setCancelBookingId(bookingId);
  setShowCancelModal(true);
};
  
const handleConfirmCancelBooking = () => {
  cancelBooking(cancelBookingId);
  setShowCancelModal(false);
  setCancelBookingId(null);
  setMessage({ text: 'Booking cancelled successfully.', type: 'success' });
};

const handleCloseCancelModal = () => {
  setShowCancelModal(false);
  setCancelBookingId(null);
};

  // ─── Calendar view dropdown ──────────────────────────
  const views = [
    { label: 'Month', value: 'dayGridMonth' },
    { label: 'Week', value: 'timeGridWeek' },
    { label: 'Day', value: 'timeGridDay' },
  ];

  const handleViewChange = (viewValue) => {
    setCurrentView(viewValue);
    setDropdownOpen(false);
  };

  const getCurrentViewLabel = () => {
    return views.find((v) => v.value === currentView)?.label || 'Month';
  };

  // ─── Return ──────────────────────────────────────────
  return (
    <section className="min-h-screen px-4 md:px-6 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Booking Modal */}
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          selectedDate={bookingModalDate}
          prefilledBooking={bookingModalPrefilled}
          mode={bookingModalMode}
          roomId={id}
        />

        {/* Cancel Confirm Modal */}
<ConfirmModal
  isOpen={showCancelModal}
  title="Cancel Booking"
  message="Are you sure you want to cancel this booking? This action cannot be undone."
  onConfirm={handleConfirmCancelBooking}
  onCancel={handleCloseCancelModal}
/>

        {/* Event Detail Popup */}
        {showEventPopup && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black bg-opacity-40"
              onClick={() => setShowEventPopup(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 z-10">
              <button
                onClick={() => setShowEventPopup(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <FaTimesCircle size={14} />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaCalendarAlt size={16} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Booking Details
                </h3>
              </div>
              <div className="space-y-2 mb-5 bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Room</span>
                  <span className="font-medium text-slate-800">
                    {selectedEvent.extendedProps.booking.roomName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-800">
                    {selectedEvent.extendedProps.booking.date}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Time</span>
                  <span className="font-medium text-slate-800">
                    {selectedEvent.extendedProps.booking.slot}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Booked by</span>
                  <span className="font-medium text-slate-800">
                    {selectedEvent.extendedProps.booking.bookedBy}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ownership</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                    ${selectedEvent.extendedProps.isOwner
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                    {selectedEvent.extendedProps.isOwner
                      ? 'Your booking'
                      : 'Others booking'}
                  </span>
                </div>
              </div>
              {selectedEvent.extendedProps.isOwner ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleRescheduleFromPopup}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"
                  >
                    <FaEdit size={12} /> Reschedule
                  </button>
                  <button
                    onClick={handleCancelFromPopup}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                  >
                    <FaTrash size={12} /> Cancel
                  </button>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-center">
                  <p className="text-sm text-orange-600 font-medium">
                    You cannot modify others bookings
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/rooms')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
          >
            <FaArrowLeft size={12} /> Back to Rooms
          </button>
          <p className="text-sm font-medium text-blue-600 mb-1">Booking Page</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Book {selectedRoom.name}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Select a date and your preferred time to book this room.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Left — Room Details */}
          <div className="lg:col-span-1 space-y-5">

            {/* Room Info */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Room Details
              </h2>
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FaMapMarkerAlt className="text-blue-500" size={13} />
                  <span>{selectedRoom.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FaUsers className="text-blue-500" size={13} />
                  <span>Capacity: {selectedRoom.capacity} people</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {selectedRoom.status === 'available' ? (
                    <>
                      <FaCheckCircle className="text-green-500" size={13} />
                      <span className="text-green-600">Available for booking</span>
                    </>
                  ) : (
                    <>
                      <FaTimesCircle className="text-red-500" size={13} />
                      <span className="text-red-600">Currently unavailable</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                {selectedRoom.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedRoom.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            {/* All Bookings */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                All Bookings
              </h2>
              {allRoomBookings.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {allRoomBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5"
                    >
                      <p className="text-xs font-medium text-slate-800">
                        {booking.slot}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {booking.date}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        By: {booking.bookedBy}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No bookings yet for this room.
                </p>
              )}
            </div>

          </div>

          {/* Right — Booking Section */}
          <div className="lg:col-span-2 space-y-6">

            {/* Date + Time + Buttons Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-5">
                Select Date and Time
              </h2>

              {/* Calendar + Time side by side */}
              <div className="flex flex-col md:flex-row items-start gap-6 mb-6">

                {/* Inline Calendar */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Select Date
                  </label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setStartTime(null);
                      setEndTime(null);
                      setMessage({ text: '', type: '' });
                      setConflict(false);
                    }}
                    minDate={new Date()}
                    inline
                  />
                </div>

                {/* Time Pickers */}
                <div className="flex flex-col gap-4 w-full md:w-52 md:pt-8">

                {/* Start Time */}
<div className="flex flex-col gap-1.5">
  <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
    <FaClock size={12} className="text-blue-500" />
    Start Time
  </label>
  <TimePickerWheel
    value={startTime}
    onChange={(time) => {
      setStartTime(time);
      setEndTime('');
      setMessage({ text: '', type: '' });
      setConflict(false);
    }}
    disabled={!selectedDate}
    label="Select start time"
  />
  {!selectedDate && (
    <p className="text-xs text-slate-400">Select a date first</p>
  )}
</div>

{/* End Time */}
<div className="flex flex-col gap-1.5">
  <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
    <FaClock size={12} className="text-blue-500" />
    End Time
  </label>
  <TimePickerWheel
    value={endTime}
    onChange={(time) => {
      setEndTime(time);
      setMessage({ text: '', type: '' });
      setConflict(false);
    }}
    disabled={!startTime}
    label="Select end time"
  />
  {!startTime && (
    <p className="text-xs text-slate-400">Select start time first</p>
  )}
</div>

                  {/* Duration */}
                  {startTime && endTime && (
  <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
    <p className="text-xs text-blue-600 font-medium">Duration</p>
    <p className="text-sm font-semibold text-blue-800 mt-0.5">
      {(() => {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        return diff > 0 ? diff + ' minutes' : 'Invalid time range';
      })()}
    </p>
  </div>
)}

                </div>
              </div>

              {/* Booking Summary */}
{selectedDate && startTime && endTime && !conflict && (
  <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
    <p className="text-sm font-medium text-blue-800 mb-2">
      Booking Summary
    </p>
    <div className="grid grid-cols-2 gap-1.5 text-sm text-blue-700">
      <p>Room: {selectedRoom.name}</p>
      <p>Date: {formatDate(selectedDate)}</p>
      <p>Start: {formatTime(startTime)}</p>
      <p>End: {formatTime(endTime)}</p>
      <p>Duration: {(() => {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        return (eh * 60 + em) - (sh * 60 + sm);
      })()} mins</p>
      <p>By: {user?.name}</p>
    </div>
  </div>
)}

              {/* Conflict Message */}
              {conflict && conflictDetails && (
                <div className="mb-5 px-4 py-3 rounded-xl text-sm border bg-red-50 border-red-200">
                  <div className="flex items-start gap-2">
                    <FaTimesCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-700">
                      <span className="font-medium">{conflictDetails.roomName}</span>{' '}
                      is already booked on{' '}
                      <span className="font-medium">{conflictDetails.date}</span>{' '}
                      from{' '}
                      <span className="font-medium">{conflictDetails.slot}</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Request Success */}
              {adminRequestSent && (
                <div className="mb-5 px-4 py-3 rounded-xl text-sm border bg-green-50 border-green-100">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle size={13} className="text-green-500" />
                    <p className="text-green-700">
                      Request sent to admin. Your booking will appear after approval.
                    </p>
                  </div>
                </div>
              )}

              {/* Message */}
              {message.text && (
                <div className={`mb-5 px-4 py-3 rounded-xl text-sm border
                  ${message.type === 'success'
                    ? 'bg-green-50 border-green-100 text-green-700'
                    : 'bg-red-50 border-red-100 text-red-600'
                  }`}>
                  {message.text}
                </div>
              )}

              {/* Book Meeting + Request Admin Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleBookSlot}
                  disabled={!selectedDate || !startTime || !endTime || loading}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-150
                    ${selectedDate && startTime && endTime && !loading
                      ? 'bg-slate-900 text-white hover:bg-slate-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <FaCalendarAlt size={13} />
                  {loading ? 'Booking...' : 'Book Meeting'}
                </button>

                <button
                  onClick={handleAdminRequest}
                  disabled={!selectedDate || !startTime || !endTime || adminRequestSent}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition-all duration-150
                    ${selectedDate && startTime && endTime && !adminRequestSent
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-gray-50'
                      : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <FaBell size={13} />
                  {adminRequestSent ? 'Request Sent' : 'Request Admin Booking'}
                </button>
              </div>

            </div>

            {/* Booked Slots for Selected Date */}
            {selectedDate && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Booked Slots for {formatDate(selectedDate)}
                </h2>
                {bookedSlotsForDate.length > 0 ? (
                  <div className="space-y-3">
                    {bookedSlotsForDate.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-red-700">
                            {booking.slot}
                          </p>
                          <p className="text-xs text-red-500 mt-0.5">
                            By: {booking.bookedBy}
                          </p>
                        </div>
                        {booking.userEmail === user?.email && (
  <button
    onClick={() => !isCancelDisabled(booking) && handleCancelBooking(booking.id)}
    disabled={isCancelDisabled(booking)}
    className={`flex items-center gap-1.5 text-xs font-medium transition-colors
      ${isCancelDisabled(booking)
        ? 'text-gray-400 cursor-not-allowed'
        : 'text-red-600 hover:text-red-800 cursor-pointer'
      }`}
  >
    {isCancelDisabled(booking)
      ? <FaLock size={11} />
      : <FaTimesCircle size={11} />
    }
    Cancel
  </button>
)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <FaCheckCircle size={13} />
                    All time slots are available for this date.
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Google Calendar */}
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-4 md:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Room Booking Calendar
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Click on any date to book directly. Click on a booking to manage it.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-xs text-slate-500">Your bookings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <span className="text-xs text-slate-500">Others bookings</span>
            </div>
          </div>

          {/* View Dropdown */}
          <div className="flex justify-end mb-3 relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <FaCalendarAlt size={12} className="text-blue-500" />
              {getCurrentViewLabel()}
              <svg
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {views.map((view) => (
                  <button
                    key={view.value}
                    onClick={() => handleViewChange(view.value)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors
                      ${currentView === view.value
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-600 hover:bg-gray-50'
                      }`}
                  >
                    {currentView === view.value && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                    )}
                    {currentView !== view.value && (
                      <span className="w-1.5 h-1.5 flex-shrink-0" />
                    )}
                    {view.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <FullCalendar
            key={currentView}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            events={calendarEvents}
            eventClick={handleCalendarEventClick}
            dateClick={handleCalendarDateClick}
            height="auto"
            buttonText={{ today: 'Today' }}
            dayMaxEvents={3}
            selectable={true}
          />
        </div>

      </div>
    </section>
  );
}

export default BookingPage;