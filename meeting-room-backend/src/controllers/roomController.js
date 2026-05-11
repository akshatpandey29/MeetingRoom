const { body, param, query } = require('express-validator');
const { Room } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { validateRequest } = require('../middleware/validateRequest');
const logger = require('../utils/logger');
const { ROOM_STATUS } = require('../utils/constants');

const roomValidation = [
  body('name').trim().notEmpty().withMessage('Room name required').isLength({ min: 2, max: 100 }),
  body('location').trim().notEmpty().withMessage('Location required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive number'),
  body('description').optional().isString(),
  body('amenities').optional().isArray(),
  validateRequest,
];

const getAllRooms = async (req, res, next) => {
  try {
    const { status, isActive } = req.query;
    const where = {};

    if (status) where.status = status;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const rooms = await Room.findAll({ where, order: [['name', 'ASC']] });
    return ApiResponse.success(res, { rooms, total: rooms.length });
  } catch (error) {
    next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return ApiResponse.notFound(res, 'Room not found');
    return ApiResponse.success(res, { room });
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    logger.info(`Room created: ${room.id}`);
    return ApiResponse.created(res, { room }, 'Room created successfully');
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return ApiResponse.notFound(res, 'Room not found');
    await room.update(req.body);
    logger.info(`Room updated: ${room.id}`);
    return ApiResponse.success(res, { room }, 'Room updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return ApiResponse.notFound(res, 'Room not found');
    await room.destroy();
    logger.info(`Room deleted: ${req.params.id}`);
    return ApiResponse.success(res, null, 'Room deleted successfully');
  } catch (error) {
    next(error);
  }
};

const toggleRoomStatus = async (req, res, next) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return ApiResponse.notFound(res, 'Room not found');
    await room.update({ isActive: !room.isActive });
    return ApiResponse.success(res, { room }, `Room ${room.isActive ? 'activated' : 'deactivated'}`);
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