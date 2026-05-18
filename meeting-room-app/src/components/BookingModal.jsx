import { useState, useEffect } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import {
  FaTimes, FaClock, FaCalendarAlt, FaCheckCircle, FaBell,
} from 'react-icons/fa';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import TimePickerWheel from './TimePickerWheel';

function BookingModal({ isOpen, onClose, selectedDate, prefilledBooking, mode, roomId }) {
  const {
    rooms,
    bookSlot,
    rescheduleBooking,
    getBookingsByRoomAndDate,
    addAdminRequest,
  } = useRooms();
  const { user } = useAuth();

 const [selectedRoom, setSelectedRoom] = useState('');

// Add this useEffect to set room when prefilledBooking changes
useEffect(() => {
  if (roomId) {
    setSelectedRoom(String(roomId));
  } else if (prefilledBooking?.roomId) {
    setSelectedRoom(String(prefilledBooking.roomId));
  }
}, [roomId, prefilledBooking]);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [adminRequestSent, setAdminRequestSent] = useState(false);

useEffect(() => {
  if (isOpen) {
    setStartTime(null);
    setEndTime(null);
    setMessage({ text: '', type: '' });
    setAdminRequestSent(false);
    if (roomId) {
      setSelectedRoom(String(roomId));
    } else if (prefilledBooking?.roomId) {
      setSelectedRoom(String(prefilledBooking.roomId));
    }
  }
}, [isOpen, roomId, prefilledBooking]);

  if (!isOpen) return null;

  const activeRooms = rooms.filter((r) => r.isActive && r.status === 'available');

  // ─── Helper functions ─────────────────────────────
  const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
};

const formatTime24 = (time) => time || '';

  const dateStr = selectedDate
    ? selectedDate instanceof Date
      ? formatDate(selectedDate)
      : selectedDate
    : '';

  // ─── Conflict check ───────────────────────────────
  const hasTimeConflict = (start, end) => {
    if (!selectedRoom || !dateStr) return false;
    const existing = getBookingsByRoomAndDate(selectedRoom, dateStr);
    return existing.some((booking) => {
      if (prefilledBooking && booking.id === prefilledBooking.id) return false;
      const bStart = new Date(`${dateStr} ${booking.startTime}`);
      const bEnd = new Date(`${dateStr} ${booking.endTime}`);
      const nStart = new Date(`${dateStr} ${formatTime24(start)}`);
      const nEnd = new Date(`${dateStr} ${formatTime24(end)}`);
      return nStart < bEnd && nEnd > bStart;
    });
  };

  // ─── Book / Reschedule ────────────────────────────
  const handleSubmit = async () => {
    if (!selectedRoom) {
      setMessage({ text: 'Please select a room.', type: 'error' });
      return;
    }
    if (!startTime) {
      setMessage({ text: 'Please select start time.', type: 'error' });
      return;
    }
    if (!endTime) {
      setMessage({ text: 'Please select end time.', type: 'error' });
      return;
    }
    if (endTime <= startTime) {
      setMessage({ text: 'End time must be after start time.', type: 'error' });
      return;
    }

    // Prevent past time booking for today
const now = new Date();
const todayStr = (() => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
})();

