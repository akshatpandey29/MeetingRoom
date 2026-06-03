const { Booking, Room, User, AdminRequest } = require("../models");
const {
  ADMIN_REQUEST_STATUS,
  BOOKING_STATUS,
  ROOM_STATUS,
  ROLES,
} = require("../utils/constants");
const {
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendBookingRequestStatusEmail,
} = require("./emailService");

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

const ACTIVE_BOOKING_STATUSES = [BOOKING_STATUS.CONFIRMED, "checked-in"];

// ── Format time helper for emails ─────────────────────────────────────────────
const formatTimeForEmail = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const dh = h % 12 || 12;
  return `${String(dh).padStart(2,'0')}:${String(m).padStart(2,'0')} ${period}`;
};

// ── Format date helper for emails ─────────────────────────────────────────────
const formatDateForEmail = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
};

const createBooking = async ({
  currentUser,
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

  const bookingUserId =
    currentUser?.role === ROLES.ADMIN && userId ? userId : currentUser?._id || userId;

  const user = await User.findById(bookingUserId);

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

 // Check if room is already booked at this time
const roomConflict = await Booking.find({
  roomId,
  date,
  status: { $in: [BOOKING_STATUS.CONFIRMED, 'checked-in'] },
});

const hasRoomConflict = roomConflict.find((booking) =>
  hasTimeConflict(booking.startTime, booking.endTime, startTime, endTime)
);

if (hasRoomConflict) {
  return {
    success: false,
    statusCode: 409,
    message: "This room is already booked for the selected time.",
  };
}

// Check if same user already has a booking at this time in ANY room
const userConflict = await Booking.find({
  userId: bookingUserId,
  date,
  status: { $in: [BOOKING_STATUS.CONFIRMED, 'checked-in'] },
});

const hasUserConflict = userConflict.find((booking) =>
  hasTimeConflict(booking.startTime, booking.endTime, startTime, endTime)
);

if (hasUserConflict) {
  return {
    success: false,
    statusCode: 409,
    message: `You already have a booking in ${hasUserConflict.roomName || 'another room'} at this time. You cannot book multiple rooms simultaneously.`,
  };
}

  const booking = await Booking.create({
    userId: bookingUserId,
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

  await booking.populate("userId", "name email role");
  await booking.populate("roomId", "name location capacity status isActive");

  // ── Send booking confirmation email ───────────────────────────────────────
  try {
    await sendBookingConfirmationEmail({
      to: user.email,
      name: user.name,
      roomName: room.name,
      date: formatDateForEmail(date),
      startTime: formatTimeForEmail(startTime),
      endTime: formatTimeForEmail(endTime),
    });
  } catch (emailError) {
    console.error('Booking confirmation email failed:', emailError.message);
    // Don't fail the booking if email fails
  }

  return {
    success: true,
    statusCode: 201,
    message: "Booking created successfully.",
    data: { booking },
  };
};

const createAdminRequest = async ({
  userId,
  roomId,
  date,
  startTime,
  endTime,
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

  const request = await AdminRequest.create({
    userId,
    roomId,
    date,
    startTime,
    endTime,
    slot: `${startTime} - ${endTime}`,
    requestedBy: user.name,
    userEmail: user.email,
    status: ADMIN_REQUEST_STATUS.PENDING,
  });

  await request.populate("userId", "name email role");
  await request.populate("roomId", "name location capacity status isActive");

  return {
    success: true,
    statusCode: 201,
    message: "Booking request sent to admin.",
    data: { request },
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

  await booking.populate("userId", "name email role");
  await booking.populate("roomId", "name location capacity status isActive");

  // ── Send booking cancellation email ───────────────────────────────────────
  try {
    await sendBookingCancellationEmail({
      to: booking.userEmail,
      name: booking.bookedBy,
      roomName: booking.roomId?.name || booking.roomName || '',
      date: formatDateForEmail(booking.date),
      startTime: formatTimeForEmail(booking.startTime),
      endTime: formatTimeForEmail(booking.endTime),
    });
  } catch (emailError) {
    console.error('Booking cancellation email failed:', emailError.message);
  }

  return {
    success: true,
    message: "Booking cancelled successfully.",
    data: { booking },
  };
};

const deleteBookingFromDatabase = async ({ bookingId }) => {
  const booking = await Booking.findByIdAndDelete(bookingId);

  if (!booking) {
    return {
      success: false,
      statusCode: 404,
      message: "Booking not found.",
    };
  }

  return {
    success: true,
    message: "Booking deleted from database successfully.",
    data: { bookingId },
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
    status: { $in: ACTIVE_BOOKING_STATUSES },
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

  const existingUserBookings = await Booking.find({
    userId: booking.userId,
    date: newDate,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    _id: { $ne: bookingId },
  });

  const userConflict = existingUserBookings.find((existingBooking) =>
    hasTimeConflict(
      existingBooking.startTime,
      existingBooking.endTime,
      newStartTime,
      newEndTime
    )
  );

  if (userConflict) {
    return {
      success: false,
      statusCode: 409,
      message: isAdmin
        ? "This user already has another room booked at this time."
        : "You already have another room booked at this time.",
    };
  }

  booking.date = newDate;
  booking.startTime = newStartTime;
  booking.endTime = newEndTime;
  booking.slot = `${newStartTime} - ${newEndTime}`;

  await booking.save();

  await booking.populate("userId", "name email role");
  await booking.populate("roomId", "name location capacity status isActive");

  // ── Send reschedule confirmation email ────────────────────────────────────
  try {
    await sendBookingConfirmationEmail({
      to: booking.userEmail,
      name: booking.bookedBy,
      roomName: room.name,
      date: formatDateForEmail(newDate),
      startTime: formatTimeForEmail(newStartTime),
      endTime: formatTimeForEmail(newEndTime),
    });
  } catch (emailError) {
    console.error('Reschedule email failed:', emailError.message);
  }

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
    status: { $in: [BOOKING_STATUS.CONFIRMED, 'checked-in'] },
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
    status: { $in: [BOOKING_STATUS.CONFIRMED, 'checked-in'] },
  });

  const bookedSlots = bookings.map((booking) => booking.slot);

  const availableSlots = slots.filter((slot) => {
    const [slotStart, slotEnd] = slot.split(" - ");
    const hasConflict = bookings.some((booking) =>
      hasTimeConflict(booking.startTime, booking.endTime, slotStart, slotEnd)
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

// ── Approve Admin Request (with email) ────────────────────────────────────────
const approveAdminRequest = async ({ requestId, adminNote = "" }) => {
  const request = await AdminRequest.findById(requestId)
    .populate("userId", "name email")
    .populate("roomId", "name location");

  if (!request) {
    return { success: false, statusCode: 404, message: "Request not found." };
  }

  if (request.status !== ADMIN_REQUEST_STATUS.PENDING) {
    return {
      success: false,
      statusCode: 400,
      message: "Only pending requests can be approved.",
    };
  }

  const bookingResult = await createBooking({
    userId: request.userId?._id || request.userId,
    roomId: request.roomId?._id || request.roomId,
    date: request.date,
    startTime: request.startTime,
    endTime: request.endTime,
  });

  if (!bookingResult.success) {
    return bookingResult;
  }

  request.status = ADMIN_REQUEST_STATUS.APPROVED;
  request.adminNote = adminNote;
  request.reviewedAt = new Date();
  await request.save();

  // Send approval email
  try {
    await sendBookingRequestStatusEmail({
      to: request.userEmail,
      name: request.requestedBy,
      status: 'approved',
      roomName: request.roomId?.name || '',
      date: formatDateForEmail(request.date),
      startTime: formatTimeForEmail(request.startTime),
      endTime: formatTimeForEmail(request.endTime),
      adminNote,
    });
  } catch (emailError) {
    console.error('Approval email failed:', emailError.message);
  }

  return {
    success: true,
    message: "Request approved and booking created successfully.",
    data: { request, booking: bookingResult.data.booking },
  };
};

// ── Reject Admin Request (with email) ─────────────────────────────────────────
const rejectAdminRequest = async ({ requestId, adminNote = "" }) => {
  const request = await AdminRequest.findById(requestId)
    .populate("userId", "name email")
    .populate("roomId", "name location");

  if (!request) {
    return { success: false, statusCode: 404, message: "Request not found." };
  }

  request.status = ADMIN_REQUEST_STATUS.REJECTED;
  request.adminNote = adminNote;
  request.reviewedAt = new Date();
  await request.save();

  // Send rejection email
  try {
    await sendBookingRequestStatusEmail({
      to: request.userEmail,
      name: request.requestedBy,
      status: 'rejected',
      roomName: request.roomId?.name || '',
      date: formatDateForEmail(request.date),
      startTime: formatTimeForEmail(request.startTime),
      endTime: formatTimeForEmail(request.endTime),
      adminNote,
    });
  } catch (emailError) {
    console.error('Rejection email failed:', emailError.message);
  }

  return {
    success: true,
    message: "Request rejected.",
    data: { request },
  };
};

module.exports = {
  createBooking,
  createAdminRequest,
  getAllBookings,
  getUserBookings,
  cancelBooking,
  deleteBookingFromDatabase,
  rescheduleBooking,
  getBookingsByRoomAndDate,
  getAvailableSlots,
  hasTimeConflict,
  approveAdminRequest,
  rejectAdminRequest,
};
