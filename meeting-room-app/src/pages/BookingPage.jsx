import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  FaUsers, FaCheckCircle, FaTimesCircle,
  FaArrowLeft, FaClock, FaCalendarAlt, FaEdit, FaTrash,
  FaBell, FaDoorOpen,
} from "react-icons/fa";

import { useRooms } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";
import BookingModal from "../components/BookingModal";
import ConfirmModal from "../components/ConfirmModal";
import TimePickerWheel from "../components/TimePickerWheel";

// ── helpers ──────────────────────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

function convertDateStringToDate(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// ── info row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center text-xs py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className="font-semibold text-slate-700">{value}</span>
    </div>
  );
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

  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingModalDate, setBookingModalDate] = useState(null);
  const [bookingModalMode, setBookingModalMode] = useState("book");
  const [bookingModalPrefilled, setBookingModalPrefilled] = useState(null);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [conflict, setConflict] = useState(false);
  const [conflictDetails, setConflictDetails] = useState(null);
  const [adminRequestSent, setAdminRequestSent] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState(null);

  useEffect(() => {
    if (location.state?.resetBookingForm) {
      setSelectedDate(null); setStartTime(""); setEndTime("");
      setMessage({ text: "", type: "" }); setConflict(false);
      setConflictDetails(null); setAdminRequestSent(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (location.state?.openCalendar || location.hash === "#calendar") {
      if (location.state?.selectedDate) setSelectedDate(convertDateStringToDate(location.state.selectedDate));
      if (location.state?.startTime) setStartTime(location.state.startTime);
      if (location.state?.endTime) setEndTime(location.state.endTime);
      setTimeout(() => {
        document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [location]);

  useEffect(() => {
    if (selectedRoom?.id && selectedDate) {
      fetchBookingsByRoomAndDate(selectedRoom.id, formatDate(selectedDate));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom?.id, selectedDate]);

  // ── room not found ──────────────────────────────────────────────────────────
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

  // ── derived ─────────────────────────────────────────────────────────────────
  const bookedSlotsForDate = selectedDate
    ? getBookingsByRoomAndDate(selectedRoom.id, formatDate(selectedDate))
    : [];
  const allRoomBookings = getBookingsByRoom(selectedRoom.id);

  const calendarEvents = allRoomBookings.map((booking) => {
    const isOwner = booking.userEmail === user?.email;
    const dateStr = booking.date;
    return {
      id: String(booking.id),
      title: booking.slot,
      start: booking.startTime ? `${dateStr}T${booking.startTime}` : dateStr,
      end: booking.endTime ? `${dateStr}T${booking.endTime}` : dateStr,
      backgroundColor: isOwner ? "#0f172a" : "#94a3b8",
      borderColor: isOwner ? "#1e293b" : "#64748b",
      textColor: "#ffffff",
      extendedProps: { booking, isOwner },
    };
  });

  const duration = getDuration(startTime, endTime);
  const timeSelected = startTime && endTime;
  const canBook = selectedDate && startTime && endTime;

  // ── conflict check ──────────────────────────────────────────────────────────
  function hasTimeConflict(date, start, end) {
    const dateStr = formatDate(date);
    const existing = getBookingsByRoomAndDate(selectedRoom.id, dateStr);
    return existing.some((b) => {
      const bS = new Date(`${dateStr} ${b.startTime}`);
      const bE = new Date(`${dateStr} ${b.endTime}`);
      const nS = new Date(`${dateStr} ${start}`);
      const nE = new Date(`${dateStr} ${end}`);
      return nS < bE && nE > bS;
    });
  }

  // ── book slot ───────────────────────────────────────────────────────────────
  async function handleBookSlot() {
    if (!selectedDate) { setMessage({ text: "Please select a date.", type: "error" }); return; }
    if (!startTime) { setMessage({ text: "Please select a start time.", type: "error" }); return; }
    if (!endTime) { setMessage({ text: "Please select an end time.", type: "error" }); return; }

    const now = new Date();
    const selectedDateStr = formatDate(selectedDate);
    if (selectedDateStr === formatDate(now)) {
      const [sh, sm] = startTime.split(":").map(Number);
      const startDT = new Date();
      startDT.setHours(sh, sm, 0, 0);
      if (startDT <= now) {
        setMessage({ text: "Cannot book a time in the past. Please select a future time.", type: "error" });
        return;
      }
    }

    if (endTime <= startTime) { setMessage({ text: "End time must be after start time.", type: "error" }); return; }

    if (hasTimeConflict(selectedDate, startTime, endTime)) {
      const dateStr = formatDate(selectedDate);
      const existing = getBookingsByRoomAndDate(selectedRoom.id, dateStr);
      const conflicting = existing.find((b) => {
        const bS = new Date(`${dateStr} ${b.startTime}`);
        const bE = new Date(`${dateStr} ${b.endTime}`);
        const nS = new Date(`${dateStr} ${startTime}`);
        const nE = new Date(`${dateStr} ${endTime}`);
        return nS < bE && nE > bS;
      });
      setConflict(true);
      setConflictDetails({
        roomName: selectedRoom.name,
        date: new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
        slot: conflicting?.slot || `${formatTime(startTime)} – ${formatTime(endTime)}`,
      });
      return;
    }

    setConflict(false); setConflictDetails(null); setAdminRequestSent(false); setLoading(true);
    const slot = `${formatTime(startTime)} – ${formatTime(endTime)}`;
    const result = await bookSlot({
      roomId: selectedRoom.id, roomName: selectedRoom.name,
      date: formatDate(selectedDate), slot, startTime, endTime,
      bookedBy: user?.name || "Unknown", userEmail: user?.email || "",
    });
    setLoading(false);
    if (result.success) {
      setMessage({ text: "Room booked successfully!", type: "success" });
      setStartTime(""); setEndTime(""); setConflict(false);
    } else {
      setMessage({ text: result.message, type: "error" });
    }
  }

  // ── admin request ───────────────────────────────────────────────────────────
  async function handleAdminRequest() {
    if (!selectedDate || !startTime || !endTime) {
      setMessage({ text: "Please select date and time first.", type: "error" }); return;
    }
    const slot = `${formatTime(startTime)} – ${formatTime(endTime)}`;
    const result = await addAdminRequest({
      roomId: selectedRoom.id, roomName: selectedRoom.name,
      date: formatDate(selectedDate), slot, startTime, endTime,
      requestedBy: user?.name || "Unknown", userEmail: user?.email || "",
    });
    if (result.success) { setAdminRequestSent(true); setConflict(false); setMessage({ text: "", type: "" }); }
  }

  // ── cancel ──────────────────────────────────────────────────────────────────
  function handleCancelBooking(bookingId) {
    setCancelBookingId(bookingId);
    setShowCancelModal(true);
  }

  async function handleConfirmCancelBooking() {
    const result = await cancelBooking(cancelBookingId);
    setShowCancelModal(false);
    setCancelBookingId(null);
    setMessage({
      text: result.message || "Booking cancelled successfully.",
      type: result.success ? "success" : "error",
    });
  }

  // ── calendar ────────────────────────────────────────────────────────────────
  function handleCalendarDateClick(info) {
    setBookingModalDate(info.date); setBookingModalMode("book");
    setBookingModalPrefilled(null); setBookingModalOpen(true);
  }

  function handleCalendarEventClick(info) {
    setSelectedEvent(info.event); setShowEventPopup(true);
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

  const views = [
    { label: "Month", value: "dayGridMonth" },
    { label: "Week", value: "timeGridWeek" },
    { label: "Day", value: "timeGridDay" },
  ];

  // ── render ──────────────────────────────────────────────────────────────────
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
          onConfirm={handleConfirmCancelBooking}
          onCancel={() => { setShowCancelModal(false); setCancelBookingId(null); }}
        />

        {/* ── Event Detail Popup ── */}
        {showEventPopup && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowEventPopup(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 z-10">
              <button onClick={() => setShowEventPopup(false)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors">
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

              <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1">
                <InfoRow label="Room" value={selectedEvent.extendedProps.booking.roomName} />
                <InfoRow label="Date" value={selectedEvent.extendedProps.booking.date} />
                <InfoRow label="Time" value={selectedEvent.extendedProps.booking.slot} />
                <InfoRow label="Booked by" value={selectedEvent.extendedProps.booking.bookedBy} />
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

        {/* ── Page Header ── */}
        <div className="mb-6">
          <button onClick={() => navigate("/rooms")}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-4 transition-colors font-medium">
            <FaArrowLeft size={10} /> Back to Rooms
          </button>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Room Booking</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Book {selectedRoom.name}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Select your preferred date and time to confirm your booking.
          </p>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT — Room Info ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Room Details Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Accent header */}
              <div className="bg-slate-900 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white bg-opacity-10 rounded-xl flex items-center justify-center">
                    <FaDoorOpen size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">{selectedRoom.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedRoom.location}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Status + Capacity */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <FaUsers size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-600 font-medium">{selectedRoom.capacity} people</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    selectedRoom.status === "available"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}>
                    {selectedRoom.status === "available" ? "Available" : "Unavailable"}
                  </span>
                </div>

                {/* Description */}
                {selectedRoom.description && (
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    {selectedRoom.description}
                  </p>
                )}

                {/* Amenities */}
                {selectedRoom.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoom.amenities.map((a, i) => (
                      <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Booked slots for selected date */}
            {selectedDate && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                  Bookings on {formatDate(selectedDate)}
                </h3>
                {bookedSlotsForDate.length > 0 ? (
                  <div className="space-y-2">
                    {bookedSlotsForDate.map((booking) => (
                      <div key={booking.id}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                          booking.userEmail === user?.email
                            ? "bg-blue-50 border border-blue-100"
                            : "bg-slate-50 border border-slate-100"
                        }`}>
                        <div>
                          <p className={`text-xs font-semibold ${
                            booking.userEmail === user?.email ? "text-blue-700" : "text-slate-700"
                          }`}>
                            {booking.slot}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {booking.userEmail === user?.email ? "Your booking" : `By: ${booking.bookedBy}`}
                          </p>
                        </div>
                        {booking.userEmail === user?.email && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                          >
                            <FaTimesCircle size={11} /> Cancel
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2.5">
                    <FaCheckCircle size={12} />
                    All slots available for this date
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT — Booking Form ── */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                <FaCalendarAlt size={13} className="text-blue-500" />
                Select Date & Time
              </h2>

              {/* Date + Time pickers */}
              <div className="flex flex-col md:flex-row items-start gap-6 mb-5">

                {/* Date picker */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                    Date
                  </label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date); setStartTime(""); setEndTime("");
                      setMessage({ text: "", type: "" }); setConflict(false);
                    }}
                    minDate={new Date()}
                    inline
                  />
                </div>

                {/* Time pickers */}
                <div className="flex flex-col gap-4 flex-1 md:pt-8">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                      <FaClock size={10} className="text-blue-500" /> Start Time
                    </label>
                    <TimePickerWheel
                      value={startTime}
                      onChange={(t) => { setStartTime(t); setEndTime(""); setMessage({ text: "", type: "" }); setConflict(false); }}
                      disabled={!selectedDate}
                      label="Select start time"
                    />
                    {!selectedDate && <p className="text-[11px] text-slate-400 mt-1">Select a date first</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                      <FaClock size={10} className="text-blue-500" /> End Time
                    </label>
                    <TimePickerWheel
                      value={endTime}
                      onChange={(t) => { setEndTime(t); setMessage({ text: "", type: "" }); setConflict(false); }}
                      disabled={!startTime}
                      label="Select end time"
                    />
                    {!startTime && <p className="text-[11px] text-slate-400 mt-1">Select start time first</p>}
                  </div>

                  {/* Duration pill */}
                  {duration && (
                    <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold w-fit">
                      <FaClock size={11} className="text-blue-500" />
                      Duration: {duration}
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Summary */}
              {selectedDate && timeSelected && !conflict && (
                <div className="mb-5 bg-slate-900 rounded-2xl p-4 text-white">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                    Booking Summary
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div>
                      <p className="text-[11px] text-slate-500">Room</p>
                      <p className="text-sm font-semibold">{selectedRoom.name}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Date</p>
                      <p className="text-sm font-semibold">{formatDate(selectedDate)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Start</p>
                      <p className="text-sm font-semibold">{formatTime(startTime)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">End</p>
                      <p className="text-sm font-semibold">{formatTime(endTime)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Duration</p>
                      <p className="text-sm font-semibold">{duration}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Booked by</p>
                      <p className="text-sm font-semibold">{user?.name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Conflict message */}
              {conflict && conflictDetails && (
                <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <div className="flex items-start gap-2">
                    <FaTimesCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-red-700 mb-1">Time Conflict</p>
                      <p className="text-xs text-red-600">
                        <span className="font-semibold">{conflictDetails.roomName}</span> is already booked on{" "}
                        <span className="font-semibold">{conflictDetails.date}</span> from{" "}
                        <span className="font-semibold">{conflictDetails.slot}</span>.
                        Please choose a different time.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin request success */}
              {adminRequestSent && (
                <div className="mb-5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2">
                  <FaCheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">
                    Request sent to admin. Your booking will appear once approved.
                  </p>
                </div>
              )}

              {/* Status message */}
              {message.text && (
                <div className={`mb-5 px-4 py-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                  message.type === "success"
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                    : "bg-red-50 border-red-100 text-red-600"
                }`}>
                  {message.type === "success"
                    ? <FaCheckCircle size={12} />
                    : <FaTimesCircle size={12} />
                  }
                  {message.text}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleBookSlot}
                  disabled={!canBook || loading}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    canBook && !loading
                      ? "bg-slate-900 text-white hover:bg-slate-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-opacity-30 border-t-white rounded-full animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <FaCalendarAlt size={13} /> Confirm Booking
                    </>
                  )}
                </button>

                <button
                  onClick={handleAdminRequest}
                  disabled={!canBook || adminRequestSent}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-all ${
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
        </div>

        {/* ── Calendar Section ── */}
        <div id="calendar" className="mt-5 bg-white border border-gray-200 rounded-2xl shadow-sm p-5 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Availability Calendar</h2>
              <p className="text-xs text-slate-400 mt-1">
                Click any date to book. Click an existing booking to manage it.
              </p>
            </div>

            {/* View switcher */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <FaCalendarAlt size={11} className="text-blue-500" />
                {views.find((v) => v.value === currentView)?.label || "Month"}
                <svg className={`w-3 h-3 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-28 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {views.map((view) => (
                    <button key={view.value}
                      onClick={() => { setCurrentView(view.value); setDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition-colors ${
                        currentView === view.value
                          ? "bg-slate-900 text-white font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
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
              <div className="w-3 h-3 rounded-full bg-blue-700" />
              <span className="text-xs text-slate-500">Your bookings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-700" />
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
