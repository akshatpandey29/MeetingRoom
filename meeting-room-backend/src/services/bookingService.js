const { Booking, Room, User } = require("../models");
const { BOOKING_STATUS, ROOM_STATUS } = require("../utils/constants");

const convertTimeToMinutes = (time) => {
  if (!time) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};


const isTimeOverlapping = (
  existingStartTime,
  existingEndTime,
  newStartTime,
  newEndTime
) => {
  const existingStart = convertTimeToMinutes(existingStartTime);
  const existingEnd = convertTimeToMinutes(existingEndTime);
  const newStart = convertTimeToMinutes(newStartTime);
  const newEnd = convertTimeToMinutes(newEndTime);

  return newStart < existingEnd && newEnd > existingStart;
};


const validateBookingInput = ({ roomId, date, startTime, endTime }) => {
  if (!roomId) {
    return {
      valid: false,
      message: "Room is required.",
    };
  }

  if (!date) {
    return {
      valid: false,
      message: "Date is required.",
    };
  }

  if (!startTime) {
    return {
      valid: false,
      message: "Start time is required.",
    };
  }

  if (!endTime) {
    return {
      valid: false,
      message: "End time is required.",
    };
  }

  const startMinutes = convertTimeToMinutes(startTime);
  const endMinutes = convertTimeToMinutes(endTime);

  if (startMinutes === null || endMinutes === null) {
    return {
      valid: false,
      message: "Invalid time format.",
    };
  }

  if (endMinutes <= startMinutes) {
    return {
      valid: false,
      message: "End time must be after start time.",
    };
  }

  return {
    valid: true,
  };
};


const checkRoomAvailability = async (roomId) => {
  const room = await Room.findById(roomId);

  if (!room) {
    return {
      available: false,
      message: "Meeting room not found.",
    };
  }

  if (!room.isActive) {
    return {
      available: false,
      message: "Please select an active meeting room.",
    };
  }

  if (room.status !== ROOM_STATUS.AVAILABLE) {
    return {
      available: false,
      message: "This meeting room is currently unavailable.",
    };
  }

  return {
    available: true,
    room,
  };
};


const checkBookingConflict = async ({
  roomId,
  date,
  startTime,
  endTime,
  excludeBookingId = null,
}) => {
  const query = {
    roomId,
    date,
    status: BOOKING_STATUS.CONFIRMED,
  };

  if (excludeBookingId) {
    query._id = {
      $ne: excludeBookingId,
    };
  }

  const existingBookings = await Booking.find(query);

  const conflictingBooking = existingBookings.find((booking) => {
    return isTimeOverlapping(
      booking.startTime,
      booking.endTime,
      startTime,
      endTime
    );
  });

  if (conflictingBooking) {
    return {
      conflict: true,
      booking: conflictingBooking,
      message: "This time conflicts with an existing booking.",
    };
  }

  return {
    conflict: false,
  };
};


const createBooking = async ({
  userId,
  roomId,
  date,
  startTime,
  endTime,
  purpose = "",
}) => {
  const validation = validateBookingInput({
    roomId,
    date,
    startTime,
    endTime,
  });

  if (!validation.valid) {
    return {
      success: false,
      statusCode: 400,
      message: validation.message,
    };
  }

  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    return {
      success: false,
      statusCode: 401,
      message: "User not found or inactive.",
    };
  }

  const roomCheck = await checkRoomAvailability(roomId);

  if (!roomCheck.available) {
    return {
      success: false,
      statusCode: 400,
      message: roomCheck.message,
    };
  }

  const conflictCheck = await checkBookingConflict({
    roomId,
    date,
    startTime,
    endTime,
  });

  if (conflictCheck.conflict) {
    return {
      success: false,
      statusCode: 409,
      message: conflictCheck.message,
      data: {
        conflictingBooking: conflictCheck.booking,
      },
    };
  }

  const slot = `${startTime} - ${endTime}`;

  const booking = await Booking.create({
    userId,
    roomId,
    date,
    startTime,
    endTime,
    slot,
    purpose,
    bookedBy: user.name,
    userEmail: user.email,
    status: BOOKING_STATUS.CONFIRMED,
  });

  return {
    success: true,
    statusCode: 201,
    message: "Booking created successfully.",
    data: {
      booking,
    },
  };
};

