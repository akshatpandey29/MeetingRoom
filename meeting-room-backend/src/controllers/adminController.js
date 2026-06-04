const { User, Room, Booking, AdminRequest } = require("../models");
const ApiResponse = require("../utils/apiResponse");
const bookingService = require("../services/bookingService");
const {
  ROLES,
  BOOKING_STATUS,
  ADMIN_REQUEST_STATUS,
} = require("../utils/constants");

/**
 * GET /api/admin/stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: ROLES.USER });
    const totalAdmins = await User.countDocuments({ role: ROLES.ADMIN });
    const totalRooms = await Room.countDocuments();
    const activeRooms = await Room.countDocuments({ isActive: true });
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({
      status: BOOKING_STATUS.CONFIRMED,
    });
    const pendingRequests = await AdminRequest.countDocuments({
      status: ADMIN_REQUEST_STATUS.PENDING,
    });

    return ApiResponse.success(
      res,
      {
        totalUsers,
        totalAdmins,
        totalRooms,
        activeRooms,
        totalBookings,
        confirmedBookings,
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

    if (user.role === ROLES.ADMIN) {
      const activeAdmins = await User.countDocuments({
        role: ROLES.ADMIN,
        isActive: true,
      });

      if (activeAdmins <= 1) {
        return ApiResponse.badRequest(
          res,
          "At least one active admin must remain in the system."
        );
      }
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

    if (user.role === ROLES.ADMIN && user.isActive) {
      const activeAdmins = await User.countDocuments({
        role: ROLES.ADMIN,
        isActive: true,
      });

      if (activeAdmins <= 1) {
        return ApiResponse.badRequest(
          res,
          "At least one active admin must remain in the system."
        );
      }
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
 */
const approveBookingRequest = async (req, res, next) => {
  try {
    const result = await bookingService.approveAdminRequest({
      requestId: req.params.id,
      adminNote: req.body.adminNote || "",
    });

    if (!result.success) {
      return ApiResponse.error(
        res,
        result.message,
        result.statusCode || 400
      );
    }

    return ApiResponse.success(
      res,
      result.data,
      result.message || "Booking request approved successfully."
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/booking-requests/reviewed
 */
const clearReviewedBookingRequests = async (req, res, next) => {
  try {
    const result = await AdminRequest.deleteMany({
      status: {
        $in: [ADMIN_REQUEST_STATUS.APPROVED, ADMIN_REQUEST_STATUS.REJECTED],
      },
    });

    return ApiResponse.success(
      res,
      { deletedCount: result.deletedCount || 0 },
      "Reviewed booking requests cleared successfully."
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/booking-requests/:id/reject
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
  clearReviewedBookingRequests,
};
