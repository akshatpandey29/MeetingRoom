const express = require("express");
const router = express.Router();

const { body, query } = require("express-validator");
const { validateRequest } = require("../middleware/validateRequest");

const bookingController = require("../controllers/bookingController");
const { authenticate } = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");
const Booking = require('../models/bookingModel');
const ApiResponse = require('../utils/apiResponse');

// ── Validations ───────────────────────────────────────────────────────────────

const createBookingValidation = [
  body("roomId").notEmpty().withMessage("Room ID is required"),
  body("date").notEmpty().withMessage("Date is required"),
  body("startTime").notEmpty().withMessage("Start time is required"),
  body("endTime").notEmpty().withMessage("End time is required"),
  body("purpose").optional().isString().withMessage("Purpose must be text"),
  validateRequest,
];

const roomDateValidation = [
  query("roomId").notEmpty().withMessage("Room ID is required"),
  query("date").notEmpty().withMessage("Date is required"),
  validateRequest,
];

const rescheduleBookingValidation = [
  body("newDate").notEmpty().withMessage("New date is required"),
  body("newStartTime").notEmpty().withMessage("New start time is required"),
  body("newEndTime").notEmpty().withMessage("New end time is required"),
  validateRequest,
];

const cancelBookingValidation = [
  body("reason").optional().isString().withMessage("Reason must be text"),
  validateRequest,
];

// ── Booking Routes ────────────────────────────────────────────────────────────

// Create booking
router.post("/", authenticate, createBookingValidation, bookingController.createBooking);

// Create admin approval request
router.post("/requests", authenticate, createBookingValidation, bookingController.createAdminRequest);

// Get logged-in user's bookings
router.get("/my", authenticate, bookingController.getMyBookings);

// Get all bookings - admin only
router.get("/", authenticate, adminOnly, bookingController.getAllBookings);

// Get bookings by room and date
router.get("/room-date", authenticate, roomDateValidation, bookingController.getBookingsByRoomAndDate);

// Get available slots
router.get("/available-slots", authenticate, roomDateValidation, bookingController.getAvailableSlots);

// Cancel booking
router.delete("/:id", authenticate, cancelBookingValidation, bookingController.cancelBooking);

// Permanently delete booking - admin only
router.delete("/:id/permanent", authenticate, adminOnly, bookingController.deleteBookingFromDatabase);

// Reschedule booking
router.patch("/:id/reschedule", authenticate, rescheduleBookingValidation, bookingController.rescheduleBooking);

// ── Check In ──────────────────────────────────────────────────────────────────
router.post('/:id/checkin', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return ApiResponse.error(res, 'Booking not found', 404);

    if (String(booking.userId) !== String(req.user._id)) {
      return ApiResponse.error(res, 'Not authorized', 403);
    }

    if (booking.checkedIn) {
      return ApiResponse.error(res, 'Already checked in', 400);
    }

    const now = new Date();
    const [sh, sm] = booking.startTime.split(':').map(Number);
    const startDT = new Date(`${booking.date}T${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}:00`);
    const diffMins = (startDT - now) / 60000;

    if (diffMins > 5) {
      return ApiResponse.error(
        res,
        `Too early to check in. You can check in 15 minutes before your meeting starts at ${booking.startTime}.`,
        400
      );
    }

    if (diffMins < -60) {
      return ApiResponse.error(res, 'Meeting time has passed. Cannot check in.', 400);
    }

    booking.checkedIn = true;
    booking.checkInTime = now;
    booking.status = 'checked-in';
    await booking.save();

    return ApiResponse.success(res, { booking }, 'Checked in successfully!');
  } catch (error) {
    return ApiResponse.error(res, error.message, 500);
  }
});

// ── End Meeting ───────────────────────────────────────────────────────────────
router.post('/:id/end', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return ApiResponse.error(res, 'Booking not found', 404);

    if (String(booking.userId) !== String(req.user._id)) {
      return ApiResponse.error(res, 'Not authorized', 403);
    }

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;

    booking.status = 'completed';
    booking.endedEarly = currentTime < booking.endTime;
    booking.endedAt = now;

    if (booking.endedEarly) {
      booking.endTime = currentTime;
      const [startH, startM] = booking.startTime.split(':').map(Number);
      const [endH, endM] = currentTime.split(':').map(Number);
      const startFormatted = `${String(startH % 12 || 12).padStart(2,'0')}:${String(startM).padStart(2,'0')} ${startH >= 12 ? 'PM' : 'AM'}`;
      const endFormatted = `${String(endH % 12 || 12).padStart(2,'0')}:${String(endM).padStart(2,'0')} ${endH >= 12 ? 'PM' : 'AM'}`;
      booking.slot = `${startFormatted} – ${endFormatted}`;
    }

    await booking.save();

    return ApiResponse.success(res, { booking }, 'Meeting ended. Room is now free!');
  } catch (error) {
    return ApiResponse.error(res, error.message, 500);
  }
});

// ── Extend Meeting ────────────────────────────────────────────────────────────
router.post('/:id/extend', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return ApiResponse.error(res, 'Booking not found', 404);

    if (String(booking.userId) !== String(req.user._id)) {
      return ApiResponse.error(res, 'Not authorized', 403);
    }

    const minutes = req.body.minutes || 15;

    const [eh, em] = booking.endTime.split(':').map(Number);
    const totalMins = eh * 60 + em + minutes;
    const newH = Math.floor(totalMins / 60) % 24;
    const newM = totalMins % 60;
    const newEndTime = `${String(newH).padStart(2,'0')}:${String(newM).padStart(2,'0')}`;

    const [sh, sm] = booking.startTime.split(':').map(Number);
    const startFormatted = `${String(sh % 12 || 12).padStart(2,'0')}:${String(sm).padStart(2,'0')} ${sh >= 12 ? 'PM' : 'AM'}`;
    const endFormatted = `${String(newH % 12 || 12).padStart(2,'0')}:${String(newM).padStart(2,'0')} ${newH >= 12 ? 'PM' : 'AM'}`;

    booking.endTime = newEndTime;
    booking.slot = `${startFormatted} – ${endFormatted}`;
    booking.extended = true;
    booking.extendedMinutes = (booking.extendedMinutes || 0) + minutes;
    await booking.save();

    return ApiResponse.success(res, { booking }, `Meeting extended by ${minutes} minutes!`);
  } catch (error) {
    return ApiResponse.error(res, error.message, 500);
  }
});

module.exports = router;