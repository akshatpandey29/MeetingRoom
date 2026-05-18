const { User, Room, Booking, AdminRequest } = require("../models");
const ApiResponse = require("../utils/apiResponse");
const {
  ROLES,
  BOOKING_STATUS,
  ADMIN_REQUEST_STATUS,
  ROOM_STATUS,
} = require("../utils/constants");

const convertTimeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const hasTimeConflict = (existingStart, existingEnd, newStart, newEnd) => {
  const oldStart = convertTimeToMinutes(existingStart);
  const oldEnd = convertTimeToMinutes(existingEnd);
  const start = convertTimeToMinutes(newStart);
  const end = convertTimeToMinutes(newEnd);

  return start < oldEnd && end > oldStart;
};

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

    if (!room) {
      return ApiResponse.notFound(res, "Room not found.");
    }

    if (!room.isActive || room.status !== ROOM_STATUS.AVAILABLE) {
      return ApiResponse.badRequest(
        res,
        "Room is not active or not available."
      );
    }

    const existingBookings = await Booking.find({
      roomId: request.roomId,
      date: request.date,
      status: BOOKING_STATUS.CONFIRMED,
    });

    const conflict = existingBookings.find((booking) =>
      hasTimeConflict(
        booking.startTime,
        booking.endTime,
        request.startTime,
        request.endTime
      )
    );

    if (conflict) {
      return ApiResponse.conflict(
        res,
        "This time conflicts with an existing booking."
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

    await booking.populate("userId", "name email role");
    await booking.populate("roomId", "name location capacity status isActive");

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
