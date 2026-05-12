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
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;