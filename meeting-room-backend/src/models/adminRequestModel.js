const mongoose = require('mongoose');
const { ADMIN_REQUEST_STATUS } = require('../utils/constants');

const adminRequestSchema = new mongoose.Schema(
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
        ADMIN_REQUEST_STATUS.PENDING,
        ADMIN_REQUEST_STATUS.APPROVED,
        ADMIN_REQUEST_STATUS.REJECTED,
      ],
      default: ADMIN_REQUEST_STATUS.PENDING,
    },
    requestedBy: {
      type: String,
      required: [true, 'Requested by is required'],
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
    },
    adminNote: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const AdminRequest = mongoose.model('AdminRequest', adminRequestSchema);
module.exports = AdminRequest;