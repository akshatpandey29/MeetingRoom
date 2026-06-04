import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  FaUsers, FaCheckCircle, FaTimesCircle,
  FaArrowLeft, FaClock, FaCalendarAlt,
  FaEdit, FaTrash, FaBell, FaMapMarkerAlt, FaPen,
  FaDoorOpen,
} from "react-icons/fa";
import { MdMeetingRoom } from "react-icons/md";
import { useRooms } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";
import BookingModal from "../components/BookingModal";
import ConfirmModal from "../components/ConfirmModal";

// ── helpers ───────────────────────────────────────────────────────────────────
function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const dh = h % 12 || 12;
  return `${String(dh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function getDuration(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 0) return null;
  if (diff < 60) return `${diff} min`;
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Time Selector ─────────────────────────────────────────────────────────────
function TimeSelector({ value, onChange, disabled, placeholder, startAfter }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const times = Array.from({ length: 96 }, (_, i) => {
  const totalMinutes = i * 15;
  const h = Math.floor(totalMinutes / 60);
  const m = String(totalMinutes % 60).padStart(2, '0');
  if (h > 23) return null;
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 || 12;
    const label = `${String(dh).padStart(2,'0')}:${m} ${period}`;
    const val = `${String(h).padStart(2,'0')}:${m}`;
    return { label, val };
  }).filter(Boolean).filter(t => !startAfter || t.val > startAfter);

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(prev => !prev)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : value
            ? 'bg-white text-slate-900 border-blue-400 hover:border-blue-500'
            : 'bg-white text-slate-400 border-gray-200 hover:border-blue-300'
        }`}
      >
        <span className="min-w-0 truncate">{value ? (times.find(t => t.val === value)?.label || formatTime(value)) : placeholder}</span>
        <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${disabled ? 'text-slate-300' : 'text-slate-400'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-[90] mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="overscroll-contain py-1" style={{ maxHeight: "min(22rem, calc(100vh - 12rem))", overflowY: "auto" }}>
            {times.map(({ label, val }) => (
              <button key={val} type="button"
                onMouseDown={(e) => { e.preventDefault(); onChange(val); setOpen(false); }}
                style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 14px', fontSize:13,
                  background: value === val ? '#0f172a' : 'transparent',
                  color: value === val ? '#fff' : '#334155',
                  fontWeight: value === val ? 500 : 400, border:'none', cursor:'pointer' }}
                onMouseEnter={e => { if (value !== val) { e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.color='#1d4ed8'; }}}
                onMouseLeave={e => { if (value !== val) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#334155'; }}}
              >{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const topRef = useRef(null);
  const {
    getRoomById, getBookingsByRoom, getBookingsByRoomAndDate,
    fetchBookingsByRoomAndDate, bookSlot, cancelBooking, addAdminRequest, bookings,
  } = useRooms();

  const selectedRoom = getRoomById(id);
  const [selectedDate, setSelectedDate] = useState(location.state?.selectedDate || getTodayStr());
  const [startTime, setStartTime] = useState(location.state?.startTime || "");
  const [endTime, setEndTime] = useState(location.state?.endTime || "");
  const [purpose, setPurpose] = useState("");
  const [editing, setEditing] = useState(!location.state?.startTime);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [adminRequestSent, setAdminRequestSent] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [conflictDetails, setConflictDetails] = useState(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingModalDate, setBookingModalDate] = useState(null);
  const [bookingModalMode, setBookingModalMode] = useState("book");
  const [bookingModalPrefilled, setBookingModalPrefilled] = useState(null);

  useEffect(() => {
    if (selectedRoom?.id && selectedDate) fetchBookingsByRoomAndDate(selectedRoom.id, selectedDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom?.id, selectedDate]);

  useEffect(() => {
    if (!location.state?.openBookingForm) return;
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }, [location.state?.openBookingForm]);

  if (!selectedRoom) {
    return (
      <section className="min-h-screen px-4 py-8 bg-slate-50">
        <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaTimesCircle size={24} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Room Not Found</h1>
          <p className="text-slate-500 text-sm mb-6">This room does not exist or has been removed.</p>
          <Link to="/rooms" className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
            <FaArrowLeft size={12} /> Back to Rooms
          </Link>
        </div>
      </section>
    );
  }

  const allRoomBookings = getBookingsByRoom(selectedRoom.id).filter(b => b.status !== 'completed' && b.status !== 'cancelled');
  const duration = getDuration(startTime, endTime);
  const canBook = selectedDate && startTime && endTime && !editing;

  const calendarEvents = allRoomBookings.map((booking) => {
    const isOwner = booking.userEmail === user?.email;
    return {
      id: String(booking.id),
      title: isOwner ? `You: ${booking.slot}` : booking.slot,
      start: booking.startTime ? `${booking.date}T${booking.startTime}` : booking.date,
      end: booking.endTime ? `${booking.date}T${booking.endTime}` : booking.date,
      backgroundColor: isOwner ? "#0f172a" : "#94a3b8",
      borderColor: isOwner ? "#1e293b" : "#64748b",
      textColor: "#ffffff",
      extendedProps: { booking, isOwner },
    };
  });

  function hasConflict(date, start, end) {
    const roomConflict = getBookingsByRoomAndDate(selectedRoom.id, date).some((b) => {
      const bS = new Date(`${date} ${b.startTime}`);
      const bE = new Date(`${date} ${b.endTime}`);
      const nS = new Date(`${date} ${start}`);
      const nE = new Date(`${date} ${end}`);
      return nS < bE && nE > bS;
    });
    if (roomConflict) return true;
    return bookings.filter(b => b.userEmail === user?.email && b.date === date && b.status !== 'cancelled' && b.status !== 'completed')
      .some((b) => {
        const bS = new Date(`${date} ${b.startTime}`);
        const bE = new Date(`${date} ${b.endTime}`);
        const nS = new Date(`${date} ${start}`);
        const nE = new Date(`${date} ${end}`);
        return nS < bE && nE > bS;
      });
  }

  async function handleBook() {
    if (!selectedDate || !startTime || !endTime) { setMessage({ text: "Please select date and time.", type: "error" }); return; }
    if (endTime <= startTime) { setMessage({ text: "End time must be after start time.", type: "error" }); return; }
    if (hasConflict(selectedDate, startTime, endTime)) {
      const conflicting = getBookingsByRoomAndDate(selectedRoom.id, selectedDate).find((b) => {
        const bS = new Date(`${selectedDate} ${b.startTime}`);
        const bE = new Date(`${selectedDate} ${b.endTime}`);
        const nS = new Date(`${selectedDate} ${startTime}`);
        const nE = new Date(`${selectedDate} ${endTime}`);
        return nS < bE && nE > bS;
      });
      const userExistingBooking = bookings.find(b =>
        b.userEmail === user?.email && b.date === selectedDate && b.status !== 'cancelled' && b.status !== 'completed' &&
        new Date(`${selectedDate} ${b.startTime}`) < new Date(`${selectedDate} ${endTime}`) &&
        new Date(`${selectedDate} ${b.endTime}`) > new Date(`${selectedDate} ${startTime}`)
      );
      setConflict(true);
      setConflictDetails({ slot: conflicting?.slot || userExistingBooking?.slot || `${formatTime(startTime)} – ${formatTime(endTime)}`, isUserConflict: !!userExistingBooking, conflictRoom: userExistingBooking?.roomName || '' });
      return;
    }
    setConflict(false); setLoading(true);
    const result = await bookSlot({ roomId: selectedRoom.id, roomName: selectedRoom.name, date: selectedDate, slot: `${formatTime(startTime)} – ${formatTime(endTime)}`, startTime, endTime, purpose, bookedBy: user?.name || "Unknown", userEmail: user?.email || "" });
    setLoading(false);
    if (result.success) {
      setMessage({ text: "Room booked successfully! 🎉", type: "success" });
      setPurpose(""); setBookingConfirmed(true);
      if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else { setMessage({ text: result.message, type: "error" }); }
  }

  async function handleAdminRequest() {
    if (!canBook) { setMessage({ text: "Please select date and time first.", type: "error" }); return; }
    const result = await addAdminRequest({ roomId: selectedRoom.id, roomName: selectedRoom.name, date: selectedDate, slot: `${formatTime(startTime)} – ${formatTime(endTime)}`, startTime, endTime, purpose, requestedBy: user?.name || "Unknown", userEmail: user?.email || "" });
    if (result.success) { setAdminRequestSent(true); setConflict(false); }
  }

  function handleCalendarDateClick(info) { setBookingModalDate(info.date); setBookingModalMode("book"); setBookingModalPrefilled(null); setBookingModalOpen(true); }
  function handleCalendarEventClick(info) { setSelectedEvent(info.event); setShowEventPopup(true); }
  function handleRescheduleFromPopup() {
    const booking = selectedEvent.extendedProps.booking;
    setShowEventPopup(false); setBookingModalDate(new Date(booking.date)); setBookingModalMode("reschedule"); setBookingModalPrefilled(booking); setBookingModalOpen(true);
  }
  function handleCancelFromPopup() {
    if (!selectedEvent.extendedProps.isOwner) { setMessage({ text: "You can only cancel your own bookings.", type: "error" }); setShowEventPopup(false); return; }
    const booking = selectedEvent.extendedProps.booking;
    setShowEventPopup(false); setCancelBookingId(booking.id); setShowCancelModal(true);
  }
  async function handleConfirmCancel() {
    const result = await cancelBooking(cancelBookingId);
    setShowCancelModal(false); setCancelBookingId(null);
    setMessage({ text: result.message || "Booking cancelled.", type: result.success ? "success" : "error" });
  }

  const views = [{ label: "Month", value: "dayGridMonth" }, { label: "Week", value: "timeGridWeek" }, { label: "Day", value: "timeGridDay" }];

  const guidelines = [
    { icon: <FaClock size={12} className="text-blue-500" />, bg: 'bg-blue-50', title: 'Check-in required', desc: 'Within 5 min of start time' },
    { icon: <span className="text-amber-500 text-xs font-bold">🔔</span>, bg: 'bg-amber-50', title: 'Auto-release', desc: 'After 15 min no check-in' },
    { icon: <span className="text-emerald-600 text-sm font-bold">+</span>, bg: 'bg-emerald-50', title: 'Extend anytime', desc: 'In 15 min increments' },
    { icon: <FaTimesCircle size={12} className="text-rose-500" />, bg: 'bg-rose-50', title: 'Free cancellation', desc: 'Before meeting starts' },
    { icon: <span className="text-purple-500 text-xs">🛡</span>, bg: 'bg-purple-50', title: 'Admin approval', desc: 'For conflicted slots' },
  ];

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6" ref={topRef}>

        <BookingModal isOpen={bookingModalOpen} onClose={() => setBookingModalOpen(false)} selectedDate={bookingModalDate} prefilledBooking={bookingModalPrefilled} mode={bookingModalMode} roomId={id} />
        <ConfirmModal isOpen={showCancelModal} title="Cancel Booking" message="Are you sure you want to cancel this booking? This action cannot be undone." confirmText="Yes, Cancel Booking" cancelText="Keep Booking" onConfirm={handleConfirmCancel} onCancel={() => { setShowCancelModal(false); setCancelBookingId(null); }} />

        {/* Event popup */}
        {showEventPopup && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowEventPopup(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 z-10">
              <button onClick={() => setShowEventPopup(false)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500"><FaTimesCircle size={16} /></button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><FaCalendarAlt size={15} className="text-blue-600" /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Booking Details</h3>
                  <p className="text-xs text-slate-400">{selectedEvent.extendedProps.isOwner ? "Your booking" : "Another user's booking"}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2">
                {[["Room", selectedEvent.extendedProps.booking.roomName], ["Date", selectedEvent.extendedProps.booking.date], ["Time", selectedEvent.extendedProps.booking.slot], ["Booked by", selectedEvent.extendedProps.booking.bookedBy]].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                    <span className="text-slate-400 font-medium">{label}</span>
                    <span className="font-semibold text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
              {selectedEvent.extendedProps.isOwner ? (
                <div className="flex gap-2">
                  <button onClick={handleRescheduleFromPopup} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"><FaEdit size={11} /> Reschedule</button>
                  <button onClick={handleCancelFromPopup} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"><FaTrash size={11} /> Cancel</button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-center"><p className="text-xs text-amber-600 font-medium">You cannot modify another user's booking.</p></div>
              )}
            </div>
          </div>
        )}

        {/* Back */}
        <button onClick={() => navigate("/rooms")} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-5 transition-colors font-medium">
          <FaArrowLeft size={10} /> Back to Rooms
        </button>

        {/* Title */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Room Booking</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Book {selectedRoom.name}</h1>
          <p className="text-slate-400 mt-1 text-sm">Review the details below and confirm your booking.</p>
        </div>

        {/* Status message */}
        {message.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-600"
          }`}>
            {message.type === "success" ? <FaCheckCircle size={13} /> : <FaTimesCircle size={13} />}
            {message.text}
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* LEFT */}
          <div className="space-y-4">

            {/* Room card — dark header */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="bg-slate-900 px-4 py-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-white bg-opacity-10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MdMeetingRoom size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-white truncate">{selectedRoom.name}</h2>
                  <div className="flex items-center gap-1 mt-0.5">
                    <FaMapMarkerAlt size={9} className="text-slate-400" />
                    <p className="text-xs text-slate-400">{selectedRoom.location}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  selectedRoom.status === "available"
                    ? "bg-emerald-500 bg-opacity-20 text-emerald-300"
                    : "bg-red-500 bg-opacity-20 text-red-300"
                }`}>
                  {selectedRoom.status === "available" ? "Available" : "Unavailable"}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <FaUsers size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-500 font-medium">{selectedRoom.capacity} people capacity</span>
                </div>
                {selectedRoom.description && (
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{selectedRoom.description}</p>
                )}
                {selectedRoom.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoom.amenities.map((a, i) => (
                      <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Guidelines card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Booking guidelines</p>
              <div className="space-y-3">
                {guidelines.map(({ icon, bg, title, desc }) => (
                  <div key={title} className="flex items-center gap-3">
  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>{icon}</div>
  <div>
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    <p className="text-xs text-slate-400">{desc}</p>
  </div>
</div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-2 space-y-4">

            {/* Booking Summary */}
<div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible">

  {/* Dark header */}
  <div className="bg-slate-900 px-5 py-4 flex items-center justify-between rounded-t-2xl">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-white bg-opacity-10 rounded-xl flex items-center justify-center">
        <FaCalendarAlt size={15} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-bold text-white">Booking Summary</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {selectedDate ? formatDateLabel(selectedDate) : "Select a date"}
        </p>
      </div>
    </div>
    <button onClick={() => setEditing(!editing)}
      className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-white bg-opacity-5 hover:bg-opacity-10 px-3 py-1.5 rounded-lg transition-colors">
      <FaPen size={9} /> {editing ? "Done" : "Edit time"}
    </button>
  </div>

  {/* Body */}
  <div className="p-5" style={{ overflow: 'visible' }}>
    {!editing ? (
      <div className="space-y-2">

        {/* Room + Location */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-1 font-medium">
              <FaDoorOpen size={10} /> Room
            </p>
            <p className="text-sm font-bold text-slate-800">{selectedRoom.name}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-1 font-medium">
              <FaMapMarkerAlt size={10} /> Location
            </p>
            <p className="text-sm font-bold text-slate-800">{selectedRoom.location}</p>
          </div>
        </div>

        {/* Date */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <FaCalendarAlt size={13} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium mb-0.5">Date</p>
            <p className="text-sm font-bold text-slate-800">{formatDateLabel(selectedDate)}</p>
          </div>
        </div>

        {/* Start / End / Duration */}
<div className="grid grid-cols-3 gap-2">
  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
    <p className="text-[11px] text-blue-400 flex items-center gap-1 mb-1.5 font-medium">
      <FaClock size={9} /> Start
    </p>
    <p className="text-sm font-bold text-blue-800">{startTime ? formatTime(startTime) : "—"}</p>
  </div>
  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
    <p className="text-[11px] text-blue-400 flex items-center gap-1 mb-1.5 font-medium">
      <FaClock size={9} /> End
    </p>
    <p className="text-sm font-bold text-blue-800">{endTime ? formatTime(endTime) : "—"}</p>
  </div>
  <div className="bg-slate-100 border border-slate-200 rounded-xl p-3">
    <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-1.5 font-medium">
      <FaClock size={9} /> Duration
    </p>
    <p className="text-sm font-bold text-slate-700">{duration || "—"}</p>
  </div>
</div>

        {/* Booked by */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{getInitials(user?.name)}</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Booked by</p>
            <p className="text-sm font-bold text-slate-800">{user?.name || "—"}</p>
          </div>
          <div className="ml-auto">
            <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-2.5 py-1 rounded-full font-semibold">Confirmed</span>
          </div>
        </div>

      </div>
    ) : (
      <div className="space-y-3">
        <p className="text-xs text-slate-400">Update your date and time selection:</p>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Date</label>
          <input type="date" value={selectedDate} min={getTodayStr()}
            onChange={e => { setSelectedDate(e.target.value); setMessage({text:'',type:''}); setConflict(false); }}
            onClick={e => e.target.showPicker?.()}
            className="w-full bg-white text-slate-900 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 cursor-pointer font-medium"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Start Time</label>
            <TimeSelector value={startTime} onChange={(val) => { setStartTime(val); setEndTime(''); setMessage({text:'',type:''}); setConflict(false); }} placeholder="Select start" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">End Time</label>
            <TimeSelector value={endTime} onChange={(val) => { setEndTime(val); setMessage({text:'',type:''}); setConflict(false); }} disabled={!startTime} placeholder="Select end" startAfter={startTime} />
          </div>
        </div>
        {duration && (
          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
            <FaClock size={11} className="text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">Duration: {duration}</span>
          </div>
        )}
      </div>
    )}
  </div>
</div>

{/* Purpose */}
<div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
    <FaPen size={9} className="text-blue-500" /> Meeting Purpose
    <span className="text-slate-300 font-normal normal-case">(optional)</span>
  </label>
  <textarea value={purpose} onChange={e => setPurpose(e.target.value)}
    placeholder="e.g. Weekly team standup, Client presentation, Interview..."
    rows={2}
    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none placeholder:text-slate-300"
  />
</div>

{/* Conflict */}
{conflict && conflictDetails && (
  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
    <FaTimesCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
    <div>
      <p className="text-xs font-bold text-red-700 mb-1">Time Conflict</p>
      <p className="text-xs text-red-600">
        {conflictDetails.isUserConflict
          ? <>You already have a booking in <span className="font-semibold">{conflictDetails.conflictRoom}</span> at <span className="font-semibold">{conflictDetails.slot}</span>. You cannot book multiple rooms at the same time.</>
          : <>This room is already booked for <span className="font-semibold">{conflictDetails.slot}</span>. Please choose a different time or send an admin request.</>
        }
      </p>
    </div>
  </div>
)}

{/* Admin sent */}
{adminRequestSent && (
  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
    <FaCheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
    <p className="text-xs text-emerald-700 font-medium">Request sent to admin! You'll be notified once approved.</p>
  </div>
)}

{/* Buttons */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <button onClick={handleBook} disabled={!canBook || loading || bookingConfirmed}
    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all ${
      canBook && !loading && !bookingConfirmed
        ? "bg-slate-900 text-white hover:bg-slate-700 shadow-sm"
        : "bg-gray-100 text-gray-400 cursor-not-allowed"
    }`}>
    {loading ? (
      <><div className="w-4 h-4 border-2 border-white border-opacity-30 border-t-white rounded-full animate-spin" />Booking...</>
    ) : bookingConfirmed ? (
      <><FaCheckCircle size={13} /> Booking confirmed ✓</>
    ) : (
      <><FaCalendarAlt size={13} /> Confirm booking</>
    )}
  </button>
  <button onClick={handleAdminRequest} disabled={!canBook || adminRequestSent}
    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold border transition-all ${
      canBook && !adminRequestSent
        ? "bg-white border-gray-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
        : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
    }`}>
    <FaBell size={13} />
    {adminRequestSent ? "Request sent ✓" : "Request admin approval"}
  </button>
  </div>
          </div> {/* closes lg:col-span-2 right column */}
        </div> {/* closes main grid */}

        {/* Calendar */}
        <div id="calendar" className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Availability Calendar</h2>
              <p className="text-xs text-slate-400 mt-0.5">Click any date to book · Click a booking to manage it</p>
            </div>
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <FaCalendarAlt size={11} className="text-blue-500" />
                {views.find(v => v.value === currentView)?.label || "Month"}
                <svg className={`w-3 h-3 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-28 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {views.map(view => (
                    <button key={view.value} onClick={() => { setCurrentView(view.value); setDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition-colors ${currentView === view.value ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                      {view.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-5 mb-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-900" /><span className="text-xs text-slate-500">Your bookings</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400" /><span className="text-xs text-slate-500">Other bookings</span></div>
          </div>
          <FullCalendar key={currentView} plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} initialView={currentView}
            headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
            events={calendarEvents} eventClick={handleCalendarEventClick} dateClick={handleCalendarDateClick}
            height="auto" buttonText={{ today: "Today" }} dayMaxEvents={3} selectable={true} />
        </div>

      </div>
    </section>
  );
}

export default BookingPage;
