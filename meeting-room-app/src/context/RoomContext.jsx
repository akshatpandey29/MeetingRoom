import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const RoomContext = createContext();

const DEFAULT_SLOTS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
];

function getErrorMessage(error, fallbackMessage = "Something went wrong.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.msg ||
    error?.message ||
    fallbackMessage
  );
}

function getId(value) {
  if (!value) return "";
  return String(value._id || value.id || value);
}

function normalizeRoom(room) {
  return {
    ...room,
    id: getId(room),
    _id: getId(room),
    name: room?.name || "",
    location: room?.location || "",
    capacity: room?.capacity || 0,
    description: room?.description || "",
    amenities: Array.isArray(room?.amenities) ? room.amenities : [],
    status: room?.status || "available",
    isActive: room?.isActive ?? true,
  };
}

function normalizeBooking(booking) {
  const room = booking?.roomId && typeof booking.roomId === "object" ? booking.roomId : null;
  const user = booking?.userId && typeof booking.userId === "object" ? booking.userId : null;

  const roomId = room ? getId(room) : getId(booking?.roomId);
  const userId = user ? getId(user) : getId(booking?.userId);

  return {
    ...booking,
    id: getId(booking),
    _id: getId(booking),
    roomId,
    userId,
    roomName: booking?.roomName || room?.name || "",
    roomLocation: room?.location || "",
    bookedBy: booking?.bookedBy || user?.name || "Employee",
    userEmail: booking?.userEmail || user?.email || "",
    date: booking?.date || "",
    startTime: booking?.startTime || "",
    endTime: booking?.endTime || "",
    slot: booking?.slot || `${booking?.startTime || ""} - ${booking?.endTime || ""}`,
    status: booking?.status || "confirmed",
    purpose: booking?.purpose || "",
    createdAt: booking?.createdAt || "",
    updatedAt: booking?.updatedAt || "",
    cancelledAt: booking?.cancelledAt || "",
    cancelReason: booking?.cancelReason || "",
    actionHistory: booking?.actionHistory || [],
  };
}

function normalizeAdminRequest(request) {
  const room = request?.roomId && typeof request.roomId === "object" ? request.roomId : null;
  const user = request?.userId && typeof request.userId === "object" ? request.userId : null;

  const roomId = room ? getId(room) : getId(request?.roomId);
  const userId = user ? getId(user) : getId(request?.userId);

  return {
    ...request,
    id: getId(request),
    _id: getId(request),
    roomId,
    userId,
    roomName: request?.roomName || room?.name || "",
    roomLocation: room?.location || "",
    requestedBy: request?.requestedBy || request?.bookedBy || user?.name || "Employee",
    bookedBy: request?.bookedBy || request?.requestedBy || user?.name || "Employee",
    userEmail: request?.userEmail || user?.email || "",
    date: request?.date || "",
    startTime: request?.startTime || "",
    endTime: request?.endTime || "",
    slot: request?.slot || `${request?.startTime || ""} - ${request?.endTime || ""}`,
    status: request?.status || "pending",
    adminNote: request?.adminNote || "",
    createdAt: request?.createdAt || "",
    reviewedAt: request?.reviewedAt || "",
    actionHistory: request?.actionHistory || [],
  };
}

function sortBookingsByDateTime(bookingList) {
  return [...bookingList].sort((firstBooking, secondBooking) => {
    const firstDateTime = `${firstBooking.date || ""} ${firstBooking.startTime || ""}`;
    const secondDateTime = `${secondBooking.date || ""} ${secondBooking.startTime || ""}`;
    return firstDateTime.localeCompare(secondDateTime);
  });
}

function mergeBookings(existingBookings, incomingBookings) {
  const bookingMap = new Map();

  existingBookings.forEach((booking) => {
    bookingMap.set(String(booking.id), booking);
  });

  incomingBookings.forEach((booking) => {
    bookingMap.set(String(booking.id), booking);
  });

  return sortBookingsByDateTime(Array.from(bookingMap.values()));
}

