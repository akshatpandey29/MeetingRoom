import { createContext, useContext, useState, useEffect } from "react";

const RoomContext = createContext();

const initialRooms = [
  {
    id: 1,
    name: "Conference Room A",
    location: "First Floor",
    capacity: 10,
    status: "available",
    isActive: true,
    description: "Best for team meetings, client calls, and daily standups.",
    amenities: ["Projector", "Whiteboard", "Wi-Fi"],
  },
  {
    id: 2,
    name: "Board Room",
    location: "Second Floor",
    capacity: 20,
    status: "available",
    isActive: true,
    description: "Large meeting room for board meetings and presentations.",
    amenities: ["Projector", "AC", "Video Conference"],
  },
  {
    id: 3,
    name: "Discussion Room",
    location: "Ground Floor",
    capacity: 6,
    status: "available",
    isActive: true,
    description: "Small room for quick discussions and interview rounds.",
    amenities: ["Whiteboard", "Wi-Fi"],
  },
];

const defaultSlots = [
  "11:30 - 12:28",
  "08:10 - 08:59",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 01:00",
  "02:00 - 03:00",
  "03:00 - 04:00",
  "04:00 - 05:00",
];

const createActionLog = (action, by = "System") => ({
  action,
  by,
  at: new Date().toISOString(),
});

export function RoomProvider({ children }) {
  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem('rooms');
    return saved ? JSON.parse(saved) : initialRooms;
  });

  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [adminRequests, setAdminRequests] = useState(() => {
    const saved = localStorage.getItem('adminRequests');
    return saved ? JSON.parse(saved) : [];
  });

  const [slots] = useState(defaultSlots);

  useEffect(() => {
    localStorage.setItem('rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('adminRequests', JSON.stringify(adminRequests));
  }, [adminRequests]);

  const addRoom = (roomData) => {
    const newRoom = { id: Date.now(), ...roomData };
    setRooms((prev) => [...prev, newRoom]);
  };

  const updateRoom = (roomId, updatedRoomData) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId ? { ...room, ...updatedRoomData } : room
      )
    );
  };

  const deleteRoom = (roomId) => {
    setRooms((prev) => prev.filter((room) => room.id !== roomId));
    setBookings((prev) => prev.filter((booking) => booking.roomId !== roomId));
  };

  const toggleRoomActive = (roomId) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId ? { ...room, isActive: !room.isActive } : room
      )
    );
  };

  const getRoomById = (roomId) => {
    return rooms.find((room) => room.id === Number(roomId));
  };

  const getBookingsByRoom = (roomId) => {
    return bookings.filter((booking) => booking.roomId === Number(roomId));
  };

  const getBookingsByRoomAndDate = (roomId, date) => {
    return bookings.filter(
      (booking) => booking.roomId === Number(roomId) && booking.date === date
    );
  };

  const getAvailableSlots = (roomId, date) => {
    const bookedSlots = bookings
      .filter((booking) => booking.roomId === Number(roomId) && booking.date === date)
      .map((booking) => booking.slot);
    return slots.filter((slot) => !bookedSlots.includes(slot));
  };

  const bookSlot = ({
    roomId,
    roomName,
    date,
    slot,
    bookedBy,
    userEmail,
    startTime,
    endTime,
    source = "direct-booking",
    requestId = null,
    actionHistory = [],
  }) => {
    const alreadyBooked = bookings.some(
      (booking) =>
        booking.roomId === Number(roomId) &&
        booking.date === date &&
        booking.slot === slot
    );

    if (alreadyBooked) {
      return { success: false, message: "This slot is already booked." };
    }

    const newBooking = {
      id: Date.now(),
      roomId: Number(roomId),
      roomName,
      date,
      slot,
      bookedBy,
      userEmail,
      startTime: startTime || '',
      endTime: endTime || '',
      source,
      requestId,
      createdAt: new Date().toISOString(),
      actionHistory:
        actionHistory.length > 0
          ? actionHistory
          : [createActionLog("Booking created", bookedBy || "Employee")],
    };

    setBookings((prev) => [...prev, newBooking]);
    return { success: true, message: "Room booked successfully." };
  };

  const cancelBooking = (bookingId) => {
    setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
  };

  const rescheduleBooking = ({
    bookingId,
    newDate,
    newSlot,
    newStartTime,
    newEndTime,
    actionBy = "Admin",
  }) => {
    const bookingToUpdate = bookings.find((booking) => booking.id === bookingId);
    if (!bookingToUpdate) {
      return { success: false, message: 'Booking not found.' };
    }

    const isSlotAlreadyBooked = bookings.some(
      (booking) =>
        booking.id !== bookingId &&
        booking.roomId === bookingToUpdate.roomId &&
        booking.date === newDate &&
        booking.slot === newSlot
    );

    if (isSlotAlreadyBooked) {
      return { success: false, message: 'This slot is already booked.' };
    }

    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              date: newDate,
              slot: newSlot,
              startTime: newStartTime || booking.startTime,
              endTime: newEndTime || booking.endTime,
              updatedAt: new Date().toISOString(),
              actionHistory: [
                ...(booking.actionHistory || []),
                createActionLog("Booking rescheduled", actionBy),
              ],
            }
          : booking
      )
    );
    return { success: true, message: 'Booking rescheduled successfully.' };
  };

  // ─── Admin Request functions ─────────────────────────

  const addAdminRequest = (requestData) => {
    const newRequest = {
      id: Date.now(),
      ...requestData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      actionHistory: [
        createActionLog(
          "Booking request created",
          requestData.requestedBy || requestData.bookedBy || "Employee"
        ),
      ],
    };
    setAdminRequests((prev) => [...prev, newRequest]);
    return { success: true, message: 'Request sent to admin.' };
  };

  const updateAdminRequest = (requestId, status, meta = {}) => {
    setAdminRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status,
              reviewedAt: new Date().toISOString(),
              reviewedBy: meta.reviewedBy || "Admin",
              actionHistory: [
                ...(req.actionHistory || []),
                createActionLog(`Request ${status}`, meta.reviewedBy || "Admin"),
              ],
            }
          : req
      )
    );
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        slots,
        bookings,
        adminRequests,
        addRoom,
        updateRoom,
        deleteRoom,
        toggleRoomActive,
        getRoomById,
        getBookingsByRoom,
        getBookingsByRoomAndDate,
        getAvailableSlots,
        bookSlot,
        cancelBooking,
        rescheduleBooking,
        addAdminRequest,
        updateAdminRequest,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRooms() {
  return useContext(RoomContext);
}