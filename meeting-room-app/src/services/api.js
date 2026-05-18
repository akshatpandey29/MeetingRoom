import axios from "axios";

const BASE_URL = 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

/********** AUTH API CALLS **********/

export const loginUser = async (loginData) => {
  const response = await api.post("/auth/login", loginData);
  return response.data;
};

export const registerUser = async (registerData) => {
  const response = await api.post("/auth/register", registerData);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const refreshAuthToken = async () => {
  const response = await api.post("/auth/refresh");
  return response.data;
};

/********** ROOM API CALLS **********/

export const getAllRooms = async () => {
  const response = await api.get("/rooms");
  return response.data;
};

export const getRoomById = async (id) => {
  const response = await api.get(`/rooms/${id}`);
  return response.data;
};

export const createRoom = async (roomData) => {
  const response = await api.post("/rooms", roomData);
  return response.data;
};

export const updateRoom = async (id, roomData) => {
  const response = await api.put(`/rooms/${id}`, roomData);
  return response.data;
};

export const deleteRoom = async (id) => {
  const response = await api.delete(`/rooms/${id}`);
  return response.data;
};

export const toggleRoom = async (id) => {
  const response = await api.patch(`/rooms/${id}/toggle`);
  return response.data;
};

/********** BOOKING API CALLS **********/

export const createBooking = async (bookingData) => {
  const response = await api.post("/bookings", bookingData);
  return response.data;
};

export const getUserBookings = async () => {
  const response = await api.get("/bookings/my");
  return response.data;
};

export const getAllBookings = async () => {
  const response = await api.get("/bookings");
  return response.data;
};

export const cancelBooking = async (id, reason = "") => {
  const response = await api.delete(`/bookings/${id}`, {
    data: { reason },
  });

  return response.data;
};

export const rescheduleBooking = async (id, rescheduleData) => {
  const response = await api.patch(`/bookings/${id}/reschedule`, rescheduleData);
  return response.data;
};

export const getBookingsByRoomAndDate = async (roomId, date) => {
  const response = await api.get("/bookings/room-date", {
    params: { roomId, date },
  });

  return response.data;
};

export const getAvailableSlots = async (roomId, date) => {
  const response = await api.get("/bookings/available-slots", {
    params: { roomId, date },
  });

  return response.data;
};

/********** ADMIN API CALLS **********/

export const getAdminStats = async () => {
  const response = await api.get("/admin/stats");
  return response.data;
};

export const getAdminUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const changeAdminUserRole = async (id, role) => {
  const response = await api.patch(`/admin/users/${id}/role`, { role });
  return response.data;
};

export const toggleAdminUserStatus = async (id) => {
  const response = await api.patch(`/admin/users/${id}/status`);
  return response.data;
};

export const getBookingRequests = async () => {
  const response = await api.get("/admin/booking-requests");
  return response.data;
};

export const approveBookingRequest = async (id) => {
  const response = await api.patch(`/admin/booking-requests/${id}/approve`);
  return response.data;
};

export const rejectBookingRequest = async (id, reason = "") => {
  const response = await api.patch(`/admin/booking-requests/${id}/reject`, {
    reason,
  });

  return response.data;
};

export default api;
