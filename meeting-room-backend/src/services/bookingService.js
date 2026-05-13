const { Booking, Room, User } = require("../models");
const { BOOKING_STATUS, ROOM_STATUS } = require("../utils/constants");

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

const createBooking = async ({
  userId,
  roomId,
  date,
  startTime,
  endTime,
  purpose = "",
}) => {
  if (!roomId || !date || !startTime || !endTime) {
    return {
      success: false,
      statusCode: 400,
      message: "Room, date, start time, and end time are required.",
    };
  }

  if (convertTimeToMinutes(endTime) <= convertTimeToMinutes(startTime)) {
    return {
      success: false,
      statusCode: 400,
      message: "End time must be after start time.",
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

  const room = await Room.findById(roomId);

  if (!room) {
    return {
      success: false,
      statusCode: 404,
      message: "Meeting room not found.",
    };
  }

  if (!room.isActive || room.status !== ROOM_STATUS.AVAILABLE) {
    return {
      success: false,
      statusCode: 400,
      message: "Please select an active meeting room.",
    };
  }

  const existingBookings = await Booking.find({
    roomId,
    date,
    status: BOOKING_STATUS.CONFIRMED,
  });

  const conflict = existingBookings.find((booking) =>
    hasTimeConflict(
      booking.startTime,
      booking.endTime,
      startTime,
      endTime
    )
  );

  if (conflict) {
    return {
      success: false,
      statusCode: 409,
      message: "This time conflicts with an existing booking.",
    };
  }

  const booking = await Booking.create({
    userId,
    roomId,
    date,
    startTime,
    endTime,
    slot: `${startTime} - ${endTime}`,
    purpose,
    bookedBy: user.name,
    userEmail: user.email,
    status: BOOKING_STATUS.CONFIRMED,
  });

  return {
    success: true,
    statusCode: 201,
    message: "Booking created successfully.",
    data: { booking },
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
  const bookings = await Booking.find({ userId })
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

const cancelBooking = async ({
  bookingId,
  userId,
  isAdmin = false,
  reason = "",
}) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return {
      success: false,
      statusCode: 404,
      message: "Booking not found.",
    };
  }

  const isOwner = booking.userId.toString() === userId.toString();

  if (!isAdmin && !isOwner) {
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
    data: { booking },
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
  if (!newDate || !newStartTime || !newEndTime) {
    return {
      success: false,
      statusCode: 400,
      message: "New date, start time, and end time are required.",
    };
  }

  if (convertTimeToMinutes(newEndTime) <= convertTimeToMinutes(newStartTime)) {
    return {
      success: false,
      statusCode: 400,
      message: "End time must be after start time.",
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

  const isOwner = booking.userId.toString() === userId.toString();

  if (!isAdmin && !isOwner) {
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

  const room = await Room.findById(booking.roomId);

  if (!room) {
    return {
      success: false,
      statusCode: 404,
      message: "Meeting room not found.",
    };
  }

  if (!room.isActive || room.status !== ROOM_STATUS.AVAILABLE) {
    return {
      success: false,
      statusCode: 400,
      message: "Please select an active meeting room.",
    };
  }

  const existingBookings = await Booking.find({
    roomId: booking.roomId,
    date: newDate,
    status: BOOKING_STATUS.CONFIRMED,
    _id: { $ne: bookingId },
  });

  const conflict = existingBookings.find((existingBooking) =>
    hasTimeConflict(
      existingBooking.startTime,
      existingBooking.endTime,
      newStartTime,
      newEndTime
    )
  );

  if (conflict) {
    return {
      success: false,
      statusCode: 409,
      message: "This time conflicts with an existing booking.",
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
    data: { booking },
  };
};

const getBookingsByRoomAndDate = async ({ roomId, date }) => {
  if (!roomId || !date) {
    return {
      success: false,
      statusCode: 400,
      message: "Room and date are required.",
    };
  }

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

const getAvailableSlots = async ({ roomId, date, slots = [] }) => {
  if (!roomId || !date) {
    return {
      success: false,
      statusCode: 400,
      message: "Room and date are required.",
    };
  }

  const room = await Room.findById(roomId);

  if (!room) {
    return {
      success: false,
      statusCode: 404,
      message: "Meeting room not found.",
    };
  }

  if (!room.isActive || room.status !== ROOM_STATUS.AVAILABLE) {
    return {
      success: false,
      statusCode: 400,
      message: "Please select an active meeting room.",
    };
  }

  const bookings = await Booking.find({
    roomId,
    date,
    status: BOOKING_STATUS.CONFIRMED,
  });

  const bookedSlots = bookings.map((booking) => booking.slot);

  const availableSlots = slots.filter((slot) => {
    const [slotStart, slotEnd] = slot.split(" - ");

    const hasConflict = bookings.some((booking) =>
      hasTimeConflict(
        booking.startTime,
        booking.endTime,
        slotStart,
        slotEnd
      )
    );

    return !hasConflict;
  });

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
  cancelBooking,
  rescheduleBooking,
  getBookingsByRoomAndDate,
  getAvailableSlots,
  hasTimeConflict,
};