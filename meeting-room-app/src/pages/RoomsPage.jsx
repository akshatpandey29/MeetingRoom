import { useMemo, useState } from "react";
import {
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

function RoomsPage() {
  const { rooms, bookings, adminRequests } = useRooms();
  const { user } = useAuth();

  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("available");
  const [viewMode, setViewMode] = useState("grid");

  const [activeDayPreset, setActiveDayPreset] = useState("today");
  const [activeTimePreset, setActiveTimePreset] = useState("");

  function getTodayDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function convertTimeToMinutes(timeValue) {
    if (!timeValue) return 0;

    const [hour, minute] = timeValue.split(":").map(Number);
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

  function hasTimeConflict(roomId) {
    if (!selectedDate || !startTime || !endTime) {
      return false;
    }

    const newStart = convertTimeToMinutes(startTime);
    const newEnd = convertTimeToMinutes(endTime);

    return bookings.some((booking) => {
      if (booking.roomId !== roomId || booking.date !== selectedDate) {
        return false;
      }

      if (!booking.startTime || !booking.endTime) {
        const selectedSlot = `${formatTime(startTime)} - ${formatTime(endTime)}`;
        return booking.slot === selectedSlot;
      }

      const existingStart = convertTimeToMinutes(booking.startTime);
      const existingEnd = convertTimeToMinutes(booking.endTime);

      return newStart < existingEnd && newEnd > existingStart;
    });
  }

  function getNextAvailableSlot(roomId) {
    if (startTime && endTime && !hasTimeConflict(roomId)) {
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }

    const defaultSlots = [
      { start: "09:00", end: "10:00" },
      { start: "10:00", end: "11:00" },
      { start: "11:00", end: "12:00" },
      { start: "12:00", end: "13:00" },
      { start: "14:00", end: "15:00" },
      { start: "15:00", end: "16:00" },
      { start: "16:00", end: "17:00" },
    ];

    const roomBookingsForDate = bookings.filter(
      (booking) => booking.roomId === roomId && booking.date === selectedDate
    );

    const freeSlot = defaultSlots.find((slot) => {
      const slotStart = convertTimeToMinutes(slot.start);
      const slotEnd = convertTimeToMinutes(slot.end);

      return !roomBookingsForDate.some((booking) => {
        if (!booking.startTime || !booking.endTime) {
          return false;
        }

        const bookedStart = convertTimeToMinutes(booking.startTime);
        const bookedEnd = convertTimeToMinutes(booking.endTime);

        return slotStart < bookedEnd && slotEnd > bookedStart;
      });
    });

    if (!freeSlot) {
      return "No free slot available";
    }

    return `${formatTime(freeSlot.start)} - ${formatTime(freeSlot.end)}`;
  }

  function handleTodayPreset() {
    setSelectedDate(getTodayDate());
    setActiveDayPreset("today");
  }

  function handleTomorrowPreset() {
    setSelectedDate(getTomorrowDate());
    setActiveDayPreset("tomorrow");
  }

  function handleTimePreset(start, end, presetKey) {
    setStartTime(start);
    setEndTime(end);
    setActiveTimePreset(presetKey);
  }

  function handleDateChange(dateValue) {
    setSelectedDate(dateValue);

    if (dateValue === getTodayDate()) {
      setActiveDayPreset("today");
    } else if (dateValue === getTomorrowDate()) {
      setActiveDayPreset("tomorrow");
    } else {
      setActiveDayPreset("");
    }
  }

  function handleStartTimeChange(time) {
    setStartTime(time);
    setEndTime("");
    setActiveTimePreset("");
  }

  function handleEndTimeChange(time) {
    setEndTime(time);

    const currentStart = startTime;
    const currentEnd = time;

    if (currentStart === "10:00" && currentEnd === "12:00") {
      setActiveTimePreset("10-12");
    } else if (currentStart === "12:00" && currentEnd === "14:00") {
      setActiveTimePreset("12-2");
    } else if (currentStart === "14:00" && currentEnd === "17:00") {
      setActiveTimePreset("2-5");
    } else {
      setActiveTimePreset("");
    }
  }

  function clearFilters() {
    setSearchText("");
    setSelectedDate(getTodayDate());
    setStartTime("");
    setEndTime("");
    setCapacityFilter("");
    setAvailabilityFilter("available");
    setViewMode("grid");
    setActiveDayPreset("today");
    setActiveTimePreset("");
  }

  const activeRooms = rooms.filter((room) => room.isActive);

  const roomsWithAvailability = activeRooms.map((room) => {
    const isGenerallyAvailable = room.status === "available" && room.isActive;
    const isConflict = hasTimeConflict(room.id);
    const isAvailableForSelectedTime = isGenerallyAvailable && !isConflict;

    return {
      ...room,
      isAvailableForSelectedTime,
      nextAvailableSlot: getNextAvailableSlot(room.id),
    };
  });

  const filteredRooms = roomsWithAvailability.filter((room) => {
    const searchValue = searchText.toLowerCase();

    const matchesSearch =
      room.name.toLowerCase().includes(searchValue) ||
      room.location.toLowerCase().includes(searchValue) ||
      room.amenities.some((amenity) =>
        amenity.toLowerCase().includes(searchValue)
      );

    const matchesCapacity =
      !capacityFilter || room.capacity >= Number(capacityFilter);

    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && room.isAvailableForSelectedTime) ||
      (availabilityFilter === "unavailable" &&
        !room.isAvailableForSelectedTime);

    return matchesSearch && matchesCapacity && matchesAvailability;
  });

  const bookedTodayCount = bookings.filter(
    (booking) => booking.date === selectedDate
  ).length;

  const myUpcomingBookingsCount = bookings.filter((booking) => {
    const isMyBooking = booking.userEmail === user?.email;
    const isUpcoming = booking.date >= getTodayDate();

    return isMyBooking && isUpcoming;
  }).length;

  const myPendingRequestsCount = adminRequests.filter((request) => {
    const isMyRequest = request.userEmail === user?.email;
    const isPending = request.status === "pending";

    return isMyRequest && isPending;
  }).length;

  const availableRoomsCount = roomsWithAvailability.filter(
    (room) => room.isAvailableForSelectedTime
  ).length;

  const isInvalidTimeRange = startTime && endTime && endTime <= startTime;

  const summaryCards = useMemo(
    () => [
      {
        title: "Available Rooms",
        value: availableRoomsCount,
        icon: <FaDoorOpen />,
        helper: startTime && endTime ? "For selected time" : "Active now",
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
      availableRoomsCount,
      bookedTodayCount,
      myUpcomingBookingsCount,
      myPendingRequestsCount,
      selectedDate,
      startTime,
      endTime,
      user,
    ]
  );

  return (
    <section className="min-h-screen px-4 md:px-6 py-5 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-blue-600 mb-1.5">
            Meeting Rooms
          </p>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Find a Room
          </h1>

          <p className="text-slate-500 mt-1.5 max-w-2xl text-sm">
            Search and book available rooms for your office meetings.
          </p>
        </div>
                {/* Quick Summary */}
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

        {/* Booking Preferences */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Booking Preferences
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Select a meeting day and preferred office time slot.
              </p>
            </div>

            {(activeDayPreset || activeTimePreset) && (
              <div className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full w-fit">
                Preferences Applied
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FaCalendarAlt size={12} className="text-blue-500" />
                <p className="text-xs font-semibold text-slate-700">
                  Meeting Day
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <QuickPresetButton
                  label="Today"
                  active={activeDayPreset === "today"}
                  onClick={handleTodayPreset}
                />

                <QuickPresetButton
                  label="Tomorrow"
                  active={activeDayPreset === "tomorrow"}
                  onClick={handleTomorrowPreset}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <FaClock size={12} className="text-blue-500" />
                <p className="text-xs font-semibold text-slate-700">
                  Preferred Time Slot
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <QuickPresetButton
                  label="Morning"
                  time="10 AM - 12 PM"
                  active={activeTimePreset === "10-12"}
                  onClick={() => handleTimePreset("10:00", "12:00", "10-12")}
                />

                <QuickPresetButton
                  label="Midday"
                  time="12 PM - 2 PM"
                  active={activeTimePreset === "12-2"}
                  onClick={() => handleTimePreset("12:00", "14:00", "12-2")}
                />

                <QuickPresetButton
                  label="Afternoon"
                  time="2 PM - 5 PM"
                  active={activeTimePreset === "2-5"}
                  onClick={() => handleTimePreset("14:00", "17:00", "2-5")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            <DateSelector
              value={selectedDate}
              onChange={handleDateChange}
              label="Date"
            />

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1.5">
                <FaClock className="text-blue-500" size={12} />
                Start Time
              </label>

              <TimePickerWheel
                value={startTime}
                onChange={handleStartTimeChange}
                disabled={false}
                label="Select start time"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1.5">
                <FaClock className="text-blue-500" size={12} />
                End Time
              </label>

              <TimePickerWheel
                value={endTime}
                onChange={handleEndTimeChange}
                disabled={!startTime}
                label="Select end time"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1.5">
                <FaUsers className="text-blue-500" size={12} />
                Capacity
              </label>

              <select
                value={capacityFilter}
                onChange={(event) => setCapacityFilter(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Any Capacity</option>
                <option value="4">4+ people</option>
                <option value="6">6+ people</option>
                <option value="10">10+ people</option>
                <option value="15">15+ people</option>
                <option value="20">20+ people</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1.5">
                <FaSearch className="text-blue-500" size={12} />
                Search Room
              </label>

              <input
                type="text"
                placeholder="Room, floor, amenity..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={availabilityFilter}
                onChange={(event) => setAvailabilityFilter(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="available">Available Rooms</option>
                <option value="all">All Active Rooms</option>
                <option value="unavailable">
                  Unavailable for Selected Time
                </option>
              </select>

              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>

            {isInvalidTimeRange && (
              <p className="text-xs font-medium text-red-600">
                End time must be after start time.
              </p>
            )}
          </div>
        </div>


        {/* Rooms Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Available Rooms
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredRooms.length} room
              {filteredRooms.length !== 1 ? "s" : ""}
              {startTime && endTime
                ? ` for ${formatTime(startTime)} - ${formatTime(endTime)}`
                : ""}
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

        {/* Rooms */}
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
              Try changing your date, time, capacity, or search filter.
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

function QuickPresetButton({ label, time, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[92px] px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 text-left ${
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
          : "bg-white text-slate-700 border-gray-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50"
      }`}
    >
      <span className="block leading-tight">{label}</span>

      {time && (
        <span
          className={`block text-[10px] mt-0.5 ${
            active ? "text-blue-100" : "text-slate-400"
          }`}
        >
          {time}
        </span>
      )}
    </button>
  );
}

export default RoomsPage;