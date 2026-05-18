import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000/api';

// Base URL of your backend server
// Later change this to your real backend URL
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
// This runs before every API call automatically
// It adds the JWT token to every request header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
// This runs after every API response automatically
// If token expired (401 error), logout user and redirect to login
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

/**********Auth API calls ************/
export const loginUser = async (loginData) =>{
    const response = await api.post('/auth/login', loginData);
    return response.data;
};

export const registerUser = async (registerData) => {
    const response = await api.post('/auth/register', registerData);
    return response.data;
};

export const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

/*****Room API calls****** */

export const getAllRooms = async () => {
  const response = await api.get('/rooms');
  return response.data;
};

export const getRoomById = async (id) => {
  const response = await api.get(`/rooms/${id}`);
  return response.data;
};

export const createRoom = async (roomData) => {
  const response = await api.post('/rooms', roomData);
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

// ─── BOOKINGS API CALLS ───────────────────────────

export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

export const getUserBookings = async () => {
  const response = await api.get('/bookings/my');
  return response.data;
};

export const getAllBookings = async () => {
  const response = await api.get('/bookings');
  return response.data;
};

export const cancelBooking = async (id) => {
  const response = await api.delete(`/bookings/${id}`);
  return response.data;
};

// ─── SLOTS API CALLS ──────────────────────────────

export const getAvailableSlots = async (roomId, date) => {
  const response = await api.get(`/slots?roomId=${roomId}&date=${date}`);
  return response.data;
};

export default api;