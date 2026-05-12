const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

router.get('/', authenticate, roomController.getAllRooms);
router.get('/:id', authenticate, roomController.getRoomById);
router.post('/', authenticate, adminOnly, roomController.roomValidation, roomController.createRoom);
router.put('/:id', authenticate, adminOnly, roomController.updateRoom);
router.delete('/:id', authenticate, adminOnly, roomController.deleteRoom);
router.patch('/:id/toggle', authenticate, adminOnly, roomController.toggleRoomStatus);

module.exports = router;