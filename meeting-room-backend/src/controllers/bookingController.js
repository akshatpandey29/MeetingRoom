const bookingService = require("../services/bookingService");
const ApiResponse = require("../utils/apiResponse");
const { ROLES } = require("../utils/constants");

const createBooking = async (req, res, next) => {
  try {
    const result = await bookingService.createBooking({
      userId: req.user._id,
      ...req.body,
    });

    if (!result.success) {
      return ApiResponse.error(res, result.message, result.statusCode || 400);
    }

    return ApiResponse.created(res, result.data, result.message);
  } catch (error) {
    next(error);
  }
};

const getAllBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getAllBookings();

    return ApiResponse.success(res, result.data, result.message);
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getUserBookings(req.user._id);

    return ApiResponse.success(res, result.data, result.message);
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const result = await bookingService.cancelBooking({
      bookingId: req.params.id,
      userId: req.user._id,
      isAdmin: req.user.role === ROLES.ADMIN,
      reason: req.body.reason,
    });

    if (!result.success) {
      return ApiResponse.error(res, result.message, result.statusCode || 400);
    }

    return ApiResponse.success(res, result.data, result.message);
  } catch (error) {
    next(error);
  }
};

const rescheduleBooking = async (req, res, next) => {
  try {
    const result = await bookingService.rescheduleBooking({
      bookingId: req.params.id,
      userId: req.user._id,
      isAdmin: req.user.role === ROLES.ADMIN,
      newDate: req.body.newDate,
      newStartTime: req.body.newStartTime,
      newEndTime: req.body.newEndTime,
    });

    if (!result.success) {
      return ApiResponse.error(res, result.message, result.statusCode || 400);
    }

    return ApiResponse.success(res, result.data, result.message);
  } catch (error) {
    next(error);
  }
};

const getBookingsByRoomAndDate = async (req, res, next) => {
  try {
    const result = await bookingService.getBookingsByRoomAndDate({
      roomId: req.query.roomId,
      date: req.query.date,
    });

    return ApiResponse.success(res, result.data, result.message);
  } catch (error) {
    next(error);
  }
};

const getAvailableSlots = async (req, res, next) => {
  try {
    const defaultSlots = [
      "09:00 - 10:00",
      "10:00 - 11:00",
      "11:00 - 12:00",
      "12:00 - 13:00",
      "13:00 - 14:00",
      "14:00 - 15:00",
      "15:00 - 16:00",
      "16:00 - 17:00",
    ];

    const result = await bookingService.getAvailableSlots({
      roomId: req.query.roomId,
      date: req.query.date,
      slots: defaultSlots,
    });

    if (!result.success) {
      return ApiResponse.error(res, result.message, result.statusCode || 400);
    }

    return ApiResponse.success(res, result.data, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getMyBookings,
  cancelBooking,
  rescheduleBooking,
  getBookingsByRoomAndDate,
  getAvailableSlots,
};