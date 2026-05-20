import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBuilding,
  FaCalendarAlt,
  FaClock,
  FaList,
  FaSearch,
  FaThLarge,
  FaUsers,
} from "react-icons/fa";

import RoomCard from "../components/RoomCard";
import DateSelector from "../components/DateSelector";
import TimePickerWheel from "../components/TimePickerWheel";
import { useRooms } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";

const DEFAULT_ROOM_SLOTS = [
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "13:00", end: "14:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
  { start: "16:00", end: "17:00" },
];

const CAPACITY_OPTIONS = [
  { key: "small", label: "1 - 4", minCapacity: 4 },
  { key: "medium", label: "5 - 10", minCapacity: 10 },
  { key: "large", label: "11 - 20", minCapacity: 11 },
  { key: "xlarge", label: "20+", minCapacity: 20 },
];

function RoomsPage() {
  const {
    rooms,
    bookings,
    fetchBookingsByRoomAndDate,
  } = useRooms();
  const { user } = useAuth();
  const resultsRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacityKey, setCapacityKey] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [formErrorMessage, setFormErrorMessage] = useState("");
  const [hasSubmittedAvailability, setHasSubmittedAvailability] = useState(false);

  function getTodayDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function minutesToTimeValue(totalMinutes) {
    const cappedMinutes = Math.min(totalMinutes, 24 * 60);
    const hour = Math.floor(cappedMinutes / 60);
    const minute = cappedMinutes % 60;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )}`;
  }

  function getCurrentRoundedTime() {
    const now = new Date();
    const currentMinutes =
      now.getHours() * 60 +
      now.getMinutes() +
      (now.getSeconds() > 0 || now.getMilliseconds() > 0 ? 1 : 0);
    const roundedMinutes = Math.ceil(currentMinutes / 5) * 5;

    return minutesToTimeValue(roundedMinutes);
  }

  function getMinimumStartTimeForDate(dateValue) {
    return dateValue === getTodayDate() ? getCurrentRoundedTime() : "";
  }

  function convertTimeToMinutes(timeValue) {
    if (!timeValue) return 0;

    const cleanTime = String(timeValue).trim().toUpperCase();

    if (cleanTime.includes("AM") || cleanTime.includes("PM")) {
      const period = cleanTime.includes("PM") ? "PM" : "AM";
      const timeOnly = cleanTime.replace("AM", "").replace("PM", "").trim();
      let [hour, minute] = timeOnly.split(":").map(Number);

      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      return hour * 60 + (minute || 0);
    }

    const [hour, minute] = cleanTime.split(":").map(Number);
    return hour * 60 + minute;
  }

  function formatTime(timeValue) {
    if (!timeValue) return "";

    const [hour, minute] = timeValue.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )} ${period}`;
  }

  function addMinutesToTime(timeValue, minutesToAdd) {
    return minutesToTimeValue(convertTimeToMinutes(timeValue) + minutesToAdd);
  }

  function getBookingStartTime(booking) {
    return booking.startTime || booking.slot?.split("-")[0]?.trim() || "";
  }

  function getBookingEndTime(booking) {
    return booking.endTime || booking.slot?.split("-")[1]?.trim() || "";
  }

  function isActiveBooking(booking) {
    return booking.status !== "cancelled";
  }

  function isCurrentUserBooking(booking) {
    const currentUserId = String(user?.id || user?._id || "");
    const bookingUserId = String(
      booking?.userId?._id || booking?.userId?.id || booking?.userId || ""
    );
    const currentUserEmail = String(user?.email || "").toLowerCase();
    const bookingUserEmail = String(
      booking?.userEmail || booking?.userId?.email || ""
    ).toLowerCase();

    return (
      (currentUserId && bookingUserId === currentUserId) ||
      (currentUserEmail && bookingUserEmail === currentUserEmail)
    );
  }

  function getRoomBookingsForDate(roomId) {
    return bookings.filter(
      (booking) =>
        String(booking.roomId) === String(roomId) &&
        booking.date === selectedDate &&
        isActiveBooking(booking)
    );
  }

  function getConflictingBooking(roomId, start = startTime, end = endTime) {
    if (!selectedDate || !start || !end) return null;

    const newStart = convertTimeToMinutes(start);
    const newEnd = convertTimeToMinutes(end);

    return getRoomBookingsForDate(roomId).find((booking) => {
      const existingStart = getBookingStartTime(booking);
      const existingEnd = getBookingEndTime(booking);

      if (!existingStart || !existingEnd) return false;

      const bookedStart = convertTimeToMinutes(existingStart);
      const bookedEnd = convertTimeToMinutes(existingEnd);

      return newStart < bookedEnd && newEnd > bookedStart;
    }) || null;
  }

  function getNextAvailableSlot(roomId) {
    if (
      startTime &&
      endTime &&
      convertTimeToMinutes(endTime) > convertTimeToMinutes(startTime) &&
      !getConflictingBooking(roomId)
    ) {
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }

    const roomBookingsForDate = getRoomBookingsForDate(roomId);

    const freeSlot = DEFAULT_ROOM_SLOTS.find((slot) => {
      const slotStart = convertTimeToMinutes(slot.start);
      const slotEnd = convertTimeToMinutes(slot.end);

      return !roomBookingsForDate.some((booking) => {
        const existingStart = getBookingStartTime(booking);
        const existingEnd = getBookingEndTime(booking);

        if (!existingStart || !existingEnd) return false;

        const bookedStart = convertTimeToMinutes(existingStart);
        const bookedEnd = convertTimeToMinutes(existingEnd);

        return slotStart < bookedEnd && slotEnd > bookedStart;
      });
    });

    if (!freeSlot) return "No free slot available";

    return `${formatTime(freeSlot.start)} - ${formatTime(freeSlot.end)}`;
  }

  function getSlotStatus(room) {
    const selectedSlotText =
      startTime && endTime
        ? `${formatTime(startTime)} - ${formatTime(endTime)}`
        : "";

    const nextAvailableSlot = getNextAvailableSlot(room.id);
    const isGenerallyAvailable = room.status === "available" && room.isActive;

    if (!isGenerallyAvailable) {
      return {
        type: "unavailable",
        label: "Room unavailable",
        helper: "This room is not open for booking right now.",
        selectedSlotText,
        nextAvailableSlot,
        canBook: false,
      };
    }

    if (!startTime || !endTime) {
      return {
        type: "needs-time",
        label: "Select a time to check",
        helper: "Pick start and end time to check this room.",
        selectedSlotText: "No time selected",
        nextAvailableSlot,
        canBook: false,
      };
    }

    if (isPastStartTime) {
      return {
        type: "invalid",
        label: "Past time selected",
        helper: "Start time must be current or future.",
        selectedSlotText,
        nextAvailableSlot,
        canBook: false,
      };
    }

    if (isInvalidTimeRange) {
      return {
        type: "invalid",
        label: "Invalid time range",
        helper: "End time must be after start time.",
        selectedSlotText,
        nextAvailableSlot,
        canBook: false,
      };
    }

    const conflictingBooking = getConflictingBooking(room.id);

    if (conflictingBooking) {
      const conflictStart = getBookingStartTime(conflictingBooking);
      const conflictEnd = getBookingEndTime(conflictingBooking);
      const bookedByCurrentUser = isCurrentUserBooking(conflictingBooking);
      const conflictSlot =
        conflictingBooking.slot ||
        `${formatTime(conflictStart)} - ${formatTime(conflictEnd)}`;

      return {
        type: bookedByCurrentUser ? "booked-by-you" : "booked",
        label: bookedByCurrentUser ? "Booked by you" : "Booked",
        helper: bookedByCurrentUser
          ? `You already booked this slot: ${conflictSlot}.`
          : `Booked: ${conflictSlot}. Send an admin request if this time is important.`,
        selectedSlotText,
        nextAvailableSlot,
        canBook: false,
      };
    }

    return {
      type: "free",
      label: "Available",
      helper: "This room is available for your selected slot.",
      selectedSlotText,
      nextAvailableSlot,
      canBook: true,
    };
  }

  function handleStartTimeChange(time) {
    setStartTime(time);
    setEndTime("");
    setFormErrorMessage("");
    setHasSubmittedAvailability(false);
  }

  function handleEndTimeChange(time) {
    setEndTime(time);
    setFormErrorMessage("");
    setHasSubmittedAvailability(false);
  }

  function handleDateChange(date) {
    const minimumTime = getMinimumStartTimeForDate(date);
    const shouldClearTimes =
      minimumTime &&
      startTime &&
      convertTimeToMinutes(startTime) < convertTimeToMinutes(minimumTime);

    setSelectedDate(date);
    setFormErrorMessage("");
    setHasSubmittedAvailability(false);

    if (shouldClearTimes) {
      setStartTime("");
      setEndTime("");
    }
  }

  function clearFilters() {
    setSearchText("");
    setSelectedDate(getTodayDate());
    setStartTime("");
    setEndTime("");
    setCapacityKey("");
    setFloorFilter("");
    setViewMode("grid");
    setFormErrorMessage("");
    setHasSubmittedAvailability(false);
  }

  function handleShowRooms() {
    if (!selectedDate || !startTime || !endTime) {
      setFormErrorMessage("Date, start time, and end time are required.");
      return;
    }

    const currentMinimumStartTime = getMinimumStartTimeForDate(selectedDate);
    const selectedStartIsPast = Boolean(
      currentMinimumStartTime &&
        startTime &&
        convertTimeToMinutes(startTime) <
          convertTimeToMinutes(currentMinimumStartTime)
    );

    if (selectedStartIsPast) {
      setFormErrorMessage("Start time must be current or future.");
      return;
    }

    if (isInvalidTimeRange) {
      setFormErrorMessage("End time must be after start time.");
      return;
    }

    setFormErrorMessage("");
    setHasSubmittedAvailability(true);
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  const activeRooms = useMemo(
    () => rooms.filter((room) => room.isActive),
    [rooms]
  );

  const activeRoomIds = useMemo(
    () => activeRooms.map((room) => room.id).join("|"),
    [activeRooms]
  );

  useEffect(() => {
    if (!selectedDate || activeRooms.length === 0) return;

    activeRooms.forEach((room) => {
      fetchBookingsByRoomAndDate(room.id, selectedDate);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomIds, selectedDate]);

  const floorOptions = useMemo(() => {
    return Array.from(
      new Set(activeRooms.map((room) => room.location).filter(Boolean))
    );
  }, [activeRooms]);

  const selectedCapacity = CAPACITY_OPTIONS.find(
    (option) => option.key === capacityKey
  );

  const minimumStartTime = getMinimumStartTimeForDate(selectedDate);
  const minimumEndTime = (() => {
    const minimumAfterStart = startTime ? addMinutesToTime(startTime, 5) : "";

    if (minimumStartTime && minimumAfterStart) {
      return convertTimeToMinutes(minimumAfterStart) >
        convertTimeToMinutes(minimumStartTime)
        ? minimumAfterStart
        : minimumStartTime;
    }

    return minimumAfterStart || minimumStartTime;
  })();

  const isPastStartTime = Boolean(
    minimumStartTime &&
      startTime &&
      convertTimeToMinutes(startTime) < convertTimeToMinutes(minimumStartTime)
  );

  const isInvalidTimeRange =
    startTime &&
    endTime &&
    convertTimeToMinutes(endTime) <= convertTimeToMinutes(startTime);

  const hasCompleteValidSlot = Boolean(
    startTime && endTime && !isInvalidTimeRange && !isPastStartTime
  );
  const canShowAvailableRooms = Boolean(selectedDate && hasCompleteValidSlot);

  const selectedSlotText =
    startTime && endTime
      ? `${formatTime(startTime)} - ${formatTime(endTime)}`
      : "";

  const roomsWithAvailability = activeRooms.map((room) => {
    const slotStatus = getSlotStatus(room);
    const isAvailableForSelectedTime = hasCompleteValidSlot
      ? slotStatus.canBook
      : room.status === "available" && room.isActive;

    return {
      ...room,
      isAvailableForSelectedTime,
      nextAvailableSlot: slotStatus.nextAvailableSlot,
      slotStatus,
    };
  });

  const filteredRooms = roomsWithAvailability.filter((room) => {
    const searchValue = searchText.toLowerCase();

    const matchesSearch =
      !searchValue ||
      room.name.toLowerCase().includes(searchValue) ||
      room.location.toLowerCase().includes(searchValue) ||
      room.amenities.some((amenity) =>
        amenity.toLowerCase().includes(searchValue)
      );

    const matchesFloor = !floorFilter || room.location === floorFilter;

    const matchesCapacity =
      !selectedCapacity || room.capacity >= selectedCapacity.minCapacity;

    return matchesSearch && matchesFloor && matchesCapacity;
  });

  return (
    <section className="min-h-screen px-4 py-6 md:px-6 md:py-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-7 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.55fr]">
            <aside className="bg-slate-950 px-6 py-7 text-white md:px-8 lg:min-h-[520px]">
              <p className="text-xs font-bold uppercase text-blue-300">
                Meeting Rooms
              </p>

              <h1 className="mt-4 max-w-sm text-3xl font-bold md:text-4xl">
                Find a Room
              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                Select a future slot first. RoomBook will show matching rooms with
                clear availability before you move to the booking page.
              </p>

              <div className="mt-8 space-y-5">
                <GuideStep
                  number="1"
                  title="Choose the meeting time"
                  description="Date, start time, and end time are required to check availability."
                />
                <GuideStep
                  number="2"
                  title="Refine the room match"
                  description="Use capacity, floor, or amenities when you need a specific setup."
                />
                <GuideStep
                  number="3"
                  title="Continue with the right action"
                  description="Available rooms can be booked. Booked slots can be sent for admin approval."
                />
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Selected slot
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  {selectedSlotText || "No time selected yet"}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Fields marked with a red dot are required before rooms can be shown.
                </p>
              </div>
            </aside>

            <div className="px-5 py-6 sm:px-7 sm:py-7 xl:px-9 xl:py-8">
              <div className="mb-7 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <FaCalendarAlt size={18} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold leading-tight text-slate-900">
                      Room Availability
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Complete the required fields, then show matching rooms.
                    </p>
                  </div>
                </div>

                <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
                  Required fields have a red dot
                </div>
              </div>

              <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
                <DateSelector
                  value={selectedDate}
                  onChange={handleDateChange}
                  label="Date"
                  required
                  size="large"
                />

                <CompactField
                  icon={<FaClock className="text-blue-500" size={14} />}
                  label="Start Time"
                  required
                >
                  <TimePickerWheel
                    value={startTime}
                    onChange={handleStartTimeChange}
                    disabled={false}
                    label="Select start time"
                    minTime={minimumStartTime}
                    minTimeMessage={
                      minimumStartTime ? "Past times are disabled for today." : ""
                    }
                    size="large"
                  />
                </CompactField>

                <CompactField
                  icon={<FaClock className="text-blue-500" size={14} />}
                  label="End Time"
                  required
                >
                  <TimePickerWheel
                    value={endTime}
                    onChange={handleEndTimeChange}
                    disabled={!startTime}
                    label="Select end time"
                    minTime={minimumEndTime}
                    minTimeMessage={
                      minimumEndTime ? "Choose a valid future end time." : ""
                    }
                    size="large"
                  />
                </CompactField>

                <CompactField
                  icon={<FaBuilding className="text-blue-500" size={14} />}
                  label="Floor"
                >
                  <select
                    value={floorFilter}
                    onChange={(event) => setFloorFilter(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-base text-slate-800 outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Any floor</option>
                    {floorOptions.map((floor) => (
                      <option key={floor} value={floor}>
                        {floor}
                      </option>
                    ))}
                  </select>
                </CompactField>

                <div className="xl:col-span-2">
                  <label className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-700">
                    <FaUsers className="text-blue-500" size={14} />
                    Capacity
                  </label>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {CAPACITY_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() =>
                          setCapacityKey((currentKey) =>
                            currentKey === option.key ? "" : option.key
                          )
                        }
                        className={`min-h-14 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                          capacityKey === option.key
                            ? "border-blue-700 bg-blue-50 text-blue-900 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <CompactField
                  icon={<FaSearch className="text-blue-500" size={14} />}
                  label="Room or Amenity"
                  className="xl:col-span-3"
                >
                  <input
                    type="text"
                    placeholder="Projector, whiteboard, room name..."
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-base text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </CompactField>
              </div>

              {(isInvalidTimeRange || isPastStartTime || formErrorMessage) && (
                <p className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {formErrorMessage ||
                    (isPastStartTime
                      ? "Start time must be current or future."
                      : "End time must be after start time.")}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleShowRooms}
                  disabled={!canShowAvailableRooms}
                  className={`min-h-14 flex-1 rounded-xl px-6 py-3 text-base font-bold shadow-sm transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                    canShowAvailableRooms
                      ? "bg-blue-700 text-white hover:bg-blue-800"
                      : "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none"
                  }`}
                >
                  Show Available Rooms
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="min-h-14 rounded-xl px-6 py-3 text-sm font-bold border-2 border-blue-400 text-slate-600 transition hover:bg-slate-100"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {hasSubmittedAvailability && (
          <>
            <div
              ref={resultsRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 scroll-mt-24"
            >
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Rooms for Selected Slot
                </h2>

                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredRooms.length} room
                  {filteredRooms.length !== 1 ? "s" : ""} for {selectedSlotText}
                </p>
              </div>

              <div className="relative inline-flex w-fit items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    viewMode === "grid"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <FaThLarge size={11} />
                  Grid
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    viewMode === "list"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <FaList size={11} />
                  List
                </button>
              </div>
            </div>

            {filteredRooms.length > 0 ? (
              <div
                key={viewMode}
                className={`transition-all duration-300 ease-out animate-[fadeSlide_0.28s_ease-out] ${
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                    : "space-y-3"
                }`}
              >
                {filteredRooms.map((room, index) => (
                  <div
                    key={room.id}
                    className="transition-all duration-300 ease-out"
                    style={{
                      animation: `fadeSlide 0.28s ease-out ${index * 35}ms both`,
                    }}
                  >
                    <RoomCard
                      room={room}
                      viewMode={viewMode}
                      selectedDate={selectedDate}
                      startTime={startTime}
                      endTime={endTime}
                      nextAvailableSlot={room.nextAvailableSlot}
                      isAvailableForSelectedTime={room.isAvailableForSelectedTime}
                      slotStatus={room.slotStatus}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                <h3 className="text-base font-semibold text-slate-800 mb-1">
                  No rooms found
                </h3>

                <p className="text-slate-500 text-sm">
                  Try changing the date, time, team size, floor, or room preference.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <style>
        {`
          @keyframes fadeSlide {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </section>
  );
}

function CompactField({ icon, label, required = false, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-700">
        {icon}
        {label}
        {required && <span className="text-red-500">•</span>}
      </label>
      {children}
    </div>
  );
}

function GuideStep({ number, title, description }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
        {number}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      </div>
    </div>
  );
}

export default RoomsPage;
