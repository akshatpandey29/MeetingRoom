const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../utils/constants');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    slot: {
      type: String,
      required: [true, 'Slot is required'],
    },
    status: {
      type: String,
      enum: [
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.CANCELLED,
        BOOKING_STATUS.COMPLETED,
        'checked-in',
        'no-show',
      ],
      default: BOOKING_STATUS.CONFIRMED,
    },
    purpose: {
      type: String,
      trim: true,
      default: '',
    },
    bookedBy: {
      type: String,
      required: [true, 'Booked by is required'],
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
    },
    // ── Check-in fields ───────────────────────────────────────────────────────
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    endedEarly: {
      type: Boolean,
      default: false,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    extended: {
      type: Boolean,
      default: false,
    },
    extendedMinutes: {
      type: Number,
      default: 0,
    },
    // ── Notifications ─────────────────────────────────────────────────────────
    notifications: [
      {
        type: {
          type: String,
          enum: ['booking_confirmed', 'booking_cancelled', 'checkin_reminder',
                 'request_approved', 'request_rejected', 'meeting_ending_soon',
                 'booking_extended', 'meeting_ended'],
        },
        message: { type: String },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      }
    ],
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;