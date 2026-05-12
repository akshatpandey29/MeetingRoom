const { User, Room, Booking, AdminRequest } = require("../models");
const ApiResponse = require("../utils/apiResponse");
const {
  ROLES,
  BOOKING_STATUS,
  ADMIN_REQUEST_STATUS,
} = require("../utils/constants");

/**
 * GET /api/admin/stats
 * Admin dashboard stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: ROLES.USER });
    const totalAdmins = await User.countDocuments({ role: ROLES.ADMIN });
    const totalRooms = await Room.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingRequests = await AdminRequest.countDocuments({
      status: ADMIN_REQUEST_STATUS.PENDING,
    });

    return ApiResponse.success(
      res,
      {
        totalUsers,
        totalAdmins,
        totalRooms,
        totalBookings,
        pendingRequests,
      },
      "Dashboard stats fetched successfully."
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users
 * Get all users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password -refreshToken")
      .sort({ role: 1, name: 1 });

    return ApiResponse.success(
      res,
      {
        users,
        total: users.length,
      },
      "Users fetched successfully."
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/role
 * Change user role admin <-> user
 */
const changeUserRole = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (req.user._id.toString() === userId) {
      return ApiResponse.badRequest(res, "You cannot change your own role.");
    }

    const user = await User.findById(userId);

    if (!user) {
      return ApiResponse.notFound(res, "User not found.");
    }

    user.role = user.role === ROLES.ADMIN ? ROLES.USER : ROLES.ADMIN;
    await user.save();

    return ApiResponse.success(
      res,
      { user },
      "User role changed successfully."
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Enable or disable user account
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (req.user._id.toString() === userId) {
      return ApiResponse.badRequest(res, "You cannot disable your own account.");
    }

    const user = await User.findById(userId);

    if (!user) {
      return ApiResponse.notFound(res, "User not found.");
    }

    user.isActive = !user.isActive;
    await user.save();

    return ApiResponse.success(
      res,
      { user },
      user.isActive
        ? "User enabled successfully."
        : "User disabled successfully."
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/booking-requests
 * Get all admin booking requests
 */
const getBookingRequests = async (req, res, next) => {
  try {
    const requests = await AdminRequest.find()
      .populate("userId", "name email role")
      .populate("roomId", "name location capacity status isActive")
      .sort({ createdAt: -1 });

    return ApiResponse.success(
      res,
      {
        requests,
        total: requests.length,
      },
      "Booking requests fetched successfully."
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/booking-requests/:id/approve
 * Approve booking request and create booking
 */
const approveBookingRequest = async (req, res, next) => {
  try {
    const request = await AdminRequest.findById(req.params.id);

    if (!request) {
      return ApiResponse.notFound(res, "Booking request not found.");
    }

    if (request.status !== ADMIN_REQUEST_STATUS.PENDING) {
      return ApiResponse.badRequest(
        res,
        "Only pending requests can be approved."
      );
    }

    const room = await Room.findById(request.roomId);

    if (!room || !room.isActive) {
      return ApiResponse.badRequest(res, "Room is not active or not found.");
    }

    const existingBooking = await Booking.findOne({
      roomId: request.roomId,
      date: request.date,
      startTime: request.startTime,
      endTime: request.endTime,
      status: BOOKING_STATUS.CONFIRMED,
    });

    if (existingBooking) {
      return ApiResponse.conflict(
        res,
        "This time slot is already booked."
      );
    }

    const booking = await Booking.create({
      userId: request.userId,
      roomId: request.roomId,
      date: request.date,
      startTime: request.startTime,
      endTime: request.endTime,
      slot: request.slot,
      bookedBy: request.requestedBy,
      userEmail: request.userEmail,
      status: BOOKING_STATUS.CONFIRMED,
    });

    request.status = ADMIN_REQUEST_STATUS.APPROVED;
    request.reviewedAt = new Date();
    request.adminNote = req.body.adminNote || null;
    await request.save();

    return ApiResponse.success(
      res,
      {
        request,
        booking,
      },
      "Booking request approved successfully."
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/booking-requests/:id/reject
 * Reject booking request
 */
const rejectBookingRequest = async (req, res, next) => {
  try {
    const request = await AdminRequest.findById(req.params.id);

    if (!request) {
      return ApiResponse.notFound(res, "Booking request not found.");
    }

    if (request.status !== ADMIN_REQUEST_STATUS.PENDING) {
      return ApiResponse.badRequest(
        res,
        "Only pending requests can be rejected."
      );
    }

    request.status = ADMIN_REQUEST_STATUS.REJECTED;
    request.reviewedAt = new Date();
    request.adminNote = req.body.adminNote || null;
    await request.save();

    return ApiResponse.success(
      res,
      { request },
      "Booking request rejected successfully."
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  changeUserRole,
  toggleUserStatus,
  getBookingRequests,
  approveBookingRequest,
  rejectBookingRequest,
};