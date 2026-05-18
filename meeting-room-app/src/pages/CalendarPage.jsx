import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FaEdit, FaTrash, FaTimes, FaCalendarAlt
} from 'react-icons/fa';

function CalendarPage() {
  const { bookings, cancelBooking, rooms } = useRooms();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // convert bookings to FullCalendar events
  const events = bookings.map((booking) => {
    const isOwner = booking.userEmail === user?.email;

    // parse date and times
    const dateStr = booking.date;
    const startStr = booking.startTime
      ? `${dateStr}T${booking.startTime}`
      : `${dateStr}T${booking.slot.split(' - ')[0].trim()}`;
    const endStr = booking.endTime
      ? `${dateStr}T${booking.endTime}`
      : `${dateStr}T${booking.slot.split(' - ')[1].trim()}`;

    return {
      id: String(booking.id),
      title: `${booking.roomName} — ${booking.bookedBy}`,
      start: startStr,
      end: endStr,
      backgroundColor: isOwner ? '#2563eb' : '#94a3b8',
      borderColor: isOwner ? '#1d4ed8' : '#64748b',
      textColor: '#ffffff',
      extendedProps: {
        booking,
        isOwner,
      },
    };
  });

  // handle clicking on existing event
  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setShowModal(true);
  };

  // handle clicking on empty date — go to booking page
  const handleDateClick = (info) => {
    // find first available room and navigate to booking
    const firstRoom = rooms.find((r) => r.isActive && r.status === 'available');
    if (firstRoom) {
      navigate(`/book/${firstRoom.id}`);
    }
  };

  // cancel booking
  const handleCancel = async () => {
    const booking = selectedEvent.extendedProps.booking;
    if (!selectedEvent.extendedProps.isOwner) {
      setMessage({ text: 'You can only cancel your own bookings.', type: 'error' });
      return;
    }
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      const result = await cancelBooking(booking.id);
      setShowModal(false);
      setSelectedEvent(null);
      setMessage({
        text: result.message || 'Booking cancelled successfully.',
        type: result.success ? 'success' : 'error',
      });
    }
  };

  // reschedule — navigate to booking page
  const handleReschedule = () => {
    const booking = selectedEvent.extendedProps.booking;
    if (!selectedEvent.extendedProps.isOwner) {
      setMessage({ text: 'You can only reschedule your own bookings.', type: 'error' });
      return;
    }
    setShowModal(false);
    navigate(`/book/${booking.roomId}`);
  };

  return (
    <section className="min-h-screen px-4 md:px-6 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-600 mb-1">
            Calendar View
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Meeting Calendar
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            View all bookings. Click on a date to book a room. Click on a booking to manage it.
          </p>
        </div>

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

        {/* Legend */}
        <div className="flex items-center gap-6 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-xs text-slate-500">Your bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
            <span className="text-xs text-slate-500">Others bookings</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            editable={false}
            selectable={true}
            height="auto"
            buttonText={{
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day',
            }}
            eventDisplay="block"
            dayMaxEvents={3}
            moreLinkText="more"
          />
        </div>

        {/* Event Detail Modal */}
        {showModal && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black bg-opacity-40"
              onClick={() => setShowModal(false)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 z-10">

              {/* Close button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <FaTimes size={14} />
              </button>

              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
                <FaCalendarAlt size={18} className="text-blue-600" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-900 text-center mb-4">
                Booking Details
              </h3>

              {/* Details */}
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
                  <span className={`font-medium text-sm px-2 py-0.5 rounded-full
                    ${selectedEvent.extendedProps.isOwner
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                    {selectedEvent.extendedProps.isOwner ? 'Your booking' : 'Others booking'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedEvent.extendedProps.isOwner ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleReschedule}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <FaEdit size={12} />
                    Reschedule
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <FaTrash size={12} />
                    Cancel
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

      </div>
    </section>
  );
}

export default CalendarPage;
