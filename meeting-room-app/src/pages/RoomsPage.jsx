import { useState } from "react";
import RoomCard from "../components/RoomCard";
import { useRooms } from "../context/RoomContext";

function RoomsPage() {
  const { rooms } = useRooms();

  const [searchText, setSearchText] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchText.toLowerCase()) ||
      room.location.toLowerCase().includes(searchText.toLowerCase());

    const matchesAvailability =
      availabilityFilter === "all" || room.status === availabilityFilter;

    return room.isActive && matchesSearch && matchesAvailability;
  });

  return (
    <section className="min-h-screen px-4 md:px-6 py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
  <p className="text-sm font-medium text-blue-600 mb-2">
    Meeting Rooms
  </p>
  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
    Book a Meeting Room
  </h1>
  <p className="text-slate-500 mt-2 max-w-2xl text-sm md:text-base">
    Choose a meeting room based on capacity, location, and availability.
  </p>
</div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-5 mb-6 md:mb-8">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search Room
              </label>

              <input
                type="text"
                placeholder="Search by room name or location..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Availability
              </label>

              <select
                value={availabilityFilter}
                onChange={(event) => setAvailabilityFilter(event.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Active Rooms</option>
                <option value="available">Available Rooms</option>
                <option value="booked">Booked Rooms</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 md:mb-5">
  <h2 className="text-lg md:text-xl font-semibold text-slate-900">
    Active Meeting Rooms
  </h2>
  <p className="text-xs md:text-sm text-slate-500">
    Showing {filteredRooms.length} room
    {filteredRooms.length !== 1 ? "s" : ""}
  </p>
</div>

        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-10 text-center">
  <h3 className="text-lg font-semibold text-slate-800 mb-2">
    No rooms found
  </h3>
  <p className="text-slate-500 text-sm">
    Try changing your search text or availability filter.
  </p>
</div>
        )}
      </div>
    </section>
  );
}

export default RoomsPage;