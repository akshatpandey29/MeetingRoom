import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaEye,
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
}) {
  const isRoomActiveAndAvailable = room.status === "available" && room.isActive;
  const canBook = isRoomActiveAndAvailable && isAvailableForSelectedTime;

  const selectedTimeText =
    startTime && endTime
      ? `${formatTime(startTime)} - ${formatTime(endTime)}`
      : "No time selected";

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

  const scheduleLink = {
    pathname: `/book/${room.id}`,
    hash: "#calendar",
  };

  const bookRoomLink = {
    pathname: `/book/${room.id}`,
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

              <StatusBadge canBook={canBook} />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              <FaUsers size={12} className="text-blue-500" />
              <span>
                <strong>{room.capacity}</strong> people
              </span>
            </div>
          </div>

          <div className="lg:col-span-3">
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

          <div className="lg:col-span-2">
            <div className="flex items-start gap-1.5 text-xs text-slate-600">
              <FaClock size={12} className="text-blue-500 mt-0.5" />

              <div>
                <p className="font-medium text-slate-700">Next Slot</p>
                <p className="text-[11px] text-slate-500">
                  {nextAvailableSlot}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col sm:flex-row lg:justify-end gap-2">
            <Link
              to={scheduleLink}
              state={{
                openCalendar: true,
                selectedDate,
                startTime,
                endTime,
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <FaEye size={11} />
               Schedule
            </Link>

            {canBook ? (
              <Link
                to={bookRoomLink}
                state={{
                  openCalendar: false,
                  resetBookingForm: true,
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaCalendarAlt size={11} />
                Book 
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
              >
                Unavailable
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

          <StatusBadge canBook={canBook} />
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

        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 mb-1">
            <FaClock size={11} className="text-blue-500" />
            <span className="font-semibold">Availability</span>
          </div>

          <p className="text-xs text-slate-600">{nextAvailableSlot}</p>

          <p className="text-[11px] text-slate-400 mt-0.5">
            Selected: {selectedTimeText}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs mb-4">
          {canBook ? (
            <>
              <FaCheckCircle className="text-green-500" size={12} />
              <span className="text-green-600 font-medium">
                Available for selected time
              </span>
            </>
          ) : (
            <>
              <FaTimesCircle className="text-red-500" size={12} />
              <span className="text-red-600 font-medium">
                Not available for selected time
              </span>
            </>
          )}
        </div>

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
             View Schedule
          </Link>

          {canBook ? (
            <Link
              to={bookRoomLink}
              state={{
                openCalendar: false,
                resetBookingForm: true,
              }}
              className="flex items-center justify-center gap-1.5 text-center bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors duration-150"
            >
              <FaCalendarAlt size={11} />
               Book Room
            </Link>
          ) : (
            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 text-xs font-semibold py-2 rounded-lg cursor-not-allowed"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ canBook }) {
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
        canBook ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
    >
      {canBook ? "Available" : "Unavailable"}
    </span>
  );
}

export default RoomCard;