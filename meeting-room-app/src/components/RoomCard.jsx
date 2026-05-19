import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaTimesCircle,
  FaUsers,
} from "react-icons/fa";

function RoomCard({
  room,
  viewMode = "grid",
  selectedDate,
  startTime,
  endTime,
  nextAvailableSlot,
  isAvailableForSelectedTime,
  slotStatus,
}) {
  const isRoomActiveAndAvailable = room.status === "available" && room.isActive;
  const fallbackCanBook =
    isRoomActiveAndAvailable && isAvailableForSelectedTime && startTime && endTime;

  const resolvedSlotStatus =
    slotStatus ||
    {
      type: fallbackCanBook ? "free" : "needs-time",
      label: fallbackCanBook ? "Free for selected time" : "Select a time",
      helper: fallbackCanBook
        ? "This room is available for your selected slot."
        : "Select start and end time to check this room.",
      selectedSlotText:
        startTime && endTime
          ? `${formatTime(startTime)} - ${formatTime(endTime)}`
          : "No time selected",
      nextAvailableSlot,
      canBook: Boolean(fallbackCanBook),
    };

  const canOpenBooking =
    isRoomActiveAndAvailable &&
    !["booked", "invalid", "unavailable"].includes(resolvedSlotStatus.type);
  const selectedTimeText =
    resolvedSlotStatus.selectedSlotText ||
    (startTime && endTime
      ? `${formatTime(startTime)} - ${formatTime(endTime)}`
      : "No time selected");

  const scheduleLink = {
    pathname: `/book/${room.id}`,
    hash: "#calendar",
  };

  const bookingLink = `/book/${room.id}`;
  const bookingState = {
    selectedDate,
    startTime,
    endTime,
    openBookingForm: true,
  };

  if (viewMode === "list") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 p-3.5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:items-center">
          <div className="lg:col-span-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {room.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <FaMapMarkerAlt size={11} />
                  <span>{room.location}</span>
                </div>
              </div>

              <StatusBadge status={resolvedSlotStatus.type} />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              <FaUsers size={12} className="text-blue-500" />
              <span>
                <strong>{room.capacity}</strong> people
              </span>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {room.amenities.slice(0, 4).map((amenity, index) => (
                <span
                  key={index}
                  className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                >
                  {amenity}
                </span>
              ))}

              {room.amenities.length > 4 && (
                <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  +{room.amenities.length - 4}
                </span>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-start gap-1.5 text-xs text-slate-600">
              <FaClock size={12} className="text-blue-500 mt-0.5" />

              <div>
                <p className="font-medium text-slate-700">
                  {resolvedSlotStatus.label}
                </p>
                <p className="text-[11px] text-slate-500">
                  {selectedTimeText}
                </p>
                <p className="text-[11px] text-slate-400">
                  Next: {resolvedSlotStatus.nextAvailableSlot || nextAvailableSlot}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 gap-1.5 lg:justify-end">
            <Link
              to={scheduleLink}
              state={{
                openCalendar: true,
                selectedDate,
                startTime,
                endTime,
              }}
              className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              title="View schedule"
            >
              <FaEye size={11} />
              <span className="truncate">Calendar</span>
            </Link>

            {canOpenBooking ? (
              <Link
                to={bookingLink}
                state={bookingState}
                className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700"
                title="Book room"
              >
                <FaCalendarAlt size={11} />
                <span className="truncate">Book Room</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="flex min-w-0 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-2 py-2 text-[11px] font-semibold text-gray-400"
              >
                <FaCalendarAlt size={11} />
                <span className="truncate">{getBookButtonLabel(resolvedSlotStatus.type)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 leading-tight">
              {room.name}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <FaMapMarkerAlt size={11} />
              <span>{room.location}</span>
            </div>
          </div>

          <StatusBadge status={resolvedSlotStatus.type} />
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
          {room.description}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-slate-700 mb-3">
          <FaUsers size={12} className="text-blue-500" />

          <span>
            Capacity: <strong>{room.capacity}</strong> people
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {room.amenities.slice(0, 4).map((amenity, index) => (
            <span
              key={index}
              className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
            >
              {amenity}
            </span>
          ))}

          {room.amenities.length > 4 && (
            <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              +{room.amenities.length - 4} more
            </span>
          )}
        </div>

        <div
          className={`${getAvailabilityPanelClass(
            resolvedSlotStatus.type
          )} border rounded-lg p-3 mb-3`}
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-700 mb-1">
            <FaClock size={11} className="text-blue-500" />
            <span className="font-semibold">{resolvedSlotStatus.label}</span>
          </div>

          <p className="text-xs font-medium text-slate-700">
            {selectedTimeText}
          </p>

          <p className="text-[11px] text-slate-500 mt-0.5">
            {resolvedSlotStatus.helper}
          </p>

          <p className="text-[11px] text-slate-400 mt-1">
            Next free: {resolvedSlotStatus.nextAvailableSlot || nextAvailableSlot}
          </p>
        </div>

        <AvailabilityLine status={resolvedSlotStatus.type} />

        <div className="grid grid-cols-2 gap-2">
          <Link
            to={scheduleLink}
            state={{
              openCalendar: true,
              selectedDate,
              startTime,
              endTime,
            }}
            className="flex items-center justify-center gap-1.5 text-center bg-slate-100 text-slate-700 text-xs font-semibold py-2 rounded-lg hover:bg-slate-200 transition-colors duration-150"
          >
            <FaEye size={11} />
            View Calendar
          </Link>

          {canOpenBooking ? (
            <Link
              to={bookingLink}
              state={bookingState}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-center text-xs font-semibold text-white transition-colors duration-150 hover:bg-blue-700"
            >
              <FaCalendarAlt size={11} />
              Book Room
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-gray-100 py-2 text-center text-xs font-semibold text-gray-400"
            >
              <FaCalendarAlt size={11} />
              {getBookButtonLabel(resolvedSlotStatus.type)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
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

function getAvailabilityPanelClass(status) {
  const statusClasses = {
    free: "bg-green-50 border-green-100",
    booked: "bg-red-50 border-red-100",
    invalid: "bg-amber-50 border-amber-100",
    unavailable: "bg-slate-50 border-slate-100",
    "needs-time": "bg-blue-50 border-blue-100",
  };

  return statusClasses[status] || statusClasses.unavailable;
}

function getBookButtonLabel(status) {
  const labels = {
    booked: "Booked",
    invalid: "Fix Time",
    unavailable: "Unavailable",
    "needs-time": "Pick Time",
  };

  return labels[status] || "Unavailable";
}

function AvailabilityLine({ status }) {
  const lineContent = {
    free: {
      icon: <FaCheckCircle className="text-green-500" size={12} />,
      text: "Slot is free. You can book it now.",
      className: "text-green-600",
    },
    booked: {
      icon: <FaTimesCircle className="text-red-500" size={12} />,
      text: "Slot is already booked.",
      className: "text-red-600",
    },
    invalid: {
      icon: <FaInfoCircle className="text-amber-500" size={12} />,
      text: "Choose an end time after the start time.",
      className: "text-amber-600",
    },
    unavailable: {
      icon: <FaTimesCircle className="text-slate-400" size={12} />,
      text: "Room is not open for booking right now.",
      className: "text-slate-500",
    },
    "needs-time": {
      icon: <FaInfoCircle className="text-blue-500" size={12} />,
      text: "Pick start and end time to check availability.",
      className: "text-blue-600",
    },
  };

  const selectedLine = lineContent[status] || lineContent.unavailable;

  return (
    <div className="flex items-center gap-1.5 text-xs mb-4">
      {selectedLine.icon}
      <span className={`${selectedLine.className} font-medium`}>
        {selectedLine.text}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const badgeContent = {
    free: {
      label: "Free",
      className: "bg-green-50 text-green-700",
    },
    booked: {
      label: "Booked",
      className: "bg-red-50 text-red-700",
    },
    invalid: {
      label: "Check time",
      className: "bg-amber-50 text-amber-700",
    },
    unavailable: {
      label: "Unavailable",
      className: "bg-slate-100 text-slate-600",
    },
    "needs-time": {
      label: "Select time",
      className: "bg-blue-50 text-blue-700",
    },
  };

  const selectedBadge = badgeContent[status] || badgeContent.unavailable;

  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${selectedBadge.className}`}
    >
      {selectedBadge.label}
    </span>
  );
}

export default RoomCard;
