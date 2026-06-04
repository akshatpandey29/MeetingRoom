import { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
} from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";

const SLOT_INTERVAL_MINUTES = 30;
const SCHEDULE_START_TIME = "00:00";
const SCHEDULE_END_TIME = "24:00";
const DEFAULT_EMPTY_SLOT_START = "09:00";
const SCHEDULE_MODES = [
  { key: "days", label: "Day" },
  { key: "weeks", label: "Week" },
  { key: "month", label: "Month" },
];

function RoomScheduleBoard({
  rooms,
  bookings,
  currentUser,
  selectedDate,
  onDateChange,
  fetchBookingsByRoomAndDate,
}) {
  const navigate = useNavigate();
  const [scheduleMode, setScheduleMode] = useState("days");
  const [isRangePickerOpen, setIsRangePickerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const rangePickerRef = useRef(null);

  const scheduleStartTime = useMemo(
    () => getScheduleStartTime(selectedDate, currentTime),
    [currentTime, selectedDate]
  );

  const timeSlots = useMemo(
    () =>
      createTimeSlots(
        scheduleStartTime,
        SCHEDULE_END_TIME,
        SLOT_INTERVAL_MINUTES
      ),
    [scheduleStartTime]
  );

  const visibleDates = useMemo(
    () => getVisibleDates(selectedDate, scheduleMode),
    [scheduleMode, selectedDate]
  );

  const currentTimeIndicator = useMemo(
    () => getCurrentTimeIndicator(currentTime, selectedDate, scheduleStartTime),
    [currentTime, scheduleStartTime, selectedDate]
  );

  const dateCards = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) =>
        addDaysToDateValue(selectedDate, index)
      ),
    [selectedDate]
  );

  const roomIds = useMemo(() => rooms.map((room) => room.id).join("|"), [rooms]);
  const visibleDateKey = visibleDates.join("|");

  useEffect(() => {
    if (!selectedDate || rooms.length === 0) return;

    rooms.forEach((room) => {
      visibleDates.forEach((dateValue) => {
        fetchBookingsByRoomAndDate(room.id, dateValue);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIds, visibleDateKey]);

  const scheduleBookings = bookings.filter(
    (booking) =>
      visibleDates.includes(booking.date) &&
      isCalendarVisibleBooking(booking) &&
      rooms.some((room) => String(room.id) === String(booking.roomId))
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        rangePickerRef.current &&
        !rangePickerRef.current.contains(event.target)
      ) {
        setIsRangePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsRangePickerOpen(false);
  }, [scheduleMode]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  function moveDate(direction) {
    const nextDate = getMovedDate(selectedDate, direction, scheduleMode);
    if (nextDate < getTodayDate()) return;
    onDateChange(nextDate);
  }

  function handlePickerChange(date) {
    if (!date) return;

    const nextDate =
      scheduleMode === "month"
        ? getSelectableMonthDate(date)
        : formatDateValue(date);

    if (nextDate < getTodayDate()) return;

    onDateChange(nextDate);
    setIsRangePickerOpen(false);
  }

  function handleSlotClick(room, dateValue, startTime = DEFAULT_EMPTY_SLOT_START) {
    const endTime = addMinutesToTime(startTime, SLOT_INTERVAL_MINUTES);
    const userConflict = getUserSlotConflict(
      scheduleBookings,
      currentUser,
      dateValue,
      startTime,
      endTime
    );

    if (isPastSlot(dateValue, startTime) || userConflict) return;

    navigate(`/book/${room.id}`, {
      state: {
        selectedDate: dateValue,
        startTime,
        endTime,
        openBookingForm: true,
      },
    });
  }

  function handleBookingClick(booking) {
    if (isPastBooking(booking)) return;

    if (!isCurrentUserBooking(booking, currentUser)) return;

    navigate("/mybookings", {
      state: {
        bookingId: booking.id || booking._id,
      },
    });
  }

  function handleMonthDateSelect(dateValue) {
    if (dateValue < getTodayDate()) return;

    const entryRoom =
      rooms.find((room) => room.status === "available" && room.isActive) ||
      rooms[0];

    if (!entryRoom?.id) return;

    navigate(`/book/${entryRoom.id}`, {
      state: {
        selectedDate: dateValue,
        startTime: "",
        endTime: "",
        openBookingForm: true,
      },
    });
  }

  return (
    <section className="room-schedule-board mb-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-10 sm:w-10">
            <FaCalendarAlt size={17} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Room Schedule
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Overview of room bookings for the selected date.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex w-full max-w-md rounded-xl bg-slate-100 p-1 sm:w-fit">
            {SCHEDULE_MODES.map((mode) => (
              <button
                type="button"
                key={mode.key}
                onClick={() => setScheduleMode(mode.key)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-bold transition sm:flex-none sm:px-4 ${
                  scheduleMode === mode.key
                    ? "bg-blue-100 text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <div className="flex w-full min-w-0 items-center justify-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => moveDate(-1)}
              disabled={selectedDate <= getTodayDate()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              aria-label="Previous calendar range"
            >
              <FaChevronLeft size={13} />
            </button>

            <div ref={rangePickerRef} className="relative min-w-0 flex-1 sm:flex-none">
              <button
                type="button"
                onClick={() =>
                  setIsRangePickerOpen((currentValue) => !currentValue)
                }
                className={`flex w-full min-w-0 items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition sm:w-auto sm:justify-between sm:px-4 ${
                  isRangePickerOpen
                    ? "border-blue-500 text-blue-700 ring-2 ring-blue-100"
                    : "border-gray-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                }`}
                aria-expanded={isRangePickerOpen}
                aria-label="Open calendar date picker"
              >
                <span className="truncate">
                  {getRangeLabel(selectedDate, scheduleMode, visibleDates)}
                </span>
                <FaChevronDown
                  size={11}
                  className={`shrink-0 transition-transform ${
                    isRangePickerOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isRangePickerOpen && (
                <div className="room-range-picker-popover fixed left-1/2 top-28 z-[80] max-h-[calc(100vh-9rem)] w-[calc(100vw-2rem)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)] sm:translate-x-0">
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {scheduleMode === "month"
                      ? "Select month"
                      : "Select date"}
                  </p>
                  <DatePicker
                    selected={parseDateValue(selectedDate)}
                    onChange={handlePickerChange}
                    inline
                    minDate={parseDateValue(getTodayDate())}
                    showMonthYearPicker={scheduleMode === "month"}
                  />
                  <p className="mt-2 px-1 text-xs text-slate-500">
                    {scheduleMode === "weeks"
                      ? "Pick any date to start the visible week."
                      : scheduleMode === "month"
                        ? "Pick a month to view all room bookings in that month."
                        : "Pick a date to view the day schedule."}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => moveDate(1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Next calendar range"
            >
              <FaChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {scheduleMode !== "month" && (
        <div className="border-b border-gray-100 bg-slate-50/60 px-3 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => moveDate(-1)}
              disabled={selectedDate <= getTodayDate()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-blue-100"
              aria-label="Previous date"
            >
              <FaChevronLeft size={13} />
            </button>

            <div className="room-date-strip flex flex-1 gap-2.5 overflow-x-auto pb-1">
              {dateCards.map((dateValue) => (
                <button
                  type="button"
                  key={dateValue}
                  onClick={() => onDateChange(dateValue)}
                  className={`min-w-[70px] rounded-xl border px-3 py-2.5 text-center transition sm:min-w-24 sm:px-4 ${
                    dateValue === selectedDate
                      ? "border-blue-200 bg-blue-100 text-blue-700"
                      : "border-gray-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  <span className="block text-xs font-semibold">
                    {formatDatePart(dateValue, "weekday")}
                  </span>
                  <span className="mt-0.5 block text-xl font-bold text-slate-950">
                    {formatDatePart(dateValue, "day")}
                  </span>
                  <span className="block text-xs font-semibold">
                    {formatDatePart(dateValue, "month")}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => moveDate(1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 transition hover:bg-blue-50"
              aria-label="Next date"
            >
              <FaChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      <div className="room-schedule-scroll overflow-x-auto">
        {scheduleMode === "days" ? (
        <div className="w-max min-w-full">
          <div
            className="grid border-b border-gray-200 bg-slate-50"
            style={{
              gridTemplateColumns: `var(--schedule-room-column) repeat(${timeSlots.length}, var(--schedule-time-column))`,
            }}
          >
            <div className="room-sticky-cell sticky left-0 z-40 border-r border-gray-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-800 sm:px-4">
              Rooms
            </div>
            {timeSlots.map((slot) => (
              <div
                key={slot}
                className="border-r border-gray-200 px-2 py-2.5 text-sm font-semibold leading-tight text-slate-700 last:border-r-0 sm:px-3"
              >
                {formatTime(slot)}
              </div>
            ))}
          </div>

          {rooms.map((room, roomIndex) => {
            const roomBookings = scheduleBookings.filter(
              (booking) =>
                String(booking.roomId) === String(room.id) &&
                booking.date === selectedDate
            );

            return (
              <div
                key={room.id}
                className="grid border-b border-gray-100 last:border-b-0"
                style={{
                  gridTemplateColumns: `var(--schedule-room-column) repeat(${timeSlots.length}, var(--schedule-time-column))`,
                }}
              >
                <div className="room-sticky-cell sticky left-0 z-40 border-r border-gray-200 bg-white px-3 py-3 sm:px-4 sm:py-4">
                  <p className="break-words text-sm font-bold text-slate-900">{room.name}</p>
                  <p className="mt-1 break-words text-xs font-medium text-slate-500">
                    {room.location}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400">
                    {room.capacity} people
                  </p>
                </div>

                <div
                  className="relative grid min-h-[88px]"
                  style={{
                    gridColumn: `2 / ${timeSlots.length + 2}`,
                    gridTemplateColumns: `repeat(${timeSlots.length}, var(--schedule-time-column))`,
                    gridTemplateRows: "88px",
                  }}
                >
                  {currentTimeIndicator && (
                    <div
                      className="room-current-time-marker pointer-events-none absolute inset-y-0 w-0.5 bg-red-500"
                      style={{ left: `${currentTimeIndicator.percent}%` }}
                      aria-hidden="true"
                    >
                      {roomIndex === 0 && (
                        <span className="absolute left-1 top-2 whitespace-nowrap rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                          {formatCurrentTimeLabel(currentTime)}
                        </span>
                      )}
                    </div>
                  )}

                  {timeSlots.map((slot, index) => {
                    const slotEndTime = addMinutesToTime(
                      slot,
                      SLOT_INTERVAL_MINUTES
                    );
                    const userConflict = getUserSlotConflict(
                      scheduleBookings,
                      currentUser,
                      selectedDate,
                      slot,
                      slotEndTime
                    );
                    const disabled =
                      isPastSlot(selectedDate, slot) || Boolean(userConflict);
                    const conflictRoom = userConflict
                      ? rooms.find(
                          (candidateRoom) =>
                            String(candidateRoom.id) ===
                            String(userConflict.roomId)
                        )
                      : null;

                    return (
                      <button
                        type="button"
                        key={`${room.id}-${slot}`}
                        onClick={() => handleSlotClick(room, selectedDate, slot)}
                        disabled={disabled}
                        className={`border-r border-gray-100 transition last:border-r-0 ${
                          disabled
                            ? "cursor-not-allowed bg-slate-50"
                            : "bg-white hover:bg-blue-50"
                        }`}
                        style={{ gridColumn: index + 1, gridRow: 1 }}
                        title={
                          userConflict
                            ? `You already have a booking in ${conflictRoom?.name || "another room"} at this time`
                            : disabled
                            ? "Past time"
                            : `Book ${room.name} at ${formatTime(slot)}`
                        }
                      />
                    );
                  })}

                  {roomBookings.map((booking) => {
                    const isMine = isCurrentUserBooking(booking, currentUser);
                    const canOpenBooking = isMine && !isPastBooking(booking);
                    const eventPosition = getBookingEventPosition(
                      booking,
                      timeSlots
                    );

                    if (!eventPosition) return null;

                    return (
                      <button
                        type="button"
                        key={booking.id}
                        onClick={() => {
                          if (canOpenBooking) {
                            handleBookingClick(booking);
                          }
                        }}
                        aria-disabled={!canOpenBooking}
                        className={`room-calendar-event absolute z-10 box-border overflow-hidden rounded-xl border border-white/70 px-2.5 py-1.5 text-left text-white shadow-sm transition ${
                          isMine ? "bg-blue-600" : "bg-slate-500"
                        } ${
                          canOpenBooking
                            ? "cursor-pointer hover:brightness-95"
                            : "cursor-default"
                        }`}
                        style={{
                          left: `${eventPosition.left}%`,
                          width: `${eventPosition.width}%`,
                          top: "0.375rem",
                          bottom: "0.375rem",
                        }}
                        title={
                          canOpenBooking
                            ? "Open in My Bookings"
                            : isPastBooking(booking)
                              ? "Past booking"
                              : "Other user's booking"
                        }
                      >
                        <span className="room-calendar-event-title block truncate text-xs font-bold">
                          {isMine ? "Your booking" : "Other booking"}
                        </span>
                        <span className="room-calendar-event-time mt-1 flex min-w-0 items-center gap-1 text-[11px] font-medium opacity-90">
                          <FaClock className="room-calendar-event-icon shrink-0" size={10} />
                          <span className="min-w-0 truncate">
                            {formatCompactTimeRange(
                              getBookingStartTime(booking),
                              getBookingEndTime(booking)
                            )}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        ) : scheduleMode === "month" ? (
          <MonthCalendarGrid
            selectedDate={selectedDate}
            rooms={rooms}
            scheduleBookings={scheduleBookings}
            currentUser={currentUser}
            onBookingClick={handleBookingClick}
            onDateSelect={handleMonthDateSelect}
          />
        ) : (
          <DateRangeGrid
            rooms={rooms}
            visibleDates={visibleDates}
            scheduleBookings={scheduleBookings}
            currentUser={currentUser}
            onSlotClick={handleSlotClick}
            onBookingClick={handleBookingClick}
          />
        )}
      </div>

      <style>
        {`
          .room-schedule-board {
            --schedule-room-column: 144px;
            --schedule-time-column: 64px;
            --schedule-date-column: 96px;
          }

          @media (min-width: 640px) {
            .room-schedule-board {
              --schedule-room-column: 220px;
              --schedule-time-column: 74px;
              --schedule-date-column: 132px;
            }
          }

          .room-date-strip {
            scrollbar-width: none;
          }

          .room-date-strip::-webkit-scrollbar {
            display: none;
          }

          .room-schedule-scroll {
            max-width: 100%;
            overflow-y: visible;
            position: relative;
            overscroll-behavior-x: contain;
            scrollbar-width: thin;
          }

          .room-sticky-cell {
            left: 0;
            overflow: hidden;
            position: sticky;
            transform: translateZ(0);
            width: var(--schedule-room-column);
            min-width: var(--schedule-room-column);
            max-width: var(--schedule-room-column);
            z-index: 40;
            box-shadow: 1px 0 0 #e5e7eb;
          }

          .room-current-time-marker {
            z-index: 30;
          }

          .room-calendar-event {
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.125rem;
          }

          .room-calendar-event-time {
            white-space: nowrap;
          }

          .room-range-picker-popover .react-datepicker {
            width: 100%;
            border: 0;
            font-family: inherit;
          }

          .room-range-picker-popover .react-datepicker__month-container {
            width: 100%;
            float: none;
          }

          .room-range-picker-popover .react-datepicker__header {
            border-bottom-color: #e5e7eb;
            background: #f8fafc;
          }

          .room-range-picker-popover .react-datepicker__month-wrapper {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .room-range-picker-popover .react-datepicker__month-text {
            width: auto;
            margin: 0.2rem;
            border-radius: 0.75rem;
            padding: 0.45rem 0.25rem;
          }

          .room-range-picker-popover .react-datepicker__day-name,
          .room-range-picker-popover .react-datepicker__day {
            width: 2rem;
            line-height: 2rem;
            margin: 0.08rem;
          }

          @media (max-width: 639px) {
            .room-schedule-board {
              --schedule-room-column: 176px;
              --schedule-time-column: 68px;
              --schedule-date-column: 112px;
            }

            .room-calendar-event {
              border-radius: 0.75rem;
              padding: 0.35rem 0.45rem;
              gap: 0.05rem;
            }

            .room-calendar-event-title {
              font-size: 0.68rem;
              line-height: 0.9rem;
            }

            .room-calendar-event-time {
              margin-top: 0.125rem;
              font-size: 0.62rem;
              line-height: 0.8rem;
            }

            .room-calendar-event-icon {
              display: none;
            }

            .room-range-picker-popover .react-datepicker__month-wrapper {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .room-range-picker-popover .react-datepicker__day-name,
            .room-range-picker-popover .react-datepicker__day {
              width: 1.9rem;
              line-height: 1.9rem;
            }

            .room-range-picker-popover .react-datepicker__current-month,
            .room-range-picker-popover .react-datepicker-year-header {
              font-size: 0.95rem;
            }
          }
        `}
      </style>
    </section>
  );
}

function DateRangeGrid({
  rooms,
  visibleDates,
  scheduleBookings,
  currentUser,
  onSlotClick,
  onBookingClick,
}) {
  return (
    <div className="w-max min-w-full">
      <div
        className="grid border-b border-gray-200 bg-slate-50"
        style={{
          gridTemplateColumns: `var(--schedule-room-column) repeat(${visibleDates.length}, var(--schedule-date-column))`,
        }}
      >
        <div className="room-sticky-cell sticky left-0 z-40 border-r border-gray-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-800 sm:px-4">
          Rooms
        </div>
        {visibleDates.map((dateValue) => (
          <div
            key={dateValue}
            className={`border-r border-gray-200 px-3 py-2.5 text-sm font-semibold last:border-r-0 ${
              dateValue === getTodayDate() ? "text-blue-700" : "text-slate-700"
            }`}
          >
            <span className="block truncate">
              {formatDatePart(dateValue, "weekday")}
            </span>
            <span className="block truncate text-xs font-medium text-slate-500">
              {formatDatePart(dateValue, "day")} {formatDatePart(dateValue, "month")}
            </span>
          </div>
        ))}
      </div>

      {rooms.map((room) => (
        <div
          key={room.id}
          className="grid border-b border-gray-100 last:border-b-0"
          style={{
            gridTemplateColumns: `var(--schedule-room-column) repeat(${visibleDates.length}, var(--schedule-date-column))`,
          }}
        >
          <div className="room-sticky-cell sticky left-0 z-40 border-r border-gray-200 bg-white px-3 py-3 sm:px-4 sm:py-4">
            <p className="break-words text-sm font-bold text-slate-900">{room.name}</p>
            <p className="mt-1 break-words text-xs font-medium text-slate-500">
              {room.location}
            </p>
            <p className="mt-1.5 text-xs text-slate-400">{room.capacity} people</p>
          </div>

          {visibleDates.map((dateValue) => {
            const dayBookings = scheduleBookings.filter(
              (booking) =>
                String(booking.roomId) === String(room.id) &&
                booking.date === dateValue
            );
            const slotEndTime = addMinutesToTime(
              DEFAULT_EMPTY_SLOT_START,
              SLOT_INTERVAL_MINUTES
            );
            const userConflict = getUserSlotConflict(
              scheduleBookings,
              currentUser,
              dateValue,
              DEFAULT_EMPTY_SLOT_START,
              slotEndTime
            );
            const disabled =
              isPastSlot(dateValue, DEFAULT_EMPTY_SLOT_START) ||
              Boolean(userConflict);
            const conflictRoom = userConflict
              ? rooms.find(
                  (candidateRoom) =>
                    String(candidateRoom.id) === String(userConflict.roomId)
                )
              : null;

            return (
              <div
                key={`${room.id}-${dateValue}`}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={() =>
                  !disabled &&
                  onSlotClick(room, dateValue, DEFAULT_EMPTY_SLOT_START)
                }
                onKeyDown={(event) => {
                  if (!disabled && (event.key === "Enter" || event.key === " ")) {
                    onSlotClick(room, dateValue, DEFAULT_EMPTY_SLOT_START);
                  }
                }}
                className={`min-h-24 border-r border-gray-100 p-1.5 last:border-r-0 ${
                  disabled
                    ? "cursor-not-allowed bg-slate-50"
                    : "cursor-pointer bg-white hover:bg-blue-50"
                }`}
                title={
                  userConflict
                    ? `You already have a booking in ${conflictRoom?.name || "another room"} at this time`
                    : disabled
                      ? "Past date"
                      : `Book ${room.name}`
                }
              >
                <div className="space-y-2">
                  {dayBookings.map((booking) => {
                    const isMine = isCurrentUserBooking(booking, currentUser);
                    const canOpenBooking = isMine && !isPastBooking(booking);

                    return (
                      <button
                        type="button"
                        key={booking.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (canOpenBooking) {
                            onBookingClick(booking);
                          }
                        }}
                        aria-disabled={!canOpenBooking}
                        className={`w-full rounded-lg px-2 py-1.5 text-left text-white shadow-sm transition ${
                          isMine ? "bg-blue-600" : "bg-slate-500"
                        } ${
                          canOpenBooking
                            ? "cursor-pointer hover:brightness-95"
                            : "cursor-default"
                        }`}
                        title={
                          canOpenBooking
                            ? "Open in My Bookings"
                            : isPastBooking(booking)
                              ? "Past booking"
                              : "Other user's booking"
                        }
                      >
                        <span className="block truncate text-xs font-bold">
                          {isMine ? "Your booking" : booking.bookedBy || "Booked"}
                        </span>
                        <span className="mt-1 block truncate text-[11px] font-medium opacity-90">
                          {formatTime(getBookingStartTime(booking))} -{" "}
                          {formatTime(getBookingEndTime(booking))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function MonthCalendarGrid({
  selectedDate,
  rooms,
  scheduleBookings,
  currentUser,
  onBookingClick,
  onDateSelect,
}) {
  const monthDates = getMonthCalendarDates(selectedDate);
  const selectedMonth = parseDateValue(selectedDate).getMonth();
  const roomById = new Map(rooms.map((room) => [String(room.id), room]));

  return (
    <div className="bg-white">
      <div className="grid min-w-[860px] grid-cols-7 border-b border-gray-200 bg-slate-50 lg:min-w-0">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
          <div
            key={weekday}
            className="border-r border-gray-200 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500 last:border-r-0"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid min-w-[860px] grid-cols-7 lg:min-w-0">
        {monthDates.map((dateValue) => {
          const date = parseDateValue(dateValue);
          const isCurrentMonth = date.getMonth() === selectedMonth;
          const isToday = dateValue === getTodayDate();
          const isSelectableDate = dateValue >= getTodayDate();
          const dayBookings = scheduleBookings.filter(
            (booking) => booking.date === dateValue
          );

          return (
            <div
              key={dateValue}
              role="button"
              tabIndex={isSelectableDate ? 0 : -1}
              onClick={() => {
                if (isSelectableDate) {
                  onDateSelect(dateValue);
                }
              }}
              onKeyDown={(event) => {
                if (
                  isSelectableDate &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  onDateSelect(dateValue);
                }
              }}
              className={`min-h-28 border-r border-b border-gray-100 p-1.5 last:border-r-0 ${
                isCurrentMonth ? "bg-white" : "bg-slate-50/70"
              } ${
                isSelectableDate
                  ? "cursor-pointer transition hover:bg-blue-50"
                  : "cursor-not-allowed"
              }`}
              title={
                isSelectableDate
                  ? "Open day calendar"
                  : "Past date"
              }
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isToday
                      ? "bg-blue-600 text-white"
                      : isCurrentMonth
                        ? "text-slate-800"
                        : "text-slate-300"
                  }`}
                >
                  {date.getDate()}
                </span>

                {dayBookings.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    {dayBookings.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayBookings.slice(0, 3).map((booking) => {
                  const isMine = isCurrentUserBooking(booking, currentUser);
                  const canOpenBooking = isMine && !isPastBooking(booking);
                  const room = roomById.get(String(booking.roomId));

                  return (
                    <button
                      type="button"
                      key={booking.id || booking._id}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (canOpenBooking) {
                          onBookingClick(booking);
                        }
                      }}
                      aria-disabled={!canOpenBooking}
                      className={`w-full rounded-lg px-2 py-1 text-left text-white shadow-sm transition ${
                        isMine ? "bg-blue-600" : "bg-slate-500"
                      } ${
                        canOpenBooking
                          ? "cursor-pointer hover:brightness-95"
                          : "cursor-default"
                      }`}
                      title={
                        canOpenBooking
                          ? "Open in My Bookings"
                          : isPastBooking(booking)
                            ? "Past booking"
                            : "Other user's booking"
                      }
                    >
                      <span className="block truncate text-[11px] font-bold">
                        {room?.name || booking.roomName || "Meeting room"}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] font-medium opacity-90">
                        {formatTime(getBookingStartTime(booking))} -{" "}
                        {formatTime(getBookingEndTime(booking))}
                      </span>
                    </button>
                  );
                })}

                {dayBookings.length > 3 && (
                  <div className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                    +{dayBookings.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function createTimeSlots(start, end, intervalMinutes) {
  const startMinutes = convertTimeToMinutes(start);
  const endMinutes = convertTimeToMinutes(end);
  const slots = [];

  for (
    let minutes = startMinutes;
    minutes < endMinutes;
    minutes += intervalMinutes
  ) {
    slots.push(minutesToTimeValue(minutes));
  }

  return slots;
}

function getScheduleStartTime(selectedDate, currentTime) {
  if (selectedDate !== getTodayDate()) return SCHEDULE_START_TIME;

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const roundedStart =
    Math.floor(currentMinutes / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;

  return minutesToTimeValue(
    Math.min(roundedStart, 24 * 60 - SLOT_INTERVAL_MINUTES)
  );
}

function getVisibleDates(selectedDate, scheduleMode) {
  if (scheduleMode === "month") {
    const selected = parseDateValue(selectedDate);
    const year = selected.getFullYear();
    const month = selected.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dates = [];

    for (
      let date = new Date(firstDay);
      date <= lastDay;
      date.setDate(date.getDate() + 1)
    ) {
      dates.push(formatDateValue(date));
    }

    return dates;
  }

  const daysToShow = scheduleMode === "weeks" ? 7 : 1;

  return Array.from({ length: daysToShow }, (_, index) =>
    addDaysToDateValue(selectedDate, index)
  );
}

function getMonthCalendarDates(selectedDate) {
  const selected = parseDateValue(selectedDate);
  const firstDay = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const lastDay = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
  const startDate = new Date(firstDay);
  const endDate = new Date(lastDay);
  const dates = [];

  startDate.setDate(startDate.getDate() - startDate.getDay());
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  for (
    let date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(formatDateValue(date));
  }

  return dates;
}

function getMovedDate(selectedDate, direction, scheduleMode) {
  if (scheduleMode === "month") {
    return addMonthsToDateValue(selectedDate, direction);
  }

  return addDaysToDateValue(selectedDate, scheduleMode === "weeks" ? 7 * direction : direction);
}

function getRangeLabel(selectedDate, scheduleMode, visibleDates) {
  if (scheduleMode === "days") {
    return parseDateValue(selectedDate).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (scheduleMode === "month") {
    return parseDateValue(selectedDate).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }

  return formatDateRange(visibleDates[0], visibleDates[visibleDates.length - 1]);
}

function getTodayDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateValue(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDaysToDateValue(dateValue, daysToAdd) {
  const date = parseDateValue(dateValue);
  date.setDate(date.getDate() + daysToAdd);

  return formatDateValue(date);
}

function addMonthsToDateValue(dateValue, monthsToAdd) {
  const date = parseDateValue(dateValue);
  date.setMonth(date.getMonth() + monthsToAdd, 1);

  const dateValueForMonth = formatDateValue(date);

  return dateValueForMonth < getTodayDate() ? getTodayDate() : dateValueForMonth;
}

function getSelectableMonthDate(date) {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthDateValue = formatDateValue(firstDayOfMonth);

  return monthDateValue < getTodayDate() ? getTodayDate() : monthDateValue;
}

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDatePart(dateValue, part) {
  const options = {
    weekday: { weekday: "short" },
    day: { day: "numeric" },
    month: { month: "short" },
  };

  return parseDateValue(dateValue).toLocaleDateString("en-IN", options[part]);
}

function formatCurrentTimeLabel(date) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const period = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function formatCompactTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return "";

  const start = getTimeParts(startTime);
  const end = getTimeParts(endTime);

  if (!start || !end) return "";

  const startLabel =
    start.period === end.period
      ? `${start.hour}:${start.minute}`
      : `${start.hour}:${start.minute} ${start.period}`;

  return `${startLabel} - ${end.hour}:${end.minute} ${end.period}`;
}

function getTimeParts(timeValue) {
  if (!timeValue) return null;

  const [hour, minute] = String(timeValue).split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return {
    hour: String(displayHour).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
    period,
  };
}

function formatDateRange(startDate, endDate) {
  const start = parseDateValue(startDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const end = parseDateValue(endDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${start} - ${end}`;
}

function minutesToTimeValue(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
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

function addMinutesToTime(timeValue, minutesToAdd) {
  const totalMinutes = convertTimeToMinutes(timeValue) + minutesToAdd;

  return minutesToTimeValue(Math.min(totalMinutes, 24 * 60 - 1));
}

function getCurrentTimeIndicator(currentTime, selectedDate, scheduleStartTime) {
  if (selectedDate !== getTodayDate()) return null;

  const scheduleStartMinutes = convertTimeToMinutes(scheduleStartTime);
  const scheduleEndMinutes = convertTimeToMinutes(SCHEDULE_END_TIME);
  const currentMinutes =
    currentTime.getHours() * 60 + currentTime.getMinutes();

  if (
    currentMinutes < scheduleStartMinutes ||
    currentMinutes > scheduleEndMinutes
  ) {
    return null;
  }

  return {
    percent:
      ((currentMinutes - scheduleStartMinutes) /
        (scheduleEndMinutes - scheduleStartMinutes)) *
      100,
  };
}

const HIDDEN_CALENDAR_STATUSES = new Set(["cancelled", "completed", "no-show"]);

function isCalendarVisibleBooking(booking) {
  return !HIDDEN_CALENDAR_STATUSES.has(
    String(booking?.status || "").toLowerCase()
  );
}

function isPastBooking(booking) {
  if (!booking?.date) return false;

  const today = getTodayDate();
  if (booking.date < today) return true;
  if (booking.date > today) return false;

  const bookingEndTime = getBookingEndTime(booking) || getBookingStartTime(booking);
  if (!bookingEndTime) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return convertTimeToMinutes(bookingEndTime) <= currentMinutes;
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

function isCurrentUserBooking(booking, currentUser) {
  const currentUserId = String(currentUser?.id || currentUser?._id || "");
  const bookingUserId = String(
    booking?.userId?._id || booking?.userId?.id || booking?.userId || ""
  );
  const currentUserEmail = String(currentUser?.email || "").toLowerCase();
  const bookingUserEmail = String(
    booking?.userEmail || booking?.userId?.email || ""
  ).toLowerCase();

  return (
    (currentUserId && bookingUserId === currentUserId) ||
    (currentUserEmail && bookingUserEmail === currentUserEmail)
  );
}

function isPastSlot(dateValue, startTime) {
  if (dateValue !== getTodayDate()) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return convertTimeToMinutes(startTime) <= currentMinutes;
}

function getUserSlotConflict(
  bookings,
  currentUser,
  dateValue,
  startTime,
  endTime
) {
  if (!currentUser || !dateValue || !startTime || !endTime) return null;

  return (
    bookings.find((booking) => {
      if (
        booking.date !== dateValue ||
        !isCurrentUserBooking(booking, currentUser)
      ) {
        return false;
      }

      const bookingStart = getBookingStartTime(booking);
      const bookingEnd = getBookingEndTime(booking);

      return hasTimeOverlap(startTime, endTime, bookingStart, bookingEnd);
    }) || null
  );
}

function hasTimeOverlap(startTime, endTime, existingStartTime, existingEndTime) {
  if (!startTime || !endTime || !existingStartTime || !existingEndTime) {
    return false;
  }

  return (
    convertTimeToMinutes(startTime) < convertTimeToMinutes(existingEndTime) &&
    convertTimeToMinutes(endTime) > convertTimeToMinutes(existingStartTime)
  );
}

function getBookingEventPosition(booking, timeSlots) {
  const start = getBookingStartTime(booking);
  const end = getBookingEndTime(booking);

  if (!start || !end) return null;

  const gridStartMinutes = convertTimeToMinutes(timeSlots[0]);
  const gridEndMinutes =
    convertTimeToMinutes(timeSlots[timeSlots.length - 1]) + SLOT_INTERVAL_MINUTES;
  const bookingStart = convertTimeToMinutes(start);
  const bookingEnd = convertTimeToMinutes(end);

  if (bookingEnd <= gridStartMinutes || bookingStart >= gridEndMinutes) {
    return null;
  }

  const clippedStart = Math.max(bookingStart, gridStartMinutes);
  const clippedEnd = Math.min(bookingEnd, gridEndMinutes);
  const visibleMinutes = clippedEnd - clippedStart;
  const gridMinutes = gridEndMinutes - gridStartMinutes;

  if (visibleMinutes <= 0 || gridMinutes <= 0) {
    return null;
  }

  const left = ((clippedStart - gridStartMinutes) / gridMinutes) * 100;
  const width = (visibleMinutes / gridMinutes) * 100;

  return {
    left: Math.max(0, Math.min(100, left)),
    width: Math.max(0.01, Math.min(100 - left, width)),
  };
}

export default RoomScheduleBoard;
