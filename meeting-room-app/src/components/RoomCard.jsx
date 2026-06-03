import { Link } from "react-router-dom";
import {
  FaBell,
  FaCalendarAlt,
  FaClock,
  FaEye,
  FaMapMarkerAlt,
  FaUsers,
} from "react-icons/fa";

const FALLBACK_ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1560439514-4e9645039924?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=900&q=80",
];

const BUILT_IN_ROOM_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 360'%3E%3Cdefs%3E%3ClinearGradient id='wall' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23eef5ff'/%3E%3Cstop offset='1' stop-color='%23dbe7f6'/%3E%3C/linearGradient%3E%3ClinearGradient id='table' x1='0' y1='0' x2='1' y2='0'%3E%3Cstop stop-color='%2397a8bd'/%3E%3Cstop offset='1' stop-color='%235e718a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='900' height='360' fill='url(%23wall)'/%3E%3Crect x='0' y='250' width='900' height='110' fill='%23c9d6e5'/%3E%3Crect x='92' y='66' width='210' height='118' rx='8' fill='%23ffffff' opacity='.82'/%3E%3Crect x='114' y='88' width='166' height='74' rx='5' fill='%23d7e3f2'/%3E%3Crect x='610' y='54' width='188' height='132' rx='10' fill='%23ffffff' opacity='.78'/%3E%3Cpath d='M627 70h154v102H627z' fill='%23c8d7ea'/%3E%3Cpath d='M627 70l154 102M781 70L627 172' stroke='%23edf4fb' stroke-width='5'/%3E%3Cellipse cx='450' cy='262' rx='230' ry='45' fill='%23879ab2' opacity='.28'/%3E%3Cpath d='M260 214h380l72 86H188z' fill='url(%23table)'/%3E%3Cpath d='M250 214h400l-44-34H294z' fill='%23b6c4d4'/%3E%3Crect x='304' y='178' width='70' height='31' rx='12' fill='%234e6074'/%3E%3Crect x='424' y='170' width='84' height='36' rx='13' fill='%234e6074'/%3E%3Crect x='560' y='178' width='70' height='31' rx='12' fill='%234e6074'/%3E%3Crect x='214' y='245' width='56' height='64' rx='17' fill='%233f5064'/%3E%3Crect x='676' y='245' width='56' height='64' rx='17' fill='%233f5064'/%3E%3Ccircle cx='452' cy='212' r='12' fill='%23ffffff' opacity='.9'/%3E%3C/svg%3E";

