import { useMemo, useState } from "react";
import {
  FaSearch,
  FaUsers,
  FaDoorOpen,
  FaCalendarAlt,
  FaTimes,
  FaBell,
} from "react-icons/fa";
import { useRooms } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";

function AdminGlobalSearch({ setActiveSection, setBookingView }) {
  const { rooms, bookings, adminRequests } = useRooms();
  const { users } = useAuth();

  const [searchText, setSearchText] = useState("");

  const safeLower = (value) => String(value || "").toLowerCase();

  const searchResults = useMemo(() => {
    const value = searchText.trim().toLowerCase();

    if (!value) return [];

    const userResults = users
      .filter((currentUser) => {
        return (
          safeLower(currentUser.name).includes(value) ||
          safeLower(currentUser.email).includes(value) ||
          safeLower(currentUser.role).includes(value) ||
          safeLower(currentUser.status).includes(value)
        );
      })
      .map((currentUser) => ({
        id: `user-${currentUser.id}`,
        type: "User",
        title: currentUser.name,
        subtitle: `${currentUser.email} • ${currentUser.role} • ${
          currentUser.status || "active"
        }`,
        section: "users",
        icon: <FaUsers size={13} />,
      }));

    const roomResults = rooms
      .filter((room) => {
        return (
          safeLower(room.name).includes(value) ||
          safeLower(room.location).includes(value) ||
          safeLower(room.status).includes(value) ||
          String(room.capacity || "").includes(value) ||
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
          safeLower(booking.roomName).includes(value) ||
          safeLower(booking.date).includes(value) ||
          safeLower(booking.slot).includes(value) ||
          safeLower(booking.bookedBy).includes(value) ||
          safeLower(booking.userEmail).includes(value)
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

    const requestResults = adminRequests
      .filter((request) => {
        return (
          safeLower(request.roomName).includes(value) ||
          safeLower(request.date).includes(value) ||
          safeLower(request.slot).includes(value) ||
          safeLower(request.requestedBy).includes(value) ||
          safeLower(request.bookedBy).includes(value) ||
          safeLower(request.userEmail).includes(value) ||
          safeLower(request.status).includes(value)
        );
      })
      .map((request) => ({
        id: `request-${request.id}`,
        type: "Request",
        title: request.roomName,
        subtitle: `${request.date} • ${request.slot} • ${
          request.requestedBy || request.bookedBy || "User"
        } • ${request.status}`,
        section: "requests",
        icon: <FaBell size={13} />,
      }));

    return [
      ...userResults,
      ...roomResults,
      ...bookingResults,
      ...requestResults,
    ].slice(0, 10);
  }, [searchText, users, rooms, bookings, adminRequests]);

  const handleResultClick = (result) => {
    setActiveSection(result.section);

    if (result.section === "bookings" && typeof setBookingView === "function") {
      setBookingView("list");
    }

    setSearchText("");
  };

  return (
    <div className="relative w-full xl:max-w-xl">
      <div className="relative">
        <FaSearch
          size={14}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search users, rooms, bookings, requests..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {searchText && (
          <button
            type="button"
            onClick={() => setSearchText("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            <FaTimes size={13} />
          </button>
        )}
      </div>

      {searchText && (
        <div className="absolute left-0 right-0 top-[56px] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {searchResults.length > 0 ? (
            <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleResultClick(result)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {result.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-slate-900">
                        {result.title}
                      </h4>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        {result.type}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {result.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No results found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try searching by user, room, email, date, status, or request.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminGlobalSearch;