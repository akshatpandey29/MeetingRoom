import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBuilding,
  FaCalendarAlt,
  FaClock,
  FaDoorOpen,
  FaHourglassHalf,
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
    adminRequests,
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
  const [showFormError, setShowFormError] = useState(false);

  function getTodayDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
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

  function getBookingStartTime(booking) {
    return booking.startTime || booking.slot?.split("-")[0]?.trim() || "";
  }

  function getBookingEndTime(booking) {
    return booking.endTime || booking.slot?.split("-")[1]?.trim() || "";
  }

  function isActiveBooking(booking) {
    return booking.status !== "cancelled";
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
      const conflictSlot =
        conflictingBooking.slot ||
        `${formatTime(conflictStart)} - ${formatTime(conflictEnd)}`;

      return {
        type: "booked",
        label: "Booked for selected time",
        helper: `Booked: ${conflictSlot}.`,
        selectedSlotText,
        nextAvailableSlot,
        canBook: false,
      };
    }

    return {
      type: "free",
      label: "Free for selected time",
      helper: "This room is available for your selected slot.",
      selectedSlotText,
      nextAvailableSlot,
      canBook: true,
    };
  }

  function handleStartTimeChange(time) {
    setStartTime(time);
    setEndTime("");
    setShowFormError(false);
  }

  function handleEndTimeChange(time) {
    setEndTime(time);
    setShowFormError(false);
  }

  function clearFilters() {
    setSearchText("");
    setSelectedDate(getTodayDate());
    setStartTime("");
    setEndTime("");
    setCapacityKey("");
    setFloorFilter("");
    setViewMode("grid");
    setShowFormError(false);
  }

  function handleShowRooms() {
    if (isInvalidTimeRange) {
      setShowFormError(true);
      return;
    }

    setShowFormError(false);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const isInvalidTimeRange =
    startTime &&
    endTime &&
    convertTimeToMinutes(endTime) <= convertTimeToMinutes(startTime);

  const hasCompleteValidSlot = Boolean(startTime && endTime && !isInvalidTimeRange);

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

    const matchesAvailability =
      !hasCompleteValidSlot || room.isAvailableForSelectedTime;

    return matchesSearch && matchesFloor && matchesCapacity && matchesAvailability;
  });

  const bookedTodayCount = bookings.filter(
    (booking) => booking.date === selectedDate && isActiveBooking(booking)
  ).length;

  const myUpcomingBookingsCount = bookings.filter((booking) => {
    const isMyBooking = booking.userEmail === user?.email;
    const isUpcoming = booking.date >= getTodayDate();

    return isMyBooking && isUpcoming && isActiveBooking(booking);
  }).length;

  const myPendingRequestsCount = adminRequests.filter((request) => {
    const isMyRequest = request.userEmail === user?.email;
    const isPending = request.status === "pending";

    return isMyRequest && isPending;
  }).length;

  const summaryCards = useMemo(
    () => [
      {
        title: "Available Rooms",
        value: filteredRooms.length,
        icon: <FaDoorOpen />,
        helper: hasCompleteValidSlot ? "For selected time" : "Active now",
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        title: "Booked Today",
        value: bookedTodayCount,
        icon: <FaCalendarAlt />,
        helper: selectedDate,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        title: "My Upcoming Bookings",
        value: myUpcomingBookingsCount,
        icon: <FaClock />,
        helper: user?.name || "Logged-in user",
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
      {
        title: "Pending Requests",
        value: myPendingRequestsCount,
        icon: <FaHourglassHalf />,
        helper: "Waiting for admin",
        color: "text-amber-600",
        bg: "bg-amber-50",
      },
    ],
    [
      bookedTodayCount,
      filteredRooms.length,
      hasCompleteValidSlot,
      myPendingRequestsCount,
      myUpcomingBookingsCount,
      selectedDate,
      user,
    ]
  );

  return (
    <section className="min-h-screen px-4 md:px-6 py-5 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-5">
          <p className="text-xs font-semibold text-blue-600 mb-1.5">
            Meeting Rooms
          </p>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Find a Room
          </h1>

          <p className="text-slate-500 mt-1.5 max-w-2xl text-sm">
            Fill the form, check availability, then book the room that fits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${card.bg} ${card.color}`}
              >
                {card.icon}
              </div>

              <div>
                <p className="text-xs text-slate-500">{card.title}</p>

                <h3 className="text-xl font-bold text-slate-900 leading-tight">
                  {card.value}
                </h3>

                <p className="text-[11px] text-slate-400 mt-0.5">
                  {card.helper}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="rounded-t-xl bg-blue-700 px-5 py-4 text-white sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-blue-50">
                  <FaCalendarAlt size={15} />
                </div>

                <div>
                  <h2 className="text-base font-bold leading-tight">
                    Room Availability
                  </h2>
                  <p className="mt-1 text-xs font-medium text-blue-100">
                    Pick a meeting slot, match capacity, then continue with the room that fits.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-blue-50">
                <span className="rounded-full bg-white/15 px-3 py-1">
                  1. Date & time
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1">
                  2. Capacity
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1">
                  3. Available rooms
                </span>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DateSelector
                value={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  setShowFormError(false);
                }}
                label="Date"
              />

              <CompactField
                icon={<FaClock className="text-blue-500" size={13} />}
                label="Start Time"
              >
                <TimePickerWheel
                  value={startTime}
                  onChange={handleStartTimeChange}
                  disabled={false}
                  label="Select start time"
                />
              </CompactField>

              <CompactField
                icon={<FaClock className="text-blue-500" size={13} />}
                label="End Time"
              >
                <TimePickerWheel
                  value={endTime}
                  onChange={handleEndTimeChange}
                  disabled={!startTime}
                  label="Select end time"
                />
              </CompactField>

              <CompactField
                icon={<FaBuilding className="text-blue-500" size={13} />}
                label="Floor"
              >
                <select
                  value={floorFilter}
                  onChange={(event) => setFloorFilter(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FaUsers className="text-blue-500" size={13} />
                  Capacity
                </label>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CAPACITY_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() =>
                        setCapacityKey((currentKey) =>
                          currentKey === option.key ? "" : option.key
                        )
                      }
                      className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
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
                icon={<FaSearch className="text-blue-500" size={13} />}
                label="Room or Amenity"
                className="xl:col-span-2"
              >
                <input
                  type="text"
                  placeholder="Projector, whiteboard, room name..."
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </CompactField>
            </div>

            {(isInvalidTimeRange || showFormError) && (
              <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                End time must be after start time.
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleShowRooms}
                className="min-h-11 flex-1 rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Show Available Rooms
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-11 rounded-lg px-5 py-2.5 text-sm font-bold border-2 border-blue-400 text-slate-600 transition hover:bg-slate-200"
              >
                Clear
              </button>

            </div>
          </div>
        </div>

        <div
          ref={resultsRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 scroll-mt-24"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {hasCompleteValidSlot ? "Available Rooms" : "Matching Rooms"}
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredRooms.length} room
              {filteredRooms.length !== 1 ? "s" : ""}
              {selectedSlotText ? ` for ${selectedSlotText}` : ""}
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

function CompactField({ icon, label, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

export default RoomsPage;
