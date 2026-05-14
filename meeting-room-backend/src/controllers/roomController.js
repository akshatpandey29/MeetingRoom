const { body } = require("express-validator");
const { Room } = require("../models");
const ApiResponse = require("../utils/apiResponse");
const { validateRequest } = require("../middleware/validateRequest");
const logger = require("../utils/logger");
const { ROOM_STATUS } = require("../utils/constants");

const roomValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Room name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Room name must be between 2 and 100 characters"),

  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required"),

  body("capacity")
    .isInt({ min: 1 })
    .withMessage("Capacity must be a positive number"),

  body("status")
    .optional()
    .isIn([ROOM_STATUS.AVAILABLE, ROOM_STATUS.UNAVAILABLE])
    .withMessage("Invalid room status"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be text"),

  body("amenities")
    .optional()
    .isArray()
    .withMessage("Amenities must be an array"),

  validateRequest,
];

const getAllRooms = async (req, res, next) => {
  try {
    const { status, isActive } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const rooms = await Room.find(filter).sort({ name: 1 });

    return ApiResponse.success(
      res,
      {
        rooms,
        total: rooms.length,
      },
      "Rooms fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return ApiResponse.notFound(res, "Room not found");
    }

    return ApiResponse.success(
      res,
      { room },
      "Room fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);

    logger.info(`Room created: ${room._id}`);

    return ApiResponse.created(
      res,
      { room },
      "Room created successfully"
    );
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!room) {
      return ApiResponse.notFound(res, "Room not found");
    }

    logger.info(`Room updated: ${room._id}`);

    return ApiResponse.success(
      res,
      { room },
      "Room updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return ApiResponse.notFound(res, "Room not found");
    }

    room.isActive = false;
    await room.save();

    logger.info(`Room deactivated instead of deleted: ${req.params.id}`);

    return ApiResponse.success(
      res,
      { room },
      "Room deactivated successfully"
    );
  } catch (error) {
    next(error);
  }
};

const toggleRoomStatus = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return ApiResponse.notFound(res, "Room not found");
    }

    room.isActive = !room.isActive;
    await room.save();

    return ApiResponse.success(
      res,
      { room },
      `Room ${room.isActive ? "activated" : "deactivated"} successfully`
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  toggleRoomStatus,
  roomValidation,
};