if (dateStr === todayStr && startTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const startDateTime = new Date();
  startDateTime.setHours(startHour, startMin, 0, 0);

  if (startDateTime <= now) {
    setMessage({
      text: 'Cannot reschedule to a past time. Please select a future time.',
      type: 'error',
    });
    return;
  }
}
    // const diffMins = (endTime - startTime) / 60000;
    // if (diffMins < 30) {
    //   setMessage({ text: 'Minimum booking is 30 minutes.', type: 'error' });
    //   return;
    // }
    if (hasTimeConflict(startTime, endTime)) {
      setMessage({ text: 'This time conflicts with an existing booking.', type: 'error' });
      return;
    }

    setLoading(true);
    const slot = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    const roomObj = rooms.find((r) => String(r.id) === String(selectedRoom));

    if (mode === 'reschedule' && prefilledBooking) {
      const result = await rescheduleBooking({
        bookingId: prefilledBooking.id,
        newDate: dateStr,
        newSlot: slot,
        newStartTime: formatTime24(startTime),
        newEndTime: formatTime24(endTime),
      });
      setLoading(false);
      if (result.success) {
        setMessage({ text: 'Booking rescheduled!', type: 'success' });
        setTimeout(() => {
          setStartTime(null);
          setEndTime(null);
          setMessage({ text: '', type: '' });
          onClose();
        }, 1000);
      } else {
        setMessage({ text: result.message, type: 'error' });
      }
    } else {
      const result = await bookSlot({
        roomId: selectedRoom,
        roomName: roomObj?.name || '',
        date: dateStr,
        slot,
        startTime: formatTime24(startTime),
        endTime: formatTime24(endTime),
        bookedBy: user?.name || 'Unknown',
        userEmail: user?.email || '',
      });
      setLoading(false);
      if (result.success) {
        setMessage({ text: 'Room booked successfully!', type: 'success' });
        setTimeout(() => {
          setStartTime(null);
          setEndTime(null);
          setMessage({ text: '', type: '' });
          onClose();
        }, 1000);
      } else {
        setMessage({ text: result.message, type: 'error' });
      }
    }
  };

  // ─── Admin Request ────────────────────────────────
  const handleAdminRequest = async () => {
    if (!selectedRoom) {
      setMessage({ text: 'Please select a room first.', type: 'error' });
      return;
    }
    if (!startTime || !endTime) {
      setMessage({ text: 'Please select start and end time first.', type: 'error' });
      return;
    }

    const slot = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    const roomObj = rooms.find((r) => String(r.id) === String(selectedRoom));

    const result = await addAdminRequest({
      roomId: selectedRoom,
      roomName: roomObj?.name || '',
      date: dateStr,
      slot,
      startTime: formatTime24(startTime),
      endTime: formatTime24(endTime),
      requestedBy: user?.name || 'Unknown',
      userEmail: user?.email || '',
    });

    if (result.success) {
      setAdminRequestSent(true);
      setMessage({ text: '', type: '' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 z-10">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <FaTimes size={14} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FaCalendarAlt size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {mode === 'reschedule' ? 'Reschedule Booking' : 'Book a Room'}
            </h3>
            <p className="text-xs text-slate-500">{dateStr}</p>
          </div>
        </div>

        {/* Room selector — only for new booking without roomId */}
        {mode !== 'reschedule' && !roomId && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Select Room
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => {
                setSelectedRoom(e.target.value);
                setMessage({ text: '', type: '' });
              }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a room</option>
              {activeRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} — {room.capacity} people
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Time Pickers */}
<div className="grid grid-cols-2 gap-3 mb-4">
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
      <FaClock size={11} className="text-blue-500" />
      Start Time
    </label>
    <TimePickerWheel
      value={startTime}
      onChange={(time) => {
        setStartTime(time);
        setEndTime('');
        setMessage({ text: '', type: '' });
        setAdminRequestSent(false);
      }}
      disabled={false}
      label="Select start time"
    />
  </div>
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
      <FaClock size={11} className="text-blue-500" />
      End Time
    </label>
    <TimePickerWheel
      value={endTime}
      onChange={(time) => {
        setEndTime(time);
        setMessage({ text: '', type: '' });
        setAdminRequestSent(false);
      }}
      disabled={!startTime}
      label="Select end time"
    />
  </div>
</div>

        {/* Duration */}
        {startTime && endTime && (
  <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center justify-between">
    <span className="text-xs text-blue-600">Duration</span>
    <span className="text-sm font-semibold text-blue-800">
      {(() => {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        return diff > 0 ? `${diff} minutes` : 'Invalid time';
      })()}
    </span>
  </div>
)}

        {/* Admin Request Success */}
        {adminRequestSent && (
          <div className="mb-4 px-3 py-2.5 rounded-xl text-sm border bg-green-50 border-green-100">
            <div className="flex items-center gap-2">
              <FaCheckCircle size={12} className="text-green-500" />
              <p className="text-green-700">
                Request sent to admin. Booking will appear after approval.
              </p>
            </div>
          </div>
        )}

        {/* Message */}
        {message.text && (
          <div className={`mb-4 px-3 py-2.5 rounded-xl text-sm border
            ${message.type === 'success'
              ? 'bg-green-50 border-green-100 text-green-700'
              : 'bg-red-50 border-red-100 text-red-600'
            }`}>
            {message.type === 'success' && (
              <FaCheckCircle className="inline mr-1.5" size={12} />
            )}
            {message.text}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2">

          {/* Close + Book/Reschedule */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || adminRequestSent}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading
                ? 'Saving...'
                : mode === 'reschedule'
                ? 'Reschedule'
                : 'Book Room'
              }
            </button>
          </div>

          {/* Request Admin Booking — only for new booking */}
          {mode !== 'reschedule' && (
            <button
              onClick={handleAdminRequest}
              disabled={adminRequestSent || !startTime || !endTime}
              className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium border rounded-xl transition-colors
                ${adminRequestSent || !startTime || !endTime
                  ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-gray-50'
                }`}
            >
              <FaBell size={13} />
              {adminRequestSent ? 'Request Sent ✓' : 'Request Admin Booking'}
            </button>
          )}

        </div>

      </div>
    </div>
  );
}

export default BookingModal;
