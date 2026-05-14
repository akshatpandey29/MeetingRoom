const express = require("express");
const router = express.Router();

const { body, query } = require("express-validator");
const { validateRequest } = require("../middleware/validateRequest");

const bookingController = require("../controllers/bookingController");
const { authenticate } = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");


// Validation for creating a booking
const createBookingValidation = [
  body("roomId")
    .notEmpty()
    .withMessage("Room ID is required"),

  body("date")
    .notEmpty()
    .withMessage("Date is required"),

  body("startTime")
    .notEmpty()
    .withMessage("Start time is required"),

  body("endTime")
    .notEmpty()
    .withMessage("End time is required"),

  body("purpose")
    .optional()
    .isString()
    .withMessage("Purpose must be text"),

  validateRequest,
];

// Validation for room-date and available-slots APIs
const roomDateValidation = [
  query("roomId")
    .notEmpty()
    .withMessage("Room ID is required"),

  query("date")
    .notEmpty()
    .withMessage("Date is required"),

  validateRequest,
];

// Validation for rescheduling booking
const rescheduleBookingValidation = [
  body("newDate")
    .notEmpty()
    .withMessage("New date is required"),

  body("newStartTime")
    .notEmpty()
    .withMessage("New start time is required"),

  body("newEndTime")
    .notEmpty()
    .withMessage("New end time is required"),

  validateRequest,
];

// Validation for cancelling booking
const cancelBookingValidation = [
  body("reason")
    .optional()
    .isString()
    .withMessage("Reason must be text"),

  validateRequest,
];

/*
|--------------------------------------------------------------------------
| Booking Routes
|--------------------------------------------------------------------------
*/

// Create booking
// POST /api/bookings
router.post(
  "/",
  authenticate,
  createBookingValidation,
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
  roomDateValidation,
  bookingController.getBookingsByRoomAndDate
);

// Get available slots
// GET /api/bookings/available-slots?roomId=ROOM_ID&date=YYYY-MM-DD
router.get(
  "/available-slots",
  authenticate,
  roomDateValidation,
  bookingController.getAvailableSlots
);

// Cancel booking
// DELETE /api/bookings/:id
router.delete(
  "/:id",
  authenticate,
  cancelBookingValidation,
  bookingController.cancelBooking
);

// Reschedule booking
// PATCH /api/bookings/:id/reschedule
router.patch(
  "/:id/reschedule",
  authenticate,
  rescheduleBookingValidation,
  bookingController.rescheduleBooking
);

module.exports = router;