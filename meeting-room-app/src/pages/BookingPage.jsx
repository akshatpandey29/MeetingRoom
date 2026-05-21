import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  FaUsers, FaCheckCircle, FaTimesCircle,
  FaArrowLeft, FaClock, FaCalendarAlt,
  FaEdit, FaTrash, FaBell, FaDoorOpen,
  FaMapMarkerAlt, FaPen,
} from "react-icons/fa";
import { MdMeetingRoom } from "react-icons/md";
import { useRooms } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";
import BookingModal from "../components/BookingModal";
import ConfirmModal from "../components/ConfirmModal";

// ── helpers ───────────────────────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return "";
  if (typeof date === "string") return date;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

// ── main ──────────────────────────────────────────────────────────────────────
function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    getRoomById, getBookingsByRoom, getBookingsByRoomAndDate,
    fetchBookingsByRoomAndDate, bookSlot, cancelBooking, addAdminRequest,
  } = useRooms();

  const selectedRoom = getRoomById(id);

  // Pre-fill from rooms page state
  const [selectedDate, setSelectedDate] = useState(location.state?.selectedDate || getTodayStr());
  const [startTime, setStartTime] = useState(location.state?.startTime || "");
  const [endTime, setEndTime] = useState(location.state?.endTime || "");
  const [purpose, setPurpose] = useState("");
  const [editing, setEditing] = useState(!location.state?.startTime); // show edit if no time passed

  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [adminRequestSent, setAdminRequestSent] = useState(false);
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
    if (selectedRoom?.id && selectedDate) {
      fetchBookingsByRoomAndDate(selectedRoom.id, selectedDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom?.id, selectedDate]);

  useEffect(() => {
    if (!location.state?.openBookingForm) return;

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [location.state?.openBookingForm]);

  // ── room not found ────────────────────────────────────────────────────────
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

  // ── derived ───────────────────────────────────────────────────────────────
  const allRoomBookings = getBookingsByRoom(selectedRoom.id).filter(
  b => b.status !== 'completed' && b.status !== 'cancelled'
);
  const bookedSlotsForDate = getBookingsByRoomAndDate(selectedRoom.id, selectedDate);
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

  // ── conflict check ────────────────────────────────────────────────────────
  function hasConflict(date, start, end) {
    return getBookingsByRoomAndDate(selectedRoom.id, date).some((b) => {
      const bS = new Date(`${date} ${b.startTime}`);
      const bE = new Date(`${date} ${b.endTime}`);
      const nS = new Date(`${date} ${start}`);
      const nE = new Date(`${date} ${end}`);
      return nS < bE && nE > bS;
    });
  }

  // ── book ──────────────────────────────────────────────────────────────────
  async function handleBook() {
    if (!selectedDate || !startTime || !endTime) {
      setMessage({ text: "Please select date and time.", type: "error" }); return;
    }
    if (endTime <= startTime) {
      setMessage({ text: "End time must be after start time.", type: "error" }); return;
    }
    if (hasConflict(selectedDate, startTime, endTime)) {
      const conflicting = getBookingsByRoomAndDate(selectedRoom.id, selectedDate).find((b) => {
        const bS = new Date(`${selectedDate} ${b.startTime}`);
        const bE = new Date(`${selectedDate} ${b.endTime}`);
        const nS = new Date(`${selectedDate} ${startTime}`);
        const nE = new Date(`${selectedDate} ${endTime}`);
        return nS < bE && nE > bS;
      });
      setConflict(true);
      setConflictDetails({ slot: conflicting?.slot || `${formatTime(startTime)} – ${formatTime(endTime)}` });
      return;
    }
    setConflict(false); setLoading(true);
    const result = await bookSlot({
      roomId: selectedRoom.id, roomName: selectedRoom.name,
      date: selectedDate,
      slot: `${formatTime(startTime)} – ${formatTime(endTime)}`,
      startTime, endTime,
      purpose,
      bookedBy: user?.name || "Unknown",
      userEmail: user?.email || "",
    });
    setLoading(false);
    if (result.success) {
      setMessage({ text: "Room booked successfully! 🎉", type: "success" });
      setPurpose("");
    } else {
      setMessage({ text: result.message, type: "error" });
    }
  }

  // ── admin request ─────────────────────────────────────────────────────────
  async function handleAdminRequest() {
    if (!canBook) { setMessage({ text: "Please select date and time first.", type: "error" }); return; }
    const result = await addAdminRequest({
      roomId: selectedRoom.id, roomName: selectedRoom.name,
      date: selectedDate,
      slot: `${formatTime(startTime)} – ${formatTime(endTime)}`,
      startTime, endTime, purpose,
      requestedBy: user?.name || "Unknown",
      userEmail: user?.email || "",
    });
    if (result.success) { setAdminRequestSent(true); setConflict(false); }
  }

  // ── calendar handlers ─────────────────────────────────────────────────────
  function handleCalendarDateClick(info) {
    setBookingModalDate(info.date);
    setBookingModalMode("book");
    setBookingModalPrefilled(null);
    setBookingModalOpen(true);
  }

  function handleCalendarEventClick(info) {
    setSelectedEvent(info.event);
    setShowEventPopup(true);
  }

  function handleRescheduleFromPopup() {
    const booking = selectedEvent.extendedProps.booking;
    setShowEventPopup(false);
    setBookingModalDate(new Date(booking.date));
    setBookingModalMode("reschedule");
    setBookingModalPrefilled(booking);
    setBookingModalOpen(true);
  }

  function handleCancelFromPopup() {
    if (!selectedEvent.extendedProps.isOwner) {
      setMessage({ text: "You can only cancel your own bookings.", type: "error" });
      setShowEventPopup(false); return;
    }
    const booking = selectedEvent.extendedProps.booking;
    setShowEventPopup(false);
    setCancelBookingId(booking.id);
    setShowCancelModal(true);
  }

  async function handleConfirmCancel() {
    const result = await cancelBooking(cancelBookingId);
    setShowCancelModal(false);
    setCancelBookingId(null);
    setMessage({ text: result.message || "Booking cancelled.", type: result.success ? "success" : "error" });
  }

  const views = [
    { label: "Month", value: "dayGridMonth" },
    { label: "Week", value: "timeGridWeek" },
    { label: "Day", value: "timeGridDay" },
  ];

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <section className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          selectedDate={bookingModalDate}
          prefilledBooking={bookingModalPrefilled}
          mode={bookingModalMode}
          roomId={id}
        />

        <ConfirmModal
          isOpen={showCancelModal}
          title="Cancel Booking"
          message="Are you sure you want to cancel this booking? This action cannot be undone."
          confirmText="Yes, Cancel Booking"
          cancelText="Keep Booking"
          onConfirm={handleConfirmCancel}
          onCancel={() => { setShowCancelModal(false); setCancelBookingId(null); }}
        />

        {/* Event popup */}
        {showEventPopup && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowEventPopup(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 z-10">
              <button onClick={() => setShowEventPopup(false)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500">
                <FaTimesCircle size={16} />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <FaCalendarAlt size={15} className="text-slate-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Booking Details</h3>
                  <p className="text-xs text-slate-400">
                    {selectedEvent.extendedProps.isOwner ? "Your booking" : "Another user's booking"}
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2">
                {[
                  ["Room", selectedEvent.extendedProps.booking.roomName],
                  ["Date", selectedEvent.extendedProps.booking.date],
                  ["Time", selectedEvent.extendedProps.booking.slot],
                  ["Booked by", selectedEvent.extendedProps.booking.bookedBy],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                    <span className="text-slate-400 font-medium">{label}</span>
                    <span className="font-semibold text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
              {selectedEvent.extendedProps.isOwner ? (
                <div className="flex gap-2">
                  <button onClick={handleRescheduleFromPopup}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                    <FaEdit size={11} /> Reschedule
                  </button>
                  <button onClick={handleCancelFromPopup}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                    <FaTrash size={11} /> Cancel
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-amber-600 font-medium">You cannot modify another user's booking.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back button */}
        <button onClick={() => navigate("/rooms")}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-6 transition-colors font-medium">
          <FaArrowLeft size={10} /> Back to Rooms
        </button>

        {/* Page title */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Room Booking</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Book {selectedRoom.name}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Review the details below and confirm your booking.</p>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* ── LEFT — Room Info ── */}
          <div className="space-y-4">

            {/* Room card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-slate-900 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white bg-opacity-10 rounded-xl flex items-center justify-center">
                    <MdMeetingRoom size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">{selectedRoom.name}</h2>
                    <div className="flex items-center gap-1 mt-0.5">
                      <FaMapMarkerAlt size={9} className="text-slate-400" />
                      <p className="text-xs text-slate-400">{selectedRoom.location}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <FaUsers size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-600 font-medium">{selectedRoom.capacity} people</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    selectedRoom.status === "available" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                  }`}>
                    {selectedRoom.status === "available" ? "Available" : "Unavailable"}
                  </span>
                </div>
                {selectedRoom.description && (
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{selectedRoom.description}</p>
                )}
                {selectedRoom.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoom.amenities.map((a, i) => (
                      <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bookings on selected date */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                Bookings on {formatDateLabel(selectedDate)}
              </h3>
              {bookedSlotsForDate.length > 0 ? (
                <div className="space-y-2">
                  {bookedSlotsForDate.map((booking) => (
                    <div key={booking.id} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                      booking.userEmail === user?.email ? "bg-blue-50 border border-blue-100" : "bg-slate-50 border border-slate-100"
                    }`}>
                      <div>
                        <p className={`text-xs font-semibold ${booking.userEmail === user?.email ? "text-blue-700" : "text-slate-700"}`}>
                          {booking.slot}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {booking.userEmail === user?.email ? "Your booking" : `By: ${booking.bookedBy}`}
                        </p>
                      </div>
                      {booking.userEmail === user?.email && (
                        <button onClick={() => { setCancelBookingId(booking.id); setShowCancelModal(true); }}
                          className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1">
                          <FaTimesCircle size={11} /> Cancel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2.5">
                  <FaCheckCircle size={12} /> All slots available for this date
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT — Booking Summary + Form ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Booking summary card */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Booking Summary</p>
                <button
                  onClick={() => setEditing(!editing)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors bg-white bg-opacity-5 px-3 py-1.5 rounded-lg"
                >
                  <FaPen size={10} /> {editing ? "Done" : "Edit time"}
                </button>
              </div>

              {!editing ? (
                /* Summary view */
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    ["Room", selectedRoom.name],
                    ["Location", selectedRoom.location],
                    ["Date", formatDateLabel(selectedDate)],
                    ["Duration", duration || "—"],
                    ["Start Time", startTime ? formatTime(startTime) : "—"],
                    ["End Time", endTime ? formatTime(endTime) : "—"],
                    ["Booked by", user?.name || "—"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[11px] text-slate-500 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                /* Edit time view */
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">Update your date and time selection:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        min={getTodayStr()}
                        onChange={e => { setSelectedDate(e.target.value); setMessage({text:'',type:''}); setConflict(false); }}
                        className="w-full bg-white bg-opacity-10 text-white border border-white border-opacity-20 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={e => { setStartTime(e.target.value); setEndTime(''); setMessage({text:'',type:''}); setConflict(false); }}
                        className="w-full bg-white bg-opacity-10 text-white border border-white border-opacity-20 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">End Time</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={e => { setEndTime(e.target.value); setMessage({text:'',type:''}); setConflict(false); }}
                        className="w-full bg-white bg-opacity-10 text-white border border-white border-opacity-20 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                  {duration && (
                    <div className="inline-flex items-center gap-2 bg-white bg-opacity-10 px-3 py-1.5 rounded-lg">
                      <FaClock size={11} className="text-blue-400" />
                      <span className="text-xs font-semibold text-white">Duration: {duration}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Purpose field */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <FaPen size={10} className="text-blue-500" /> Meeting Purpose
                <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="e.g. Weekly team standup, Client presentation, Interview..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none placeholder:text-slate-300"
              />
            </div>

            {/* Conflict message */}
            {conflict && conflictDetails && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <FaTimesCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-700 mb-1">Time Conflict</p>
                  <p className="text-xs text-red-600">
                    This room is already booked for <span className="font-semibold">{conflictDetails.slot}</span>. 
                    Please choose a different time or send an admin request.
                  </p>
                </div>
              </div>
            )}

            {/* Admin request success */}
            {adminRequestSent && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2">
                <FaCheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                <p className="text-xs text-emerald-700 font-medium">
                  Request sent to admin! You'll be notified once approved.
                </p>
              </div>
            )}

            {/* Status message */}
            {message.text && (
              <div className={`px-4 py-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-red-50 border-red-100 text-red-600"
              }`}>
                {message.type === "success" ? <FaCheckCircle size={12} /> : <FaTimesCircle size={12} />}
                {message.text}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBook}
                disabled={!canBook || loading}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
                  canBook && !loading
                    ? "bg-slate-900 text-white hover:bg-slate-700 shadow-sm"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-opacity-30 border-t-white rounded-full animate-spin" />
                    Booking...
                  </>
                ) : (
                  <><FaCalendarAlt size={13} /> Confirm Booking</>
                )}
              </button>

              <button
                onClick={handleAdminRequest}
                disabled={!canBook || adminRequestSent}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold border transition-all ${
                  canBook && !adminRequestSent
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <FaBell size={13} />
                {adminRequestSent ? "Request Sent ✓" : "Request Admin Approval"}
              </button>
            </div>
          </div>
        </div>

        {/* ── FullCalendar ── */}
        <div id="calendar" className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Availability Calendar</h2>
              <p className="text-xs text-slate-400 mt-1">
                Click any date to book · Click an existing booking to manage it
              </p>
            </div>

            {/* View switcher */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <FaCalendarAlt size={11} className="text-blue-500" />
                {views.find(v => v.value === currentView)?.label || "Month"}
                <svg className={`w-3 h-3 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-28 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {views.map(view => (
                    <button key={view.value}
                      onClick={() => { setCurrentView(view.value); setDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition-colors ${
                        currentView === view.value ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-50"
                      }`}>
                      {view.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-900" />
              <span className="text-xs text-slate-500">Your bookings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-xs text-slate-500">Other bookings</span>
            </div>
          </div>

          <FullCalendar
            key={currentView}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
            events={calendarEvents}
            eventClick={handleCalendarEventClick}
            dateClick={handleCalendarDateClick}
            height="auto"
            buttonText={{ today: "Today" }}
            dayMaxEvents={3}
            selectable={true}
          />
        </div>

      </div>
    </section>
  );
}

export default BookingPage;
