import { Link } from "react-router-dom";
import { FaUsers, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

function RoomCard({ room }) {
  const isRoomAvailable = room.status === "available" && room.isActive;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {room.name}
            </h3>

            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <FaMapMarkerAlt size={13} />
              <span>{room.location}</span>
            </div>
          </div>

          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full
              ${
                isRoomAvailable
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
          >
            {isRoomAvailable ? "Available" : "Unavailable"}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 leading-relaxed mb-4">
          {room.description}
        </p>

        {/* Capacity */}
        <div className="flex items-center gap-2 text-sm text-slate-700 mb-4">
          <FaUsers size={14} className="text-blue-500" />
          <span>
            Capacity: <strong>{room.capacity}</strong> people
          </span>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-5">
          {room.amenities.map((amenity, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-slate-600 px-2.5 py-1 rounded-full"
            >
              {amenity}
            </span>
          ))}
        </div>

        {/* Room Status Details */}
        <div className="flex items-center gap-2 text-sm mb-5">
          {isRoomAvailable ? (
            <>
              <FaCheckCircle className="text-green-500" size={14} />
              <span className="text-green-600">
                This room is ready for booking.
              </span>
            </>
          ) : (
            <>
              <FaTimesCircle className="text-red-500" size={14} />
              <span className="text-red-600">
                This room is currently not available.
              </span>
            </>
          )}
        </div>

        {/* Book Button */}
        {isRoomAvailable ? (
          <Link
            to={`/book/${room.id}`}
            className="block w-full text-center bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors duration-150"
          >
            Book Now
          </Link>
          
        ) : (
          <button
            disabled
            className="w-full bg-gray-100 text-gray-400 text-sm font-medium py-2.5 rounded-xl cursor-not-allowed"
          >
            Not Available
          </button>
        )}
      </div>
    </div>
  );
}

export default RoomCard;