const getAllBookings = async () => {
  const bookings = await Booking.find()
    .populate("userId", "name email role")
    .populate("roomId", "name location capacity status isActive")
    .sort({ date: 1, startTime: 1 });

  return {
    success: true,
    message: "Bookings fetched successfully.",
    data: {
      bookings,
      total: bookings.length,
    },
  };
};


const getUserBookings = async (userId) => {
  const bookings = await Booking.find({
    userId,
  })
    .populate("roomId", "name location capacity status isActive")
    .sort({ date: 1, startTime: 1 });

  return {
    success: true,
    message: "User bookings fetched successfully.",
    data: {
      bookings,
      total: bookings.length,
    },
  };
};


const getBookingsByRoomAndDate = async ({ roomId, date }) => {
  const bookings = await Booking.find({
    roomId,
    date,
    status: BOOKING_STATUS.CONFIRMED,
  }).sort({ startTime: 1 });

  return {
    success: true,
    message: "Room bookings fetched successfully.",
    data: {
      bookings,
      total: bookings.length,
    },
  };
};


const cancelBooking = async ({ bookingId, userId, isAdmin = false, reason = "" }) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return {
      success: false,
      statusCode: 404,
      message: "Booking not found.",
    };
  }

  const isBookingOwner = booking.userId.toString() === userId.toString();

  if (!isAdmin && !isBookingOwner) {
    return {
      success: false,
      statusCode: 403,
      message: "You can only cancel your own bookings.",
    };
  }

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    return {
      success: false,
      statusCode: 400,
      message: "Booking is already cancelled.",
    };
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  booking.cancelledAt = new Date();
  booking.cancelReason = reason || null;

  await booking.save();

  return {
    success: true,
    message: "Booking cancelled successfully.",
    data: {
      booking,
    },
  };
};

const rescheduleBooking = async ({
  bookingId,
  userId,
  isAdmin = false,
  newDate,
  newStartTime,
  newEndTime,
}) => {
  const validation = validateBookingInput({
    roomId: "temporary-room-check",
    date: newDate,
    startTime: newStartTime,
    endTime: newEndTime,
  });

  if (!validation.valid) {
    return {
      success: false,
      statusCode: 400,
      message: validation.message,
    };
  }

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return {
      success: false,
      statusCode: 404,
      message: "Booking not found.",
    };
  }

  const isBookingOwner = booking.userId.toString() === userId.toString();

  if (!isAdmin && !isBookingOwner) {
    return {
      success: false,
      statusCode: 403,
      message: "You can only reschedule your own bookings.",
    };
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    return {
      success: false,
      statusCode: 400,
      message: "Only confirmed bookings can be rescheduled.",
    };
  }

  const roomCheck = await checkRoomAvailability(booking.roomId);

  if (!roomCheck.available) {
    return {
      success: false,
      statusCode: 400,
      message: roomCheck.message,
    };
  }

  const conflictCheck = await checkBookingConflict({
    roomId: booking.roomId,
    date: newDate,
    startTime: newStartTime,
    endTime: newEndTime,
    excludeBookingId: bookingId,
  });

  if (conflictCheck.conflict) {
    return {
      success: false,
      statusCode: 409,
      message: conflictCheck.message,
      data: {
        conflictingBooking: conflictCheck.booking,
      },
    };
  }

  booking.date = newDate;
  booking.startTime = newStartTime;
  booking.endTime = newEndTime;
  booking.slot = `${newStartTime} - ${newEndTime}`;

  await booking.save();

  return {
    success: true,
    message: "Booking rescheduled successfully.",
    data: {
      booking,
    },
  };
};


const getAvailableSlots = async ({ roomId, date, slots = [] }) => {
  const roomCheck = await checkRoomAvailability(roomId);

  if (!roomCheck.available) {
    return {
      success: false,
      statusCode: 400,
      message: roomCheck.message,
    };
  }

  const bookings = await Booking.find({
    roomId,
    date,
    status: BOOKING_STATUS.CONFIRMED,
  });

  const bookedSlots = bookings.map((booking) => booking.slot);

  const availableSlots = slots.filter((slot) => !bookedSlots.includes(slot));

  return {
    success: true,
    message: "Available slots fetched successfully.",
    data: {
      availableSlots,
      bookedSlots,
    },
  };
};

module.exports = {
  createBooking,
  getAllBookings,
  getUserBookings,
  getBookingsByRoomAndDate,
  cancelBooking,
  rescheduleBooking,
  getAvailableSlots,
  checkBookingConflict,
  checkRoomAvailability,
};