export function RoomProvider({ children }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [error, setError] = useState("");

  const slots = DEFAULT_SLOTS;

  const fetchRooms = async () => {
    try {
      setRoomLoading(true);
      const response = await api.get("/rooms");
      const roomList = response?.data?.data?.rooms || [];
      setRooms(roomList.map(normalizeRoom));
      return { success: true, message: response?.data?.message || "Rooms fetched successfully." };
    } catch (error) {
      const message = getErrorMessage(error, "Rooms could not be fetched.");
      setError(message);
      return { success: false, message };
    } finally {
      setRoomLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setBookingLoading(true);
      const response = await api.get("/bookings");
      const bookingList = response?.data?.data?.bookings || [];
      setBookings(sortBookingsByDateTime(bookingList.map(normalizeBooking)));
      return { success: true, message: response?.data?.message || "Bookings fetched successfully." };
    } catch (error) {
      const message = getErrorMessage(error, "Bookings could not be fetched.");
      setError(message);
      return { success: false, message };
    } finally {
      setBookingLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      setBookingLoading(true);
      const response = await api.get("/bookings/my");
      const bookingList = response?.data?.data?.bookings || [];
      setBookings(sortBookingsByDateTime(bookingList.map(normalizeBooking)));
      return { success: true, message: response?.data?.message || "My bookings fetched successfully." };
    } catch (error) {
      const message = getErrorMessage(error, "My bookings could not be fetched.");
      setError(message);
      return { success: false, message };
    } finally {
      setBookingLoading(false);
    }
  };

  const fetchAdminRequests = async () => {
    try {
      setRequestLoading(true);
      const response = await api.get("/admin/booking-requests");
      const requestList = response?.data?.data?.requests || [];
      setAdminRequests(requestList.map(normalizeAdminRequest));
      return { success: true, message: response?.data?.message || "Booking requests fetched successfully." };
    } catch (error) {
      const message = getErrorMessage(error, "Booking requests could not be fetched.");
      setError(message);
      return { success: false, message };
    } finally {
      setRequestLoading(false);
    }
  };

  const refreshAdminWorkspace = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchRooms(), fetchBookings(), fetchAdminRequests()]);
      return { success: true, message: "Admin workspace refreshed successfully." };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setRooms([]);
      setBookings([]);
      setAdminRequests([]);
      setError("");
      return;
    }

    if (user.role === "admin") {
      refreshAdminWorkspace();
      return;
    }

    setLoading(true);
    Promise.all([fetchRooms(), fetchMyBookings()])
      .finally(() => {
        setAdminRequests([]);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const addRoom = async (roomData) => {
    try {
      const payload = {
        name: roomData.name,
        location: roomData.location,
        capacity: Number(roomData.capacity),
        description: roomData.description || "",
        amenities: Array.isArray(roomData.amenities)
          ? roomData.amenities
          : String(roomData.amenities || "").split(",").map((item) => item.trim()).filter(Boolean),
        status: roomData.status || "available",
        isActive: roomData.isActive ?? true,
      };

      const response = await api.post("/rooms", payload);
      const createdRoom = normalizeRoom(response?.data?.data?.room);
      setRooms((previousRooms) => [...previousRooms, createdRoom]);
      return { success: true, message: response?.data?.message || "Room created successfully.", data: createdRoom };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, "Room could not be created.") };
    }
  };

  const updateRoom = async (roomId, roomData) => {
    try {
      const payload = {
        name: roomData.name,
        location: roomData.location,
        capacity: Number(roomData.capacity),
        description: roomData.description || "",
        amenities: Array.isArray(roomData.amenities)
          ? roomData.amenities
          : String(roomData.amenities || "").split(",").map((item) => item.trim()).filter(Boolean),
        status: roomData.status || "available",
        isActive: roomData.isActive ?? true,
      };

      const response = await api.put(`/rooms/${roomId}`, payload);
      const updatedRoom = normalizeRoom(response?.data?.data?.room);
      setRooms((previousRooms) =>
        previousRooms.map((room) => String(room.id) === String(roomId) ? updatedRoom : room)
      );
      return { success: true, message: response?.data?.message || "Room updated successfully.", data: updatedRoom };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, "Room could not be updated.") };
    }
  };

  const deleteRoom = async (roomId) => {
    try {
      const response = await api.delete(`/rooms/${roomId}`);
      const updatedRoom = normalizeRoom(response?.data?.data?.room);
      setRooms((previousRooms) =>
        previousRooms.map((room) => String(room.id) === String(roomId) ? updatedRoom : room)
      );
      return { success: true, message: response?.data?.message || "Room deactivated successfully.", data: updatedRoom };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, "Room could not be deactivated.") };
    }
  };

  const toggleRoomActive = async (roomId) => {
    try {
      const response = await api.patch(`/rooms/${roomId}/toggle`);
      const updatedRoom = normalizeRoom(response?.data?.data?.room);
      setRooms((previousRooms) =>
        previousRooms.map((room) => String(room.id) === String(roomId) ? updatedRoom : room)
      );
      return { success: true, message: response?.data?.message || "Room status updated successfully.", data: updatedRoom };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, "Room status could not be updated.") };
    }
  };

  const getRoomById = (roomId) => rooms.find((room) => String(room.id) === String(roomId));

  const getBookingsByRoom = (roomId) => bookings.filter((booking) => String(booking.roomId) === String(roomId));

  const getBookingsByRoomAndDate = (roomId, date) => {
    return bookings.filter((booking) => String(booking.roomId) === String(roomId) && booking.date === date && booking.status !== "cancelled");
  };

  const fetchBookingsByRoomAndDate = async (roomId, date) => {
    try {
      const response = await api.get("/bookings/room-date", { params: { roomId, date } });
      const bookingList = response?.data?.data?.bookings || [];
      const normalizedBookings = bookingList.map(normalizeBooking);
      setBookings((previousBookings) => mergeBookings(previousBookings, normalizedBookings));
      return normalizedBookings;
    } catch (error) {
      return bookings.filter((booking) => String(booking.roomId) === String(roomId) && booking.date === date);
    }
  };

  const getAvailableSlots = async (roomId, date) => {
    try {
      const response = await api.get("/bookings/available-slots", { params: { roomId, date } });
      return response?.data?.data?.availableSlots || [];
    } catch (error) {
      const bookedSlots = bookings
        .filter((booking) => String(booking.roomId) === String(roomId) && booking.date === date && booking.status !== "cancelled")
        .map((booking) => booking.slot);

      return slots.filter((slot) => !bookedSlots.includes(slot));
    }
  };

  const bookSlot = async ({ userId, roomId, date, startTime, endTime, purpose = "" }) => {
    try {
      const response = await api.post("/bookings", { userId, roomId, date, startTime, endTime, purpose });
      const createdBooking = normalizeBooking(response?.data?.data?.booking);
      setBookings((previousBookings) => sortBookingsByDateTime([...previousBookings, createdBooking]));
      return { success: true, message: response?.data?.message || "Room booked successfully.", data: createdBooking };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, "Room could not be booked.") };
    }
  };

  const cancelBooking = async (bookingId, reason = "") => {
    try {
      const response = await api.delete(`/bookings/${bookingId}`, { data: { reason } });
      const updatedBooking = normalizeBooking(response?.data?.data?.booking);
      setBookings((previousBookings) =>
        previousBookings.map((booking) => String(booking.id) === String(bookingId) ? updatedBooking : booking)
      );
      return { success: true, message: response?.data?.message || "Booking cancelled successfully.", data: updatedBooking };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, "Booking could not be cancelled.") };
    }
  };

  const deleteBookingFromDatabase = async (bookingId) => {
    try {
      const response = await api.delete(`/bookings/${bookingId}/permanent`);
      setBookings((previousBookings) =>
        previousBookings.filter((booking) => String(booking.id) !== String(bookingId))
      );
      return { success: true, message: response?.data?.message || "Booking deleted from database successfully." };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, "Booking could not be deleted from database.") };
    }
  };

  const rescheduleBooking = async ({ bookingId, newDate, newStartTime, newEndTime }) => {
    try {
      const response = await api.patch(`/bookings/${bookingId}/reschedule`, { newDate, newStartTime, newEndTime });
      const updatedBooking = normalizeBooking(response?.data?.data?.booking);
      setBookings((previousBookings) =>
        sortBookingsByDateTime(previousBookings.map((booking) => String(booking.id) === String(bookingId) ? updatedBooking : booking))
      );
      return { success: true, message: response?.data?.message || "Booking rescheduled successfully.", data: updatedBooking };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, "Booking could not be rescheduled.") };
    }
  };

  const approveAdminRequest = async (requestId, adminNote = "") => {
    try {
      const response = await api.patch(`/admin/booking-requests/${requestId}/approve`, { adminNote });
      const updatedRequest = normalizeAdminRequest(response?.data?.data?.request);
      const createdBooking = response?.data?.data?.booking ? normalizeBooking(response.data.data.booking) : null;

      setAdminRequests((previousRequests) =>
        previousRequests.map((request) => String(request.id) === String(requestId) ? updatedRequest : request)
      );

      if (createdBooking) {
        setBookings((previousBookings) => sortBookingsByDateTime([...previousBookings, createdBooking]));
      }

      return { success: true, message: response?.data?.message || "Booking request approved successfully.", data: { request: updatedRequest, booking: createdBooking } };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, "Booking request could not be approved.") };
    }
  };

  const rejectAdminRequest = async (requestId, adminNote = "") => {
    try {
      const response = await api.patch(`/admin/booking-requests/${requestId}/reject`, { adminNote });
      const updatedRequest = normalizeAdminRequest(response?.data?.data?.request);
      setAdminRequests((previousRequests) =>
        previousRequests.map((request) => String(request.id) === String(requestId) ? updatedRequest : request)
      );
      return { success: true, message: response?.data?.message || "Booking request rejected successfully.", data: updatedRequest };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, "Booking request could not be rejected.") };
    }
  };

  const addAdminRequest = async ({ roomId, date, startTime, endTime, purpose = "" }) => {
    try {
      const response = await api.post("/bookings/requests", {
        roomId,
        date,
        startTime,
        endTime,
        purpose,
      });
      const createdRequest = normalizeAdminRequest(response?.data?.data?.request);
      setAdminRequests((previousRequests) => [createdRequest, ...previousRequests]);
      return { success: true, message: response?.data?.message || "Request sent to admin.", data: createdRequest };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, "Request could not be sent to admin.") };
    }
  };

  const updateAdminRequest = async (requestId, status, meta = {}) => {
    if (status === "approved") {
      return approveAdminRequest(requestId, meta.adminNote || "");
    }

    if (status === "rejected") {
      return rejectAdminRequest(requestId, meta.adminNote || "");
    }

    return { success: false, message: "Invalid request status." };
  };

  const activeRooms = useMemo(() => rooms.filter((room) => room.isActive), [rooms]);
  const pendingRequests = useMemo(() => adminRequests.filter((request) => request.status === "pending"), [adminRequests]);

  return (
    <RoomContext.Provider
      value={{
        rooms,
        activeRooms,
        slots,
        bookings,
        adminRequests,
        pendingRequests,
        loading,
        roomLoading,
        bookingLoading,
        requestLoading,
        error,
        fetchRooms,
        fetchBookings,
        fetchMyBookings,
        fetchAdminRequests,
        fetchBookingsByRoomAndDate,
        refreshAdminWorkspace,
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
        deleteBookingFromDatabase,
        rescheduleBooking,
        addAdminRequest,
        updateAdminRequest,
        approveAdminRequest,
        rejectAdminRequest,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRooms() {
  return useContext(RoomContext);
}
