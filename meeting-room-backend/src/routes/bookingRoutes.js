const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/bookingController");
const { authenticate } = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");

// Create booking
// POST /api/bookings
router.post(
  "/",
  authenticate,
  bookingController.createBooking
);

// Get logged-in user's bookings
// GET /api/bookings/my
router.get(
  "/my",
  authenticate,
  bookingController.getMyBookings
);

// Get all bookings - admin only
// GET /api/bookings
router.get(
  "/",
  authenticate,
  adminOnly,
  bookingController.getAllBookings
);

// Get bookings by room and date
// GET /api/bookings/room-date?roomId=ROOM_ID&date=YYYY-MM-DD
router.get(
  "/room-date",
  authenticate,
  bookingController.getBookingsByRoomAndDate
);

// Cancel booking
// DELETE /api/bookings/:id
router.delete(
  "/:id",
  authenticate,
  bookingController.cancelBooking
);

// Reschedule booking
// PATCH /api/bookings/:id/reschedule
router.patch(
  "/:id/reschedule",
  authenticate,
  bookingController.rescheduleBooking
);

module.exports = router;