function RoomCard({
  room,
  viewMode = "grid",
  selectedDate,
  startTime,
  endTime,
  nextAvailableSlot,
  isAvailableForSelectedTime,
  slotStatus,
  imageIndex = 0,
}) {
  const isRoomActiveAndAvailable = room.status === "available" && room.isActive;
  const fallbackCanBook =
    isRoomActiveAndAvailable && isAvailableForSelectedTime && startTime && endTime;

  const resolvedSlotStatus =
    slotStatus ||
    {
      type: fallbackCanBook ? "free" : "needs-time",
      label: fallbackCanBook ? "Available" : "Select a time",
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
    isRoomActiveAndAvailable && Boolean(resolvedSlotStatus.canBook);
  const canRequestAdmin = resolvedSlotStatus.type === "booked";
  const fallbackRoomImageUrl = getRoomImageUrl(room, imageIndex);
  const roomImageUrl = room.imageUrl || fallbackRoomImageUrl;
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
  const requestAdminState = {
    ...bookingState,
    requestAdmin: true,
  };

  if (viewMode === "list") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 p-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 lg:items-center">
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
                {resolvedSlotStatus.type === "user-conflict" ? (
                  <>
                    <p className="text-[11px] font-semibold text-amber-700">
                      {resolvedSlotStatus.helper}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {resolvedSlotStatus.conflictDetail}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-500">
                      {selectedTimeText}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Next: {resolvedSlotStatus.nextAvailableSlot || nextAvailableSlot}
                    </p>
                  </>
                )}
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
              className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              title="View schedule"
            >
              <FaEye size={11} />
              <span className="truncate">Calendar</span>
            </Link>

            {canOpenBooking ? (
              <Link
                to={bookingLink}
                state={bookingState}
                className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700"
                title="Book room"
              >
                <FaCalendarAlt size={11} />
                <span className="truncate">Book Room</span>
              </Link>
            ) : canRequestAdmin ? (
              <Link
                to={bookingLink}
                state={requestAdminState}
                className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                title="Request admin approval"
              >
                <FaBell size={11} />
                <span className="truncate">Request Admin</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="flex min-w-0 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1.5 text-[11px] font-semibold text-gray-400"
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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md">
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50">
        <img
          src={roomImageUrl}
          alt={`${room.name} meeting room`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            const image = event.currentTarget;

            if (!image.dataset.fallbackApplied) {
              image.dataset.fallbackApplied = "true";
              image.src = fallbackRoomImageUrl;
              return;
            }

            image.src = BUILT_IN_ROOM_IMAGE;
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/30 to-transparent" />
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3 mb-2.5">
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

        <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">
          {room.description}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-slate-700 mb-2">
          <FaUsers size={12} className="text-blue-500" />

          <span>
            Capacity: <strong>{room.capacity}</strong> people
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
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

        {resolvedSlotStatus.type === "user-conflict" ? (
          <div className="mb-2.5 rounded-lg border border-amber-200 bg-amber-50 p-2.5 shadow-[inset_3px_0_0_#f59e0b]">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-amber-800">
              <FaBell size={11} className="text-amber-600" />
              <span className="font-bold">{resolvedSlotStatus.label}</span>
            </div>

            <p className="text-[11px] font-semibold text-amber-900">
              {resolvedSlotStatus.helper}
            </p>

            <p className="mt-1 text-[11px] leading-4 text-amber-800">
              {resolvedSlotStatus.conflictDetail}
            </p>
          </div>
        ) : (
          <div
            className={`${getAvailabilityPanelClass(
              resolvedSlotStatus.type
            )} border rounded-lg p-2.5 mb-2.5`}
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
        )}

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
          ) : canRequestAdmin ? (
            <Link
              to={bookingLink}
              state={requestAdminState}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-50 py-2 text-center text-xs font-semibold text-amber-700 transition-colors duration-150 hover:bg-amber-100"
            >
              <FaBell size={11} />
              Request Admin
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

function getRoomImageUrl(room, imageIndex = 0) {
  const roomName = room?.name || "room";
  const numericIndex = Number.isFinite(imageIndex)
    ? imageIndex
    : Math.abs(hashString(roomName));

  return FALLBACK_ROOM_IMAGES[numericIndex % FALLBACK_ROOM_IMAGES.length];
}

function hashString(value) {
  return String(value).split("").reduce((hash, character) => {
    return hash + character.charCodeAt(0);
  }, 0);
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
    "booked-by-you": "bg-blue-50 border-blue-100",
    "user-conflict": "bg-amber-50 border-amber-200",
    invalid: "bg-amber-50 border-amber-100",
    unavailable: "bg-slate-50 border-slate-100",
    "needs-time": "bg-blue-50 border-blue-100",
  };

  return statusClasses[status] || statusClasses.unavailable;
}

function getBookButtonLabel(status) {
  const labels = {
    booked: "Booked",
    "booked-by-you": "Booked by you",
    "user-conflict": "Cannot book",
    invalid: "Fix Time",
    unavailable: "Unavailable",
    "needs-time": "Pick Time",
  };

  return labels[status] || "Unavailable";
}

function StatusBadge({ status }) {
  const badgeContent = {
    free: {
      label: "Available",
      className: "bg-green-50 text-green-700",
    },
    booked: {
      label: "Booked",
      className: "bg-red-50 text-red-700",
    },
    "booked-by-you": {
      label: "Booked by you",
      className: "bg-blue-50 text-blue-700",
    },
    "user-conflict": {
      label: "Cannot book",
      className: "bg-amber-50 text-amber-700",
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
      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${selectedBadge.className}`}
    >
      {selectedBadge.label}
    </span>
  );
}

export default RoomCard;
