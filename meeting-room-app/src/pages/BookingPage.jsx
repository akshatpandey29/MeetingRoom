import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  FaUsers,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaClock,
  FaCalendarAlt,
  FaEdit,
  FaTrash,
  FaBell,
  FaLock,
} from "react-icons/fa";

import { useRooms } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";
import BookingModal from "../components/BookingModal";
import ConfirmModal from "../components/ConfirmModal";
import TimePickerWheel from "../components/TimePickerWheel";

function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

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
      setSelectedDate(null);
      setStartTime("");
      setEndTime("");
      setMessage({ text: "", type: "" });
      setConflict(false);
      setConflictDetails(null);
      setAdminRequestSent(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (location.state?.openCalendar || location.hash === "#calendar") {
      if (location.state?.selectedDate) {
        setSelectedDate(convertDateStringToDate(location.state.selectedDate));
      }

      if (location.state?.startTime) {
        setStartTime(location.state.startTime);
      }

      if (location.state?.endTime) {
        setEndTime(location.state.endTime);
      }

      setTimeout(() => {
        const calendarSection = document.getElementById("calendar");

        if (calendarSection) {
          calendarSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 200);
    }
  }, [location]);

  function convertDateStringToDate(dateString) {
    if (!dateString) return null;

    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day);
  }

  function formatDate(date) {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatTime(time) {
    if (!time) return "";

    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )} ${period}`;
  }

  function formatTime24(time) {
    return time || "";
  }

  function isCancelDisabled(booking) {
    const today = new Date().toISOString().split("T")[0];

    if (booking.date !== today) return false;

    const startTimeStr = booking.startTime;

    if (!startTimeStr) return false;

    const [hours, minutes] = startTimeStr.split(":").map(Number);

    const slotStartTime = new Date();
    slotStartTime.setHours(hours, minutes, 0, 0);

    const cutoffTime = new Date(slotStartTime.getTime() - 60 * 60 * 1000);

    return new Date() >= cutoffTime;
  }

  if (!selectedRoom) {
    return (
      <section className="min-h-screen px-4 md:px-6 py-5 bg-slate-50">
        <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
          <FaTimesCircle size={36} className="text-red-400 mx-auto mb-4" />

          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Room Not Found
          </h1>

          <p className="text-slate-500 text-sm mb-5">
            This room does not exist or has been removed.
          </p>

          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FaArrowLeft size={12} />
            Back to Rooms
          </Link>
        </div>
      </section>
    );
  }

  const bookedSlotsForDate = selectedDate
    ? getBookingsByRoomAndDate(selectedRoom.id, formatDate(selectedDate))
    : [];

  const allRoomBookings = getBookingsByRoom(selectedRoom.id);

  const calendarEvents = allRoomBookings.map((booking) => {
    const isOwner = booking.userEmail === user?.email;
    const dateStr = booking.date;

    const startStr = booking.startTime
      ? `${dateStr}T${booking.startTime}`
      : dateStr;

    const endStr = booking.endTime ? `${dateStr}T${booking.endTime}` : dateStr;

    return {
      id: String(booking.id),
      title: booking.slot,
      start: startStr,
      end: endStr,
      backgroundColor: isOwner ? "#2563eb" : "#94a3b8",
      borderColor: isOwner ? "#1d4ed8" : "#64748b",
      textColor: "#ffffff",
      extendedProps: {
        booking,
        isOwner,
      },
    };
  });

  function hasTimeConflict(date, start, end) {
    const dateStr = formatDate(date);
    const existing = getBookingsByRoomAndDate(selectedRoom.id, dateStr);

    return existing.some((booking) => {
      const bookedStart = new Date(`${dateStr} ${booking.startTime}`);
      const bookedEnd = new Date(`${dateStr} ${booking.endTime}`);
      const newStart = new Date(`${dateStr} ${start}`);
      const newEnd = new Date(`${dateStr} ${end}`);

      return newStart < bookedEnd && newEnd > bookedStart;
    });
  }

  function handleBookSlot() {
    if (!selectedDate) {
      setMessage({ text: "Please select a date.", type: "error" });
      return;
    }

    if (!startTime) {
      setMessage({ text: "Please select a start time.", type: "error" });
      return;
    }

    if (!endTime) {
      setMessage({ text: "Please select an end time.", type: "error" });
      return;
    }

    const now = new Date();
    const selectedDateStr = formatDate(selectedDate);
    const todayStr = formatDate(now);

    if (selectedDateStr === todayStr) {
      const [startHour, startMin] = startTime.split(":").map(Number);

      const startDateTime = new Date();
      startDateTime.setHours(startHour, startMin, 0, 0);

      if (startDateTime <= now) {
        setMessage({
          text: "Cannot book a meeting in the past. Please select a future time.",
          type: "error",
        });
        return;
      }
    }

    if (endTime <= startTime) {
      setMessage({
        text: "End time must be after start time.",
        type: "error",
      });
      return;
    }

    if (hasTimeConflict(selectedDate, startTime, endTime)) {
      const dateStr = formatDate(selectedDate);
      const existing = getBookingsByRoomAndDate(selectedRoom.id, dateStr);

      const conflicting = existing.find((booking) => {
        const bookedStart = new Date(`${dateStr} ${booking.startTime}`);
        const bookedEnd = new Date(`${dateStr} ${booking.endTime}`);
        const newStart = new Date(`${dateStr} ${startTime}`);
        const newEnd = new Date(`${dateStr} ${endTime}`);

        return newStart < bookedEnd && newEnd > bookedStart;
      });

      setConflict(true);
      setConflictDetails({
        roomName: selectedRoom.name,
        date: new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        slot:
          conflicting?.slot ||
          `${formatTime(startTime)} - ${formatTime(endTime)}`,
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
      startTime,
      endTime,
      bookedBy: user?.name || "Unknown",
      userEmail: user?.email || "",
    });

    setLoading(false);

    if (result.success) {
      setMessage({ text: "Room booked successfully.", type: "success" });
      setStartTime("");
      setEndTime("");
      setConflict(false);
    } else {
      setMessage({ text: result.message, type: "error" });
    }
  }

  function handleAdminRequest() {
    if (!selectedDate || !startTime || !endTime) {
      setMessage({
        text: "Please select date and time first.",
        type: "error",
      });
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
      requestedBy: user?.name || "Unknown",
      userEmail: user?.email || "",
    });

    if (result.success) {
      setAdminRequestSent(true);
      setConflict(false);
      setMessage({ text: "", type: "" });
    }
  }

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
      setMessage({
        text: "You can only cancel your own bookings.",
        type: "error",
      });
      setShowEventPopup(false);
      return;
    }

    const booking = selectedEvent.extendedProps.booking;

    setShowEventPopup(false);
    setCancelBookingId(booking.id);
    setShowCancelModal(true);
  }

  function handleCancelBooking(bookingId) {
    const booking = bookedSlotsForDate.find((item) => item.id === bookingId);

    if (booking && isCancelDisabled(booking)) {
      setMessage({
        text: "Cannot cancel — less than 1 hour before slot.",
        type: "error",
      });
      return;
    }

    setCancelBookingId(bookingId);
    setShowCancelModal(true);
  }

  function handleConfirmCancelBooking() {
    cancelBooking(cancelBookingId);
    setShowCancelModal(false);
    setCancelBookingId(null);
    setMessage({
      text: "Booking cancelled successfully.",
      type: "success",
    });
  }

  function handleCloseCancelModal() {
    setShowCancelModal(false);
    setCancelBookingId(null);
  }

  const views = [
    { label: "Month", value: "dayGridMonth" },
    { label: "Week", value: "timeGridWeek" },
    { label: "Day", value: "timeGridDay" },
  ];

  function handleViewChange(viewValue) {
    setCurrentView(viewValue);
    setDropdownOpen(false);
  }

  function getCurrentViewLabel() {
    return views.find((view) => view.value === currentView)?.label || "Month";
  }

  return (
    <section className="min-h-screen px-4 md:px-6 py-5 bg-slate-50">
      <div className="max-w-7xl mx-auto">
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
          onConfirm={handleConfirmCancelBooking}
          onCancel={handleCloseCancelModal}
        />

        {showEventPopup && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black bg-opacity-40"
              onClick={() => setShowEventPopup(false)}
            />

            <div className="relative bg-white rounded-xl shadow-xl p-4 w-full max-w-sm mx-4 z-10">
              <button
                onClick={() => setShowEventPopup(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
              >
                <FaTimesCircle size={14} />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FaCalendarAlt size={14} className="text-blue-600" />
                </div>

                <h3 className="text-base font-semibold text-slate-900">
                  Booking Details
                </h3>
              </div>

              <div className="space-y-2 mb-4 bg-slate-50 rounded-lg p-3">
                <InfoRow
                  label="Room"
                  value={selectedEvent.extendedProps.booking.roomName}
                />
                <InfoRow
                  label="Date"
                  value={selectedEvent.extendedProps.booking.date}
                />
                <InfoRow
                  label="Time"
                  value={selectedEvent.extendedProps.booking.slot}
                />
                <InfoRow
                  label="Booked by"
                  value={selectedEvent.extendedProps.booking.bookedBy}
                />

                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Ownership</span>
                  <span
                    className={`font-medium px-2 py-0.5 rounded-full ${
                      selectedEvent.extendedProps.isOwner
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {selectedEvent.extendedProps.isOwner
                      ? "Your booking"
                      : "Other booking"}
                  </span>
                </div>
              </div>

              {selectedEvent.extendedProps.isOwner ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleRescheduleFromPopup}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <FaEdit size={11} />
                    Reschedule
                  </button>

                  <button
                    onClick={handleCancelFromPopup}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <FaTrash size={11} />
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-orange-600 font-medium">
                    You cannot modify another user's booking.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-5">
          <button
            onClick={() => navigate("/rooms")}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 mb-3 transition-colors"
          >
            <FaArrowLeft size={11} />
            Back to Rooms
          </button>

          <p className="text-xs font-semibold text-blue-600 mb-1.5">
            Room Booking
          </p>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Book Room
          </h1>

          <p className="text-slate-500 mt-1.5 text-sm">
            Review room details, select a date and confirm your preferred time
            slot.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Room Information
              </h2>

              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FaMapMarkerAlt className="text-blue-500" size={12} />
                  <span>{selectedRoom.location}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FaUsers className="text-blue-500" size={12} />
                  <span>Capacity: {selectedRoom.capacity} people</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {selectedRoom.status === "available" ? (
                    <>
                      <FaCheckCircle className="text-green-500" size={12} />
                      <span className="text-green-600 font-medium">
                        Available for booking
                      </span>
                    </>
                  ) : (
                    <>
                      <FaTimesCircle className="text-red-500" size={12} />
                      <span className="text-red-600 font-medium">
                        Currently unavailable
                      </span>
                    </>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                {selectedRoom.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {selectedRoom.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Room Schedule
              </h2>

              {allRoomBookings.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {allRoomBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
                    >
                      <p className="text-xs font-semibold text-slate-800">
                        {booking.slot}
                      </p>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {booking.date}
                      </p>

                      <p className="text-[11px] text-slate-400 mt-0.5">
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

          {/* Right */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Booking Details
              </h2>

              <div className="flex flex-col md:flex-row items-start gap-5 mb-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Select Date
                  </label>

                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setStartTime("");
                      setEndTime("");
                      setMessage({ text: "", type: "" });
                      setConflict(false);
                    }}
                    minDate={new Date()}
                    inline
                  />
                </div>

                <div className="flex flex-col gap-4 w-full md:w-52 md:pt-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <FaClock size={11} className="text-blue-500" />
                      Start Time
                    </label>

                    <TimePickerWheel
                      value={startTime}
                      onChange={(time) => {
                        setStartTime(time);
                        setEndTime("");
                        setMessage({ text: "", type: "" });
                        setConflict(false);
                      }}
                      disabled={!selectedDate}
                      label="Select start time"
                    />

                    {!selectedDate && (
                      <p className="text-[11px] text-slate-400">
                        Select a date first.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <FaClock size={11} className="text-blue-500" />
                      End Time
                    </label>

                    <TimePickerWheel
                      value={endTime}
                      onChange={(time) => {
                        setEndTime(time);
                        setMessage({ text: "", type: "" });
                        setConflict(false);
                      }}
                      disabled={!startTime}
                      label="Select end time"
                    />

                    {!startTime && (
                      <p className="text-[11px] text-slate-400">
                        Select start time first.
                      </p>
                    )}
                  </div>

                  {startTime && endTime && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      <p className="text-[11px] text-blue-600 font-medium">
                        Duration
                      </p>

                      <p className="text-sm font-semibold text-blue-800 mt-0.5">
                        {(() => {
                          const [startHour, startMinute] = startTime
                            .split(":")
                            .map(Number);
                          const [endHour, endMinute] = endTime
                            .split(":")
                            .map(Number);

                          const diff =
                            endHour * 60 +
                            endMinute -
                            (startHour * 60 + startMinute);

                          return diff > 0
                            ? `${diff} minutes`
                            : "Invalid time range";
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedDate && startTime && endTime && !conflict && (
                <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg px-3 py-3">
                  <p className="text-xs font-semibold text-blue-800 mb-2">
                    Booking Summary
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-blue-700">
                    <p>Room: {selectedRoom.name}</p>
                    <p>Date: {formatDate(selectedDate)}</p>
                    <p>Start: {formatTime(startTime)}</p>
                    <p>End: {formatTime(endTime)}</p>

                    <p>
                      Duration:{" "}
                      {(() => {
                        const [startHour, startMinute] = startTime
                          .split(":")
                          .map(Number);
                        const [endHour, endMinute] = endTime
                          .split(":")
                          .map(Number);

                        return (
                          endHour * 60 +
                          endMinute -
                          (startHour * 60 + startMinute)
                        );
                      })()}{" "}
                      mins
                    </p>

                    <p>By: {user?.name}</p>
                  </div>
                </div>
              )}

              {conflict && conflictDetails && (
                <div className="mb-4 px-3 py-3 rounded-lg text-sm border bg-red-50 border-red-200">
                  <div className="flex items-start gap-2">
                    <FaTimesCircle
                      size={13}
                      className="text-red-500 mt-0.5 flex-shrink-0"
                    />

                    <p className="text-red-700 text-sm">
                      <span className="font-medium">
                        {conflictDetails.roomName}
                      </span>{" "}
                      is already booked on{" "}
                      <span className="font-medium">
                        {conflictDetails.date}
                      </span>{" "}
                      from{" "}
                      <span className="font-medium">
                        {conflictDetails.slot}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              )}

              {adminRequestSent && (
                <div className="mb-4 px-3 py-3 rounded-lg text-sm border bg-green-50 border-green-100">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle size={12} className="text-green-500" />

                    <p className="text-green-700 text-sm">
                      Request sent to admin. Your booking will appear after
                      approval.
                    </p>
                  </div>
                </div>
              )}

              {message.text && (
                <div
                  className={`mb-4 px-3 py-3 rounded-lg text-sm border ${
                    message.type === "success"
                      ? "bg-green-50 border-green-100 text-green-700"
                      : "bg-red-50 border-red-100 text-red-600"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleBookSlot}
                  disabled={!selectedDate || !startTime || !endTime || loading}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    selectedDate && startTime && endTime && !loading
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <FaCalendarAlt size={12} />
                  {loading ? "Booking..." : "Confirm Booking"}
                </button>

                <button
                  onClick={handleAdminRequest}
                  disabled={
                    !selectedDate ||
                    !startTime ||
                    !endTime ||
                    adminRequestSent
                  }
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold border transition-all duration-150 ${
                    selectedDate && startTime && endTime && !adminRequestSent
                      ? "bg-white border-slate-300 text-slate-700 hover:bg-gray-50"
                      : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <FaBell size={12} />
                  {adminRequestSent ? "Request Sent" : "Request Admin Approval"}
                </button>
              </div>
            </div>

            {selectedDate && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  Booked Slots for {formatDate(selectedDate)}
                </h2>

                {bookedSlotsForDate.length > 0 ? (
                  <div className="space-y-2">
                    {bookedSlotsForDate.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-3 py-2.5"
                      >
                        <div>
                          <p className="text-xs font-semibold text-red-700">
                            {booking.slot}
                          </p>

                          <p className="text-[11px] text-red-500 mt-0.5">
                            By: {booking.bookedBy}
                          </p>
                        </div>

                        {booking.userEmail === user?.email && (
                          <button
                            onClick={() =>
                              !isCancelDisabled(booking) &&
                              handleCancelBooking(booking.id)
                            }
                            disabled={isCancelDisabled(booking)}
                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                              isCancelDisabled(booking)
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-800 cursor-pointer"
                            }`}
                          >
                            {isCancelDisabled(booking) ? (
                              <FaLock size={11} />
                            ) : (
                              <FaTimesCircle size={11} />
                            )}
                            Cancel
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <FaCheckCircle size={12} />
                    All time slots are available for this date.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div
          id="calendar"
          className="mt-5 bg-white border border-gray-200 rounded-xl p-4 scroll-mt-24 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Availability Calendar
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                View room availability by month, week or day. Select a booking
                to manage it.
              </p>
            </div>

            <div className="flex justify-end relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaCalendarAlt size={11} className="text-blue-500" />
                {getCurrentViewLabel()}

                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {views.map((view) => (
                    <button
                      key={view.value}
                      onClick={() => handleViewChange(view.value)}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                        currentView === view.value
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-slate-600 hover:bg-gray-50"
                      }`}
                    >
                      {currentView === view.value ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 flex-shrink-0" />
                      )}

                      {view.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
              <span className="text-xs text-slate-500">Your bookings</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
              <span className="text-xs text-slate-500">Other bookings</span>
            </div>
          </div>

          <FullCalendar
            key={currentView}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
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

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

export default BookingPage;