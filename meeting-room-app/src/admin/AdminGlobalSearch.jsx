import { useMemo, useState } from "react";
import {
  FaSearch,
  FaUsers,
  FaDoorOpen,
  FaCalendarAlt,
  FaTimes,
} from "react-icons/fa";
import { useRooms } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";

function AdminGlobalSearch({ setActiveSection, setBookingView }) {
  const { rooms, bookings } = useRooms();
  const { users } = useAuth();

  const [searchText, setSearchText] = useState("");

  const searchResults = useMemo(() => {
    const value = searchText.trim().toLowerCase();

    if (!value) return [];

    const userResults = users
      .filter((currentUser) => {
        return (
          currentUser.name.toLowerCase().includes(value) ||
          currentUser.email.toLowerCase().includes(value) ||
          currentUser.role.toLowerCase().includes(value) ||
          currentUser.status.toLowerCase().includes(value)
        );
      })
      .map((currentUser) => ({
        id: `user-${currentUser.id}`,
        type: "User",
        title: currentUser.name,
        subtitle: `${currentUser.email} • ${currentUser.role} • ${currentUser.status}`,
        section: "users",
        icon: <FaUsers size={13} />,
      }));

    const roomResults = rooms
      .filter((room) => {
        return (
          room.name.toLowerCase().includes(value) ||
          room.location.toLowerCase().includes(value) ||
          room.status.toLowerCase().includes(value) ||
          String(room.capacity).includes(value) ||
          (room.isActive ? "active" : "inactive").includes(value)
        );
      })
      .map((room) => ({
        id: `room-${room.id}`,
        type: "Room",
        title: room.name,
        subtitle: `${room.location} • ${room.capacity} people • ${
          room.isActive ? "Active" : "Inactive"
        }`,
        section: "rooms",
        icon: <FaDoorOpen size={13} />,
      }));

    const bookingResults = bookings
      .filter((booking) => {
        return (
          booking.roomName.toLowerCase().includes(value) ||
          booking.date.toLowerCase().includes(value) ||
          booking.slot.toLowerCase().includes(value) ||
          (booking.bookedBy || "").toLowerCase().includes(value) ||
          (booking.userEmail || "").toLowerCase().includes(value)
        );
      })
      .map((booking) => ({
        id: `booking-${booking.id}`,
        type: "Booking",
        title: booking.roomName,
        subtitle: `${booking.date} • ${booking.slot} • ${
          booking.bookedBy || "Unknown"
        }`,
        section: "bookings",
        icon: <FaCalendarAlt size={13} />,
      }));

    return [...userResults, ...roomResults, ...bookingResults].slice(0, 8);
  }, [searchText, users, rooms, bookings]);

  const handleResultClick = (result) => {
    setActiveSection(result.section);

    if (result.section === "bookings") {
      setBookingView("list");
    }

    setSearchText("");
  };

  return (
    <div className="relative w-full xl:max-w-xl">
      <div className="relative">
        <FaSearch
          size={14}
          className="absolute left-4 top-3.5 text-slate-400"
        />

        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search users, rooms, bookings..."
          className="w-full pl-11 pr-11 py-3 bg-white border border-gray-300 rounded-2xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        />

        {searchText && (
          <button
            type="button"
            onClick={() => setSearchText("")}
            className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-700"
          >
            <FaTimes size={13} />
          </button>
        )}
      </div>

      {searchText && (
        <div className="absolute left-0 right-0 top-[54px] bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-50">
          {searchResults.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="mt-1 w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    {result.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {result.title}
                      </h4>

                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-slate-500">
                        {result.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      {result.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-5 text-center">
              <p className="text-sm font-medium text-slate-700">
                No results found
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Try searching by user name, room name, date, email, role, or
                status.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminGlobalSearch;