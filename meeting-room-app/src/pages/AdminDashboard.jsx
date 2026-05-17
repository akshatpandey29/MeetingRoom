import { useState } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaPowerOff,
  FaMapMarkerAlt,
  FaUsers,
  FaDoorOpen,
  FaBell,
  FaCalendarAlt,
  FaCheck,
  FaClock,
  FaFileCsv,
  FaFilter,
  FaList,
  FaSearch,
  FaThLarge,
  FaTimes,
  FaUser,
} from "react-icons/fa";

import ConfirmModal from "../components/ConfirmModal";
import DateSelector from "../components/DateSelector";
import TimePickerWheel from "../components/TimePickerWheel";
import { useRooms } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";
import AdminExports from "../admin/AdminExports";
import AdminSidebar from "../admin/AdminSidebar";
import AdminGlobalSearch from "../admin/AdminGlobalSearch";
import UserManagement from "../admin/UserManagement";

function AdminDashboard() {
  const {
    rooms,
    bookings,
    adminRequests,
    bookSlot,
    cancelBooking,
    rescheduleBooking,
    addRoom,
    updateRoom,
    deleteRoom,
    toggleRoomActive,
    updateAdminRequest,
  } = useRooms();

  const { users, normalUsers, changeUserRole, toggleUserStatus } = useAuth();

  const [activeSection, setActiveSection] = useState("bookings");
  const [globalSearch] = useState("");

  const [toast, setToast] = useState({
    show: false,
    type: "",
    message: "",
  });

  const [modalData, setModalData] = useState({
    open: false,
    type: "",
    title: "",
    message: "",
    confirmText: "",
    tone: "blue",
    payload: null,
  });

  function showToast(type, message) {
    setToast({
      show: true,
      type,
      message,
    });

    setTimeout(() => {
      setToast({
        show: false,
        type: "",
        message: "",
      });
    }, 2800);
  }

  function openModal({ type, title, message, confirmText, tone = "blue", payload }) {
    setModalData({
      open: true,
      type,
      title,
      message,
      confirmText,
      tone,
      payload,
    });
  }

  function closeModal() {
    setModalData({
      open: false,
      type: "",
      title: "",
      message: "",
      confirmText: "",
      tone: "blue",
      payload: null,
    });
  }

  function handleConfirmModal() {
    const { type, payload } = modalData;

    if (type === "cancelBooking") {
      cancelBooking(payload);
      showToast("success", "Booking cancelled successfully.");
    }

    if (type === "deleteRoom") {
      deleteRoom(payload);
      showToast("success", "Room deleted successfully.");
    }

    if (type === "toggleRoom" || type === "toggleRoomActive") {
  toggleRoomActive(payload);
  showToast("success", "Room visibility updated successfully.");
}

if (type === "changeRoomStatus") {
  const selectedRoom = rooms.find(
    (room) => Number(room.id) === Number(payload)
  );

  if (!selectedRoom) {
    showToast("error", "Room not found.");
    closeModal();
    return;
  }

  updateRoom(selectedRoom.id, {
    ...selectedRoom,
    status:
      selectedRoom.status === "available" ? "unavailable" : "available",
  });

  showToast("success", "Room availability status updated successfully.");
}

    if (type === "rejectRequest") {
      updateAdminRequest(payload.id, "rejected");
      showToast("success", "Request rejected successfully.");
    }

    if (type === "approveRequest") {
      const room = rooms.find((item) => Number(item.id) === Number(payload.roomId));

      if (!room) {
        showToast("error", "Room no longer exists. Request cannot be approved.");
        closeModal();
        return;
      }

      const requestStartTime = payload.startTime || getStartFromSlot(payload.slot);
      const requestEndTime = payload.endTime || getEndFromSlot(payload.slot);

      const conflict = hasBookingConflict({
        bookings,
        roomId: payload.roomId,
        date: payload.date,
        startTime: requestStartTime,
        endTime: requestEndTime,
      });

      if (conflict) {
        showToast("error", "This request conflicts with an existing booking.");
        closeModal();
        return;
      }

      const slot = `${formatTime(requestStartTime)} - ${formatTime(requestEndTime)}`;

      const result = bookSlot({
        roomId: room.id,
        roomName: room.name,
        date: payload.date,
        slot,
        startTime: requestStartTime,
        endTime: requestEndTime,
        bookedBy: payload.requestedBy || payload.bookedBy || "Employee",
        userEmail: payload.userEmail || "",
      });

      if (!result.success) {
        showToast("error", result.message || "Request could not be approved.");
        closeModal();
        return;
      }

      updateAdminRequest(payload.id, "approved");
      showToast("success", "Request approved and booking created successfully.");
    }

    if (type === "changeRole") {
      const result = changeUserRole(payload);
      showToast(
        result?.success === false ? "error" : "success",
        result?.message || "User role updated successfully."
      );
    }

    if (type === "toggleUser") {
      const result = toggleUserStatus(payload);
      showToast(
        result?.success === false ? "error" : "success",
        result?.message || "User status updated successfully."
      );
    }

    closeModal();
  }

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-5 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_430px] lg:items-center">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
              Admin Workspace
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Admin Control
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Manage employee bookings, room requests, users, rooms, and reports.
            </p>
          </div>

          <AdminGlobalSearch setActiveSection={setActiveSection} setBookingView={() => {}} />
        </div>
        {toast.show && (
          <Toast type={toast.type} message={toast.message} />
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
          <AdminSidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            pendingCount={
              adminRequests.filter((request) => request.status === "pending")
                .length
            }
          />

          <main className="space-y-5">
            {activeSection === "bookings" && (
              <BookingsSection
                rooms={rooms}
                bookings={bookings}
                users={normalUsers}
                globalSearch={globalSearch}
                bookSlot={bookSlot}
                rescheduleBooking={rescheduleBooking}
                openModal={openModal}
                showToast={showToast}
              />
            )}

            {activeSection === "requests" && (
              <RequestsSection
                rooms={rooms}
                bookings={bookings}
                adminRequests={adminRequests}
                globalSearch={globalSearch}
                bookSlot={bookSlot}
                updateAdminRequest={updateAdminRequest}
                openModal={openModal}
                showToast={showToast}
              />
            )}

            {activeSection === "users" && <UserManagement />}

            {activeSection === "rooms" && (
              <RoomsSection
                rooms={rooms}
                addRoom={addRoom}
                updateRoom={updateRoom}
                deleteRoom={deleteRoom}
                toggleRoomActive={toggleRoomActive}
                openModal={openModal}
                showToast={showToast}
              />
            )}

            {activeSection === "reports" && (
              <AdminExports bookings={bookings} rooms={rooms} users={users} />
            )}
          </main>
        </div>
      </div>

      <ConfirmModal
        isOpen={modalData.open}
        title={modalData.title}
        message={modalData.message}
        confirmText={modalData.confirmText}
        cancelText="No, Keep it"
        tone={modalData.tone || "red"}
        onCancel={closeModal}
        onConfirm={handleConfirmModal}
      />
    </section>
  );
}


function getBookingDateTime(booking) {
  const bookingDate = booking.date || "";

  const bookingStartTime =
    booking.startTime ||
    booking.slot?.split("-")[0]?.trim() ||
    booking.time?.split("-")[0]?.trim() ||
    "00:00";

  const formattedTime = convertTo24HourTime(bookingStartTime);

  const dateTime = new Date(`${bookingDate}T${formattedTime}`);

  if (Number.isNaN(dateTime.getTime())) {
    return new Date(`${bookingDate}T00:00`);
  }

  return dateTime;
}

function convertTo24HourTime(timeValue) {
  if (!timeValue) return "00:00";

  const cleanTime = String(timeValue).trim();

  // Already 24-hour format: 09:30
  if (/^\d{2}:\d{2}$/.test(cleanTime)) {
    return cleanTime;
  }

  // Handles 9:30, 9:00, 14:30
  if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
    const [hours, minutes] = cleanTime.split(":");

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // Handles 9:30 AM, 09:30 AM, 2:00 PM
  const match = cleanTime.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (!match) {
    return "00:00";
  }

  let hours = Number(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) {
    hours += 12;
  }

  if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function BookingsSection({
  rooms,
  bookings,
  users,
  globalSearch,
  bookSlot,
  rescheduleBooking,
  openModal,
  showToast,
}) {
  const [viewMode, setViewMode] = useState("list");

  const [bookingForm, setBookingForm] = useState({
    employeeName: "",
    employeeEmail: "",
    roomId: "",
    date: getTodayDate(),
    startTime: "",
    endTime: "",
  });

  const [bookingSearch, setBookingSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(getTodayDate());
  const [roomFilter, setRoomFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingBookingId, setEditingBookingId] = useState(null);
  const [editData, setEditData] = useState({
    newDate: "",
    newStartTime: "",
    newEndTime: "",
  });

  const todayBookingsCount = bookings.filter(
    (booking) => booking.date === getTodayDate()
  ).length;

  const upcomingBookingsCount = bookings.filter(
    (booking) => booking.date >= getTodayDate()
  ).length;

  const completedBookingsCount = bookings.filter(
    (booking) => booking.date < getTodayDate()
  ).length;

  const activeRooms = rooms.filter(
    (room) => room.isActive && room.status === "available"
  );

  const filteredBookings = bookings
  .filter((booking) => {
    const combinedSearch = `${globalSearch} ${bookingSearch}`
      .trim()
      .toLowerCase();

    const matchesSearch =
      !combinedSearch ||
      booking.roomName?.toLowerCase().includes(combinedSearch) ||
      booking.bookedBy?.toLowerCase().includes(combinedSearch) ||
      booking.userEmail?.toLowerCase().includes(combinedSearch) ||
      booking.date?.toLowerCase().includes(combinedSearch) ||
      booking.slot?.toLowerCase().includes(combinedSearch);

    const matchesDate = !dateFilter || booking.date === dateFilter;

    const matchesRoom =
      !roomFilter || Number(booking.roomId) === Number(roomFilter);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "upcoming" && booking.date >= getTodayDate()) ||
      (statusFilter === "completed" && booking.date < getTodayDate());

    return matchesSearch && matchesDate && matchesRoom && matchesStatus;
  })
  .sort((firstBooking, secondBooking) => {
    const firstDateTime = getBookingDateTime(firstBooking);
    const secondDateTime = getBookingDateTime(secondBooking);

    return firstDateTime - secondDateTime;
  });

  function handleEmployeeSelect(value) {
  const selectedUser = users.find((user) => String(user.id) === value);

  if (!selectedUser) {
    setBookingForm((previous) => ({
      ...previous,
      employeeName: "",
      employeeEmail: "",
    }));
    return;
  }

  setBookingForm((previous) => ({
    ...previous,
    employeeName: selectedUser.name,
    employeeEmail: selectedUser.email,
  }));
}

  function handleCreateBooking() {
    if (!bookingForm.employeeName.trim()) {
      showToast("error", "Please select or enter employee name.");
      return;
    }

    if (!bookingForm.employeeEmail.trim()) {
      showToast("error", "Please enter employee email.");
      return;
    }

    if (!bookingForm.roomId) {
      showToast("error", "Please select a room.");
      return;
    }

    if (!bookingForm.date) {
      showToast("error", "Please select a date.");
      return;
    }

    if (bookingForm.date < getTodayDate()) {
      showToast("error", "Past date booking is not allowed.");
      return;
    }

    if (!bookingForm.startTime || !bookingForm.endTime) {
      showToast("error", "Please select start time and end time.");
      return;
    }

    if (
      convertTimeToMinutes(bookingForm.endTime) <=
      convertTimeToMinutes(bookingForm.startTime)
    ) {
      showToast("error", "End time must be after start time.");
      return;
    }

    const selectedRoom = rooms.find(
      (room) => Number(room.id) === Number(bookingForm.roomId)
    );

    if (!selectedRoom) {
      showToast("error", "Selected room was not found.");
      return;
    }

    if (!selectedRoom.isActive || selectedRoom.status !== "available") {
      showToast("error", "Selected room is not active or available.");
      return;
    }

    const conflict = hasBookingConflict({
      bookings,
      roomId: bookingForm.roomId,
      date: bookingForm.date,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime,
    });

    if (conflict) {
      showToast(
        "error",
        "This room is already booked for the selected time range."
      );
      return;
    }

    const slot = `${formatTime(bookingForm.startTime)} - ${formatTime(
      bookingForm.endTime
    )}`;

    const result = bookSlot({
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      date: bookingForm.date,
      slot,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime,
      bookedBy: bookingForm.employeeName,
      userEmail: bookingForm.employeeEmail,
    });

    if (!result.success) {
      showToast("error", result.message || "Booking could not be created.");
      return;
    }

    showToast("success", "Booking created successfully.");

    setBookingForm({
      employeeName: "",
      employeeEmail: "",
      roomId: "",
      date: getTodayDate(),
      startTime: "",
      endTime: "",
    });
  }

  function startReschedule(booking) {
    setEditingBookingId(booking.id);
    setEditData({
      newDate: booking.date,
      newStartTime: booking.startTime || getStartFromSlot(booking.slot),
      newEndTime: booking.endTime || getEndFromSlot(booking.slot),
    });
  }

  function saveReschedule(booking) {
    if (!editData.newDate || !editData.newStartTime || !editData.newEndTime) {
      showToast("error", "Please select date, start time, and end time.");
      return;
    }

    if (editData.newDate < getTodayDate()) {
      showToast("error", "Past date reschedule is not allowed.");
      return;
    }

    if (
      convertTimeToMinutes(editData.newEndTime) <=
      convertTimeToMinutes(editData.newStartTime)
    ) {
      showToast("error", "End time must be after start time.");
      return;
    }

    const conflict = hasBookingConflict({
      bookings,
      roomId: booking.roomId,
      date: editData.newDate,
      startTime: editData.newStartTime,
      endTime: editData.newEndTime,
      excludeBookingId: booking.id,
    });

    if (conflict) {
      showToast("error", "Another booking already exists for this time.");
      return;
    }

    const newSlot = `${formatTime(editData.newStartTime)} - ${formatTime(
      editData.newEndTime
    )}`;

    const result = rescheduleBooking(booking.id, editData.newDate, newSlot, {
      startTime: editData.newStartTime,
      endTime: editData.newEndTime,
    });

    if (!result.success) {
      showToast("error", result.message || "Booking could not be rescheduled.");
      return;
    }

    showToast("success", "Booking rescheduled successfully.");
    setEditingBookingId(null);
  }

  function clearFilters() {
    setBookingSearch("");
    setDateFilter("");
    setRoomFilter("");
    setStatusFilter("all");
  }

  return (
    <>
      <SectionTitle
        eyebrow="Bookings"
        title="Booking Management"
        description="Create employee bookings and manage existing room schedules."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard
          title="Total"
          value={bookings.length}
          helper="All bookings"
          icon={<FaCalendarAlt />}
          tone="blue"
        />

        <StatCard
          title="Today"
          value={todayBookingsCount}
          helper="Bookings today"
          icon={<FaClock />}
          tone="purple"
        />

        <StatCard
          title="Upcoming"
          value={upcomingBookingsCount}
          helper="Future bookings"
          icon={<FaCheckCircle />}
          tone="green"
        />

        <StatCard
          title="Completed"
          value={completedBookingsCount}
          helper="Past bookings"
          icon={<FaFileCsv />}
          tone="slate"
        />
      </div>

      <Card>
        <CardHeader
          title="Book Room for User"
          description="Admin can create a booking directly for an employee."
        />

        <div className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Field label="User">
              <select
                value={
                  users.find(
                    (user) =>
                      user.name === bookingForm.employeeName &&
                      user.email === bookingForm.employeeEmail
                  )?.id || ""
                }
                onChange={(event) => handleEmployeeSelect(event.target.value)}
                className="admin-input"
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Room">
              <select
                value={bookingForm.roomId}
                onChange={(event) =>
                  setBookingForm((previous) => ({
                    ...previous,
                    roomId: event.target.value,
                  }))
                }
                className="admin-input"
              >
                <option value="">Select room</option>
                {activeRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} - {room.location}
                  </option>
                ))}
              </select>
            </Field>

            <DateSelector
              value={bookingForm.date}
              onChange={(value) =>
                setBookingForm((previous) => ({
                  ...previous,
                  date: value,
                }))
              }
              label="Date"
            />

            <Field label="Start Time">
              <TimePickerWheel
                value={bookingForm.startTime}
                onChange={(value) =>
                  setBookingForm((previous) => ({
                    ...previous,
                    startTime: value,
                    endTime: "",
                  }))
                }
                label="Start time"
              />
            </Field>

            <Field label="End Time">
              <TimePickerWheel
                value={bookingForm.endTime}
                onChange={(value) =>
                  setBookingForm((previous) => ({
                    ...previous,
                    endTime: value,
                  }))
                }
                disabled={!bookingForm.startTime}
                label="End time"
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={handleCreateBooking}
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FaCalendarAlt size={13} />
            Book Room for User
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">All Bookings</h3>
            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredBookings.length} of {bookings.length} bookings.
            </p>
          </div>

          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Search">
            <div className="relative">
              <FaSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={13}
              />

              <input
                type="text"
                value={bookingSearch}
                onChange={(event) => setBookingSearch(event.target.value)}
                placeholder="Search room, user, email..."
                className="admin-input pl-10"
              />
            </div>
          </Field>

          <DateSelector
            value={dateFilter}
            onChange={setDateFilter}
            label="Date"
          />

          <Field label="Room">
            <select
              value={roomFilter}
              onChange={(event) => setRoomFilter(event.target.value)}
              className="admin-input"
            >
              <option value="">All Rooms</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="admin-input"
            >
              <option value="all">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </Field>

          <button
            type="button"
            onClick={clearFilters}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 md:w-fit"
          >
            <FaFilter size={13} />
            Clear Filters
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <EmptyState title="No bookings found" />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                editing={editingBookingId === booking.id}
                editData={editData}
                setEditData={setEditData}
                onEdit={() => startReschedule(booking)}
                onCancelEdit={() => setEditingBookingId(null)}
                onSave={() => saveReschedule(booking)}
                onCancelBooking={() =>
                  openModal({
                    type: "cancelBooking",
                    title: "Cancel Booking",
                    message:
                      "Are you sure you want to cancel this booking? This action cannot be undone.",
                    confirmText: "Yes, Cancel",
                    tone: "red",
                    payload: booking.id,
                  })
                }
              />
            ))}
          </div>
        ) : (
          <BookingTable
            bookings={filteredBookings}
            editingBookingId={editingBookingId}
            editData={editData}
            setEditData={setEditData}
            startReschedule={startReschedule}
            saveReschedule={saveReschedule}
            setEditingBookingId={setEditingBookingId}
            openModal={openModal}
          />
        )}
      </Card>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Requests */
/* -------------------------------------------------------------------------- */

function RequestsSection({
  rooms,
  bookings,
  adminRequests,
  globalSearch,
  bookSlot,
  updateAdminRequest,
  openModal,
  showToast,
}) {
  const [requestFilter, setRequestFilter] = useState("all");

  const filteredRequests = adminRequests.filter((request) => {
    const searchValue = globalSearch.toLowerCase();

    const matchesSearch =
      !searchValue ||
      request.roomName?.toLowerCase().includes(searchValue) ||
      request.requestedBy?.toLowerCase().includes(searchValue) ||
      request.bookedBy?.toLowerCase().includes(searchValue) ||
      request.userEmail?.toLowerCase().includes(searchValue) ||
      request.date?.toLowerCase().includes(searchValue) ||
      request.slot?.toLowerCase().includes(searchValue);

    const matchesStatus =
      requestFilter === "all" || request.status === requestFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingRequests = adminRequests.filter(
    (request) => request.status === "pending"
  ).length;

  const approvedRequests = adminRequests.filter(
    (request) => request.status === "approved"
  ).length;

  const rejectedRequests = adminRequests.filter(
    (request) => request.status === "rejected"
  ).length;

  function handleApproveRequest(request) {
    const room = rooms.find((item) => Number(item.id) === Number(request.roomId));

    if (!room) {
      showToast("error", "Room no longer exists. Request cannot be approved.");
      return;
    }

    if (!room.isActive || room.status !== "available") {
      showToast(
        "error",
        "Request cannot be approved because this room is not active or available."
      );
      return;
    }

    if (!request.date) {
      showToast("error", "Request date is missing.");
      return;
    }

    if (request.date < getTodayDate()) {
      showToast("error", "Past booking requests cannot be approved.");
      return;
    }

    const requestStartTime =
      request.startTime || getStartFromSlot(request.slot);
    const requestEndTime = request.endTime || getEndFromSlot(request.slot);

    if (!requestStartTime || !requestEndTime) {
      showToast("error", "Request time is missing.");
      return;
    }

    if (
      convertTimeToMinutes(requestEndTime) <=
      convertTimeToMinutes(requestStartTime)
    ) {
      showToast("error", "Request time is invalid.");
      return;
    }

    const conflict = hasBookingConflict({
      bookings,
      roomId: request.roomId,
      date: request.date,
      startTime: requestStartTime,
      endTime: requestEndTime,
    });

    if (conflict) {
      showToast(
        "error",
        "This request conflicts with an existing booking. Ask the user to choose another time."
      );
      return;
    }

    openModal({
      type: "approveRequest",
      title: "Approve Booking Request",
      message: `Approve this request for ${request.roomName} on ${request.date}? A confirmed booking will be created for the employee.`,
      confirmText: "Yes, Approve",
      tone: "green",
      payload: request,
    });
  }

  function handleRejectRequest(request) {
    openModal({
      type: "rejectRequest",
      title: "Reject Booking Request",
      message: `Reject this booking request for ${request.roomName}? This action will mark the request as rejected.`,
      confirmText: "Yes, Reject",
      tone: "red",
      payload: request,
    });
  }

  return (
    <>
      <SectionTitle
        eyebrow="Requests"
        title="Booking Requests"
        description="Review employee requests and approve only valid available slots."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          title="Pending"
          value={pendingRequests}
          helper="Needs review"
          icon={<FaBell />}
          tone="amber"
        />

        <StatCard
          title="Approved"
          value={approvedRequests}
          helper="Confirmed"
          icon={<FaCheckCircle />}
          tone="green"
        />

        <StatCard
          title="Rejected"
          value={rejectedRequests}
          helper="Not approved"
          icon={<FaTimesCircle />}
          tone="red"
        />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">All Requests</h3>
            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredRequests.length} requests.
            </p>
          </div>

          <select
            value={requestFilter}
            onChange={(event) => setRequestFilter(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="p-4">
          {filteredRequests.length === 0 ? (
            <EmptyState title="No requests found" />
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => {
                const room = rooms.find(
                  (item) => Number(item.id) === Number(request.roomId)
                );

                const requestStartTime =
                  request.startTime || getStartFromSlot(request.slot);
                const requestEndTime =
                  request.endTime || getEndFromSlot(request.slot);

                const hasConflict = hasBookingConflict({
                  bookings,
                  roomId: request.roomId,
                  date: request.date,
                  startTime: requestStartTime,
                  endTime: requestEndTime,
                });

                const isRoomUnavailable =
                  !room || !room.isActive || room.status !== "available";

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">
                            {request.roomName}
                          </h3>

                          <StatusBadge status={request.status} />
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
                          <p>
                            <span className="font-semibold text-slate-700">
                              Date:
                            </span>{" "}
                            {request.date}
                          </p>

                          <p>
                            <span className="font-semibold text-slate-700">
                              Time:
                            </span>{" "}
                            {request.slot}
                          </p>

                          <p>
                            <span className="font-semibold text-slate-700">
                              Requested by:
                            </span>{" "}
                            {request.requestedBy || request.bookedBy || "User"}
                          </p>

                          <p>
                            <span className="font-semibold text-slate-700">
                              Email:
                            </span>{" "}
                            {request.userEmail}
                          </p>
                        </div>

                        {request.status === "pending" && hasConflict && (
                          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                            Conflict found: this room is already booked during
                            this time.
                          </p>
                        )}

                        {request.status === "pending" && isRoomUnavailable && (
                          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                            Room is inactive, unavailable, or deleted.
                          </p>
                        )}
                      </div>

                      {request.status === "pending" && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveRequest(request)}
                            disabled={hasConflict || isRoomUnavailable}
                            className={`admin-action-green ${
                              hasConflict || isRoomUnavailable
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }`}
                          >
                            <FaCheck size={13} />
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRejectRequest(request)}
                            className="admin-action-red"
                          >
                            <FaTimes size={13} />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Rooms */
/* -------------------------------------------------------------------------- */

function RoomsSection({
  rooms,
  openModal,
  addRoom,
  updateRoom,
  deleteRoom,
  toggleRoomActive,
  changeRoomStatus,
}) {
  const [showForm, setShowForm] = useState(false);

  const [editingRoom, setEditingRoom] = useState(null);

  const emptyRoomForm = {
    name: "",
    location: "",
    capacity: "",
    description: "",
    amenities: "",
    status: "available",
    isActive: true,
  };

  const [roomForm, setRoomForm] = useState(emptyRoomForm);

  const activeRooms = rooms.filter((room) => room.isActive).length;
  const inactiveRooms = rooms.length - activeRooms;

  const openAddRoomForm = () => {
    setEditingRoom(null);
    setRoomForm(emptyRoomForm);
    setShowForm(true);
  };

  const openEditRoomForm = (room) => {
    setEditingRoom(room);

    setRoomForm({
      name: room.name || "",
      location: room.location || "",
      capacity: room.capacity || "",
      description: room.description || "",
      amenities: Array.isArray(room.amenities)
        ? room.amenities.join(", ")
        : room.amenities || "",
      status: room.status || "available",
      isActive: room.isActive ?? true,
    });

    setShowForm(true);
  };

  const closeRoomForm = () => {
    setShowForm(false);
    setEditingRoom(null);
    setRoomForm(emptyRoomForm);
  };

  const handleRoomFormChange = (event) => {
    const { name, value } = event.target;

    setRoomForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleRoomSubmit = (event) => {
    event.preventDefault();

    const formattedRoom = {
      ...roomForm,
      capacity: Number(roomForm.capacity),
      amenities: roomForm.amenities
        .split(",")
        .map((amenity) => amenity.trim())
        .filter(Boolean),
      isActive: roomForm.isActive === true || roomForm.isActive === "true",
    };

    if (editingRoom) {
      updateRoom(editingRoom.id, formattedRoom);
    } else {
      addRoom(formattedRoom);
    }

    closeRoomForm();
  };

  return (
    <section className="space-y-5">
      <SectionHeader
        eyebrow="Rooms"
        title="Room Management"
        description="Add rooms, update details, and control room availability."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          icon={<FaDoorOpen />}
          label="Total Rooms"
          value={rooms.length}
          helper="All meeting rooms"
          tone="blue"
        />

        <SummaryCard
          icon={<FaCheckCircle />}
          label="Active"
          value={activeRooms}
          helper="Visible to employees"
          tone="green"
        />

        <SummaryCard
          icon={<FaTimesCircle />}
          label="Inactive"
          value={inactiveRooms}
          helper="Hidden from booking"
          tone="red"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Rooms</h3>
            <p className="text-sm text-slate-500 mt-1">
              Manage meeting rooms used by employees.
            </p>
          </div>

          <button
            type="button"
            onClick={showForm ? closeRoomForm : openAddRoomForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FaPlus size={13} />
            {showForm ? "Close Form" : "Add Room"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleRoomSubmit}
            className="border-b border-slate-100 bg-slate-50/70 px-5 py-5"
          >
            <div className="mb-4">
              <h4 className="text-base font-bold text-slate-900">
                {editingRoom ? "Edit Room Details" : "Add New Room"}
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                Fill room details carefully. These details will be visible to
                employees.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={roomForm.name}
                  onChange={handleRoomFormChange}
                  required
                  placeholder="Conference Room A"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={roomForm.location}
                  onChange={handleRoomFormChange}
                  required
                  placeholder="First Floor"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={roomForm.capacity}
                  onChange={handleRoomFormChange}
                  required
                  min="1"
                  placeholder="10"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={roomForm.status}
                  onChange={handleRoomFormChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={roomForm.description}
                  onChange={handleRoomFormChange}
                  placeholder="Best for client calls and team meetings"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Amenities
                </label>
                <input
                  type="text"
                  name="amenities"
                  value={roomForm.amenities}
                  onChange={handleRoomFormChange}
                  placeholder="Projector, Whiteboard, Wi-Fi"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeRoomForm}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {editingRoom ? "Update Room" : "Save Room"}
              </button>
            </div>
          </form>
        )}

        {rooms.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <FaDoorOpen size={22} />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              No rooms added yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Start by adding meeting rooms so employees can view and book
              available spaces.
            </p>

            <button
              type="button"
              onClick={openAddRoomForm}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <FaPlus size={13} />
              Add First Room
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rooms.map((room) => (
              <RoomManagementCard
                key={room.id}
                room={room}
                onEdit={openEditRoomForm}
                openModal={openModal}
                deleteRoom={deleteRoom}
                toggleRoomActive={toggleRoomActive}
                changeRoomStatus={changeRoomStatus}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
function SectionHeader({ eyebrow, title, description }) {
  return (
    <div>
      {eyebrow && (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
          {eyebrow}
        </p>
      )}

      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>

      {description && (
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}
function SummaryCard({ icon, label, value, helper, tone = "blue" }) {
  const toneClasses = {
    blue: {
      iconBox: "bg-blue-50 text-blue-600",
    },
    green: {
      iconBox: "bg-green-50 text-green-600",
    },
    red: {
      iconBox: "bg-red-50 text-red-600",
    },
    amber: {
      iconBox: "bg-amber-50 text-amber-600",
    },
    purple: {
      iconBox: "bg-purple-50 text-purple-600",
    },
    slate: {
      iconBox: "bg-slate-100 text-slate-600",
    },
  };

  const selectedTone = toneClasses[tone] || toneClasses.blue;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg ${selectedTone.iconBox}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-1 text-3xl font-bold leading-none text-slate-900">
            {value}
          </p>

          {helper && (
            <p className="mt-1 text-xs font-medium text-slate-400">
              {helper}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RoomManagementCard({
  room,
  onEdit,
  openModal,
  deleteRoom,
  toggleRoomActive,
  changeRoomStatus,
}) {
  const isAvailable = room.status === "available";
  const isActive = room.isActive;

  const amenities = Array.isArray(room.amenities) ? room.amenities : [];

  return (
    <div className="px-5 py-5 transition hover:bg-slate-50/70">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-bold text-slate-900">
              {room.name}
            </h4>

            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                isAvailable
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {isAvailable ? "Available" : "Unavailable"}
            </span>

            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <FaMapMarkerAlt className="text-slate-400" size={13} />
              {room.location || "No location"}
            </span>

            <span className="inline-flex items-center gap-2">
              <FaUsers className="text-slate-400" size={13} />
              {room.capacity || 0} people
            </span>
          </div>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            {room.description || "No description added for this room."}
          </p>

          {amenities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <button
            type="button"
            onClick={() => onEdit(room)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            <FaEdit size={13} />
            Edit
          </button>

          <button
            type="button"
            onClick={() =>
              openModal({
                type: "toggleRoomActive",
                payload: room.id,
                title: isActive ? "Deactivate Room" : "Activate Room",
                message: isActive
                  ? `Are you sure you want to deactivate ${room.name}? Employees will not be able to book this room.`
                  : `Are you sure you want to activate ${room.name}? Employees will be able to book this room.`,
                confirmText: isActive ? "Yes, Deactivate" : "Yes, Activate",
                tone: isActive ? "amber" : "green",
              })
            }
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            <FaPowerOff size={13} />
            {isActive ? "Deactivate" : "Activate"}
          </button>

          <button
            type="button"
            onClick={() =>
              openModal({
                type: "changeRoomStatus",
                payload: room.id,
                title: "Change Room Status",
                message: isAvailable
                  ? "Mark this room as unavailable? Employees will not be able to book it until it is available again."
                  : "Mark this room as available? Employees will be able to book it again.",
                confirmText: isAvailable
                  ? "Yes, Mark Unavailable"
                  : "Yes, Mark Available",
                tone: "blue",
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <FaEdit size={13} />
            Status
          </button>

          <button
            type="button"
            onClick={() =>
              openModal({
                type: "deleteRoom",
                payload: room.id,
                title: "Delete Room",
                message: `Are you sure you want to delete ${room.name}? This action cannot be undone.`,
                confirmText: "Yes, Delete",
                tone: "red",
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <FaTrash size={13} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/* Reports */
/* -------------------------------------------------------------------------- */
/* Reusable UI */
/* -------------------------------------------------------------------------- */

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
      {children}
    </div>
  );
}

function CardHeader({ title, description }) {
  return (
    <div className="border-b border-slate-100 p-4">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatCard({ title, value, helper, icon, tone }) {
  const toneClass = getToneClass(tone);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClass.soft} ${toneClass.text}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold leading-tight text-slate-900">
            {value}
          </h3>
          <p className="text-xs text-slate-400">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || "").toLowerCase();

  const styles = {
    available: "bg-green-100 text-green-700",
    active: "bg-blue-100 text-blue-700",
    inactive: "bg-slate-100 text-slate-600",
    unavailable: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    confirmed: "bg-green-100 text-green-700",
    admin: "bg-purple-100 text-purple-700",
    user: "bg-blue-100 text-blue-700",
    disabled: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
        styles[normalizedStatus] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function ViewToggle({ viewMode, setViewMode }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      <button
        type="button"
        onClick={() => setViewMode("grid")}
        className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
          viewMode === "grid"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <FaThLarge size={13} />
        Grid
      </button>

      <button
        type="button"
        onClick={() => setViewMode("list")}
        className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
          viewMode === "list"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <FaList size={13} />
        List
      </button>
    </div>
  );
}

function BookingCard({
  booking,
  editing,
  editData,
  setEditData,
  onEdit,
  onCancelEdit,
  onSave,
  onCancelBooking,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {booking.roomName}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Booked by {booking.bookedBy}
          </p>
        </div>

        <StatusBadge status="confirmed" />
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p>
          <FaCalendarAlt className="mr-2 inline text-blue-500" />
          Date: {booking.date}
        </p>

        <p>
          <FaClock className="mr-2 inline text-blue-500" />
          Time: {booking.slot}
        </p>

        <p>
          <FaUser className="mr-2 inline text-blue-500" />
          {booking.userEmail}
        </p>
      </div>

      {editing ? (
        <div className="mt-4 grid grid-cols-1 gap-3">
          <DateSelector
            value={editData.newDate}
            onChange={(value) =>
              setEditData((previous) => ({
                ...previous,
                newDate: value,
              }))
            }
            label="New Date"
          />

          <Field label="Start Time">
            <TimePickerWheel
              value={editData.newStartTime}
              onChange={(value) =>
                setEditData((previous) => ({
                  ...previous,
                  newStartTime: value,
                  newEndTime: "",
                }))
              }
              label="Start time"
            />
          </Field>

          <Field label="End Time">
            <TimePickerWheel
              value={editData.newEndTime}
              onChange={(value) =>
                setEditData((previous) => ({
                  ...previous,
                  newEndTime: value,
                }))
              }
              disabled={!editData.newStartTime}
              label="End time"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onSave} className="admin-action-green">
              <FaCheck size={13} />
              Save
            </button>

            <button
              type="button"
              onClick={onCancelEdit}
              className="admin-action-slate"
            >
              <FaTimes size={13} />
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onEdit} className="admin-action-blue">
            <FaEdit size={13} />
            Reschedule
          </button>

          <button
            type="button"
            onClick={onCancelBooking}
            className="admin-action-red"
          >
            <FaTrash size={13} />
            Cancel Booking
          </button>
        </div>
      )}
    </div>
  );
}

function BookingTable({
  bookings,
  editingBookingId,
  editData,
  setEditData,
  startReschedule,
  saveReschedule,
  setEditingBookingId,
  openModal,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Room</th>
            <th className="px-4 py-3 font-semibold">User</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Time</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-slate-50">
              <td className="px-4 py-4 font-semibold text-slate-900">
                {booking.roomName}
              </td>

              <td className="px-4 py-4">
                <p className="font-semibold text-slate-800">
                  {booking.bookedBy}
                </p>
                <p className="text-xs text-slate-500">{booking.userEmail}</p>
              </td>

              <td className="px-4 py-4 text-slate-600">{booking.date}</td>

              <td className="px-4 py-4 text-slate-600">{booking.slot}</td>

              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startReschedule(booking)}
                    className="admin-action-blue"
                  >
                    <FaEdit size={13} />
                    Reschedule
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openModal({
                        type: "cancelBooking",
                        title: "Cancel Booking",
                        message:
                          "Are you sure you want to cancel this booking?",
                        confirmText: "Yes, Cancel",
                        tone: "red",
                        payload: booking.id,
                      })
                    }
                    className="admin-action-red"
                  >
                    <FaTrash size={13} />
                    Cancel Booking
                  </button>
                </div>

                {editingBookingId === booking.id && (
                  <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-3">
                    <DateSelector
                      value={editData.newDate}
                      onChange={(value) =>
                        setEditData((previous) => ({
                          ...previous,
                          newDate: value,
                        }))
                      }
                      label="New Date"
                    />

                    <Field label="Start Time">
                      <TimePickerWheel
                        value={editData.newStartTime}
                        onChange={(value) =>
                          setEditData((previous) => ({
                            ...previous,
                            newStartTime: value,
                            newEndTime: "",
                          }))
                        }
                        label="Start time"
                      />
                    </Field>

                    <Field label="End Time">
                      <TimePickerWheel
                        value={editData.newEndTime}
                        onChange={(value) =>
                          setEditData((previous) => ({
                            ...previous,
                            newEndTime: value,
                          }))
                        }
                        disabled={!editData.newStartTime}
                        label="End time"
                      />
                    </Field>

                    <div className="flex gap-2 md:col-span-3">
                      <button
                        type="button"
                        onClick={() => saveReschedule(booking)}
                        className="admin-action-green"
                      >
                        <FaCheck size={13} />
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingBookingId(null)}
                        className="admin-action-slate"
                      >
                        <FaTimes size={13} />
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ title }) {
  return (
    <div className="p-8 text-center">
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">
        Try changing your search or filters.
      </p>
    </div>
  );
}


function Toast({ type = "success", message }) {
  const isError = type === "error";

  return (
    <div className="fixed left-1/2 top-20 z-[9999] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 sm:left-auto sm:right-6 sm:top-24 sm:w-auto sm:max-w-md sm:translate-x-0">
      <div
        className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-black/5 ${
          isError ? "bg-red-600" : "bg-green-600"
        }`}
      >
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs">
          {isError ? "!" : "✓"}
        </span>

        <p className="leading-5 break-words">{message}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers */
/* -------------------------------------------------------------------------- */

function getTodayDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function convertTimeToMinutes(timeValue) {
  if (!timeValue) return 0;

  const [hour, minute] = timeValue.split(":").map(Number);
  return hour * 60 + minute;
}

function formatTime(timeValue) {
  if (!timeValue) return "";

  const [hour, minute] = timeValue.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )} ${period}`;
}

function getStartFromSlot(slot) {
  if (!slot || !slot.includes("-")) return "";

  const start = slot.split("-")[0].trim();
  return convertDisplayTimeTo24Hour(start);
}

function getEndFromSlot(slot) {
  if (!slot || !slot.includes("-")) return "";

  const end = slot.split("-")[1].trim();
  return convertDisplayTimeTo24Hour(end);
}

function convertDisplayTimeTo24Hour(displayTime) {
  if (!displayTime) return "";

  const cleanTime = displayTime.trim().toUpperCase();

  if (!cleanTime.includes("AM") && !cleanTime.includes("PM")) {
    const [hour, minute] = cleanTime.split(":");
    return `${String(hour).padStart(2, "0")}:${String(minute || "00").padStart(
      2,
      "0"
    )}`;
  }

  const period = cleanTime.includes("PM") ? "PM" : "AM";
  const timeOnly = cleanTime.replace("AM", "").replace("PM", "").trim();

  let [hour, minute] = timeOnly.split(":").map(Number);

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute || 0).padStart(
    2,
    "0"
  )}`;
}

function hasBookingConflict({
  bookings,
  roomId,
  date,
  startTime,
  endTime,
  excludeBookingId = null,
}) {
  if (!roomId || !date || !startTime || !endTime) return false;

  const newStart = convertTimeToMinutes(startTime);
  const newEnd = convertTimeToMinutes(endTime);

  return bookings.some((booking) => {
    if (excludeBookingId && booking.id === excludeBookingId) {
      return false;
    }

    if (Number(booking.roomId) !== Number(roomId)) {
      return false;
    }

    if (booking.date !== date) {
      return false;
    }

    const existingStart =
      booking.startTime || getStartFromSlot(booking.slot || "");
    const existingEnd = booking.endTime || getEndFromSlot(booking.slot || "");

    if (!existingStart || !existingEnd) {
      return false;
    }

    const bookedStart = convertTimeToMinutes(existingStart);
    const bookedEnd = convertTimeToMinutes(existingEnd);

    return newStart < bookedEnd && newEnd > bookedStart;
  });
}

function getToneClass(tone) {
  const tones = {
    blue: {
      soft: "bg-blue-50",
      text: "text-blue-600",
    },
    green: {
      soft: "bg-green-50",
      text: "text-green-600",
    },
    purple: {
      soft: "bg-purple-50",
      text: "text-purple-600",
    },
    amber: {
      soft: "bg-amber-50",
      text: "text-amber-600",
    },
    red: {
      soft: "bg-red-50",
      text: "text-red-600",
    },
    slate: {
      soft: "bg-slate-100",
      text: "text-slate-600",
    },
  };

  return tones[tone] || tones.blue;
}

export default AdminDashboard;