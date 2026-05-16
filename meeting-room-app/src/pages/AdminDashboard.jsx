import { useMemo, useState } from "react";
import {
  FaBell,
  FaBuilding,
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaEdit,
  FaFileCsv,
  FaFileExcel,
  FaFilePdf,
  FaFilter,
  FaList,
  FaPlus,
  FaSearch,
  FaThLarge,
  FaTimes,
  FaTimesCircle,
  FaTrash,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import { useEffect } from "react";
import AdminSidebar from "../admin/AdminSidebar";
import AdminGlobalSearch from "../admin/AdminGlobalSearch";
import UserManagement from "../admin/UserManagement";
import AdminExports from "../admin/AdminExports";

import DateSelector from "../components/DateSelector";
import TimePickerWheel from "../components/TimePickerWheel";
import { useRooms } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";

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
  const [globalSearch, setGlobalSearch] = useState("");

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

    if (type === "toggleRoom") {
      toggleRoomActive(payload);
      showToast("success", "Room status updated successfully.");
    }

    if (type === "changeRole") {
      changeUserRole(payload);
      showToast("success", "User role updated successfully.");
    }

    if (type === "toggleUser") {
      toggleUserStatus(payload);
      showToast("success", "User status updated successfully.");
    }

    closeModal();
  }
  useEffect(() => {
  const handleAdminSectionChange = (event) => {
    setActiveSection(event.detail);
  };

  window.addEventListener("change-admin-section", handleAdminSectionChange);

  return () => {
    window.removeEventListener("change-admin-section", handleAdminSectionChange);
  };
}, []);

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

          <div className="relative">
            <FaSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={13}
            />

            <input
              type="text"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Search users, rooms, bookings..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {toast.show && <Toast type={toast.type} message={toast.message} />}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
          <AdminSidePanel
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
                showToast={showToast}
              />
            )}

            {activeSection === "users" && (
              <UsersSection
                users={users}
                globalSearch={globalSearch}
                openModal={openModal}
              />
            )}

            {activeSection === "rooms" && (
              <RoomsSection
                rooms={rooms}
                addRoom={addRoom}
                updateRoom={updateRoom}
                openModal={openModal}
                showToast={showToast}
              />
            )}

            {activeSection === "reports" && (
              <ReportsSection bookings={bookings} rooms={rooms} users={users} />
            )}
          </main>
        </div>
      </div>

      <ProfessionalModal
        open={modalData.open}
        title={modalData.title}
        message={modalData.message}
        confirmText={modalData.confirmText}
        tone={modalData.tone}
        onClose={closeModal}
        onConfirm={handleConfirmModal}
      />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar */
/* -------------------------------------------------------------------------- */

function AdminSidePanel({ activeSection, setActiveSection, pendingCount }) {
  const sidebarItems = [
    {
      key: "bookings",
      label: "Bookings",
      icon: <FaCalendarAlt />,
    },
    {
      key: "requests",
      label: "Requests",
      icon: <FaBell />,
      count: pendingCount,
    },
    {
      key: "users",
      label: "Users",
      icon: <FaUsers />,
    },
    {
      key: "rooms",
      label: "Rooms",
      icon: <FaBuilding />,
    },
    {
      key: "reports",
      label: "Reports",
      icon: <FaDownload />,
    },
  ];

  return (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="px-2 pb-3">
        <h2 className="text-base font-bold text-slate-900">Admin</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Office booking controls.
        </p>
      </div>

      <div className="space-y-1 border-t border-slate-100 pt-3">
        {sidebarItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveSection(item.key)}
            className={`flex h-10 w-full items-center justify-between rounded-xl px-3 text-sm font-semibold transition ${
              activeSection === item.key
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </span>

            {item.count > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  activeSection === item.key
                    ? "bg-white text-blue-600"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* Bookings */
/* -------------------------------------------------------------------------- */

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

  const filteredBookings = bookings.filter((booking) => {
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
                    confirmText: "Cancel Booking",
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

    const slot = `${formatTime(requestStartTime)} - ${formatTime(
      requestEndTime
    )}`;

    const result = bookSlot({
      roomId: room.id,
      roomName: room.name,
      date: request.date,
      slot,
      startTime: requestStartTime,
      endTime: requestEndTime,
      bookedBy: request.requestedBy || request.bookedBy || "Employee",
      userEmail: request.userEmail || "",
    });

    if (!result.success) {
      showToast("error", result.message || "Request could not be approved.");
      return;
    }

    updateAdminRequest(request.id, "approved");
    showToast("success", "Request approved and booking created successfully.");
  }

  function handleRejectRequest(request) {
    updateAdminRequest(request.id, "rejected");
    showToast("success", "Request rejected successfully.");
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
/* Users */
/* -------------------------------------------------------------------------- */

function UsersSection({ users, globalSearch, openModal }) {
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredUsers = users
    .filter((user) => {
      const searchValue = globalSearch.toLowerCase();

      const matchesSearch =
        !searchValue ||
        user.name?.toLowerCase().includes(searchValue) ||
        user.email?.toLowerCase().includes(searchValue);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (a.role !== "admin" && b.role === "admin") return 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <>
      <SectionTitle
        eyebrow="Users"
        title="User Management"
        description="View employees and manage access."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          title="Total Users"
          value={users.length}
          helper="All employees"
          icon={<FaUsers />}
          tone="blue"
        />

        <StatCard
          title="Admins"
          value={users.filter((user) => user.role === "admin").length}
          helper="Admin access"
          icon={<FaUser />}
          tone="purple"
        />

        <StatCard
          title="Employees"
          value={users.filter((user) => user.role === "user").length}
          helper="Normal users"
          icon={<FaUsers />}
          tone="green"
        />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-bold text-slate-900">All Users</h3>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.name?.charAt(0).toUpperCase()}
                      </div>

                      <span className="font-semibold text-slate-900">
                        {user.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600">{user.email}</td>

                  <td className="px-4 py-4">
                    <StatusBadge status={user.role} />
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge status={user.status || "active"} />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openModal({
                            type: "changeRole",
                            title: "Change User Role",
                            message:
                              "Are you sure you want to change this user's role?",
                            confirmText: "Change Role",
                            tone: "blue",
                            payload: user.id,
                          })
                        }
                        className="admin-action-blue"
                      >
                        <FaUsers size={13} />
                        Change Role
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openModal({
                            type: "toggleUser",
                            title:
                              user.status === "disabled"
                                ? "Enable User"
                                : "Disable User",
                            message:
                              user.status === "disabled"
                                ? "Are you sure you want to enable this user?"
                                : "Are you sure you want to disable this user?",
                            confirmText:
                              user.status === "disabled"
                                ? "Enable User"
                                : "Disable User",
                            tone: "red",
                            payload: user.id,
                          })
                        }
                        className="admin-action-red"
                      >
                        <FaTimes size={13} />
                        {user.status === "disabled" ? "Enable" : "Disable"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Rooms */
/* -------------------------------------------------------------------------- */

function RoomsSection({ rooms, addRoom, updateRoom, openModal, showToast }) {
  const [showRoomForm, setShowRoomForm] = useState(false);

  const [roomForm, setRoomForm] = useState({
    name: "",
    location: "",
    capacity: "",
    description: "",
    amenities: "",
  });

  const activeRooms = rooms.filter((room) => room.isActive).length;
  const inactiveRooms = rooms.filter((room) => !room.isActive).length;

  function handleAddRoom() {
    if (!roomForm.name.trim()) {
      showToast("error", "Room name is required.");
      return;
    }

    if (!roomForm.location.trim()) {
      showToast("error", "Room location is required.");
      return;
    }

    if (!roomForm.capacity || Number(roomForm.capacity) <= 0) {
      showToast("error", "Please enter a valid room capacity.");
      return;
    }

    addRoom({
      name: roomForm.name,
      location: roomForm.location,
      capacity: Number(roomForm.capacity),
      description: roomForm.description,
      amenities: roomForm.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      status: "available",
      isActive: true,
    });

    showToast("success", "Room added successfully.");

    setRoomForm({
      name: "",
      location: "",
      capacity: "",
      description: "",
      amenities: "",
    });

    setShowRoomForm(false);
  }

  return (
    <>
      <SectionTitle
        eyebrow="Rooms"
        title="Room Management"
        description="Add rooms, update details, and control room availability."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          title="Total Rooms"
          value={rooms.length}
          helper="All rooms"
          icon={<FaBuilding />}
          tone="blue"
        />

        <StatCard
          title="Active"
          value={activeRooms}
          helper="Visible to users"
          icon={<FaCheckCircle />}
          tone="green"
        />

        <StatCard
          title="Inactive"
          value={inactiveRooms}
          helper="Hidden rooms"
          icon={<FaTimesCircle />}
          tone="red"
        />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Rooms</h3>
            <p className="mt-1 text-sm text-slate-500">
              Manage meeting rooms used by employees.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowRoomForm((previous) => !previous)}
            className="admin-action-blue"
          >
            <FaPlus size={13} />
            {showRoomForm ? "Close Form" : "Add Room"}
          </button>
        </div>

        {showRoomForm && (
          <div className="border-b border-slate-100 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Room Name">
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(event) =>
                    setRoomForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Conference Room A"
                  className="admin-input"
                />
              </Field>

              <Field label="Location">
                <input
                  type="text"
                  value={roomForm.location}
                  onChange={(event) =>
                    setRoomForm((previous) => ({
                      ...previous,
                      location: event.target.value,
                    }))
                  }
                  placeholder="First Floor"
                  className="admin-input"
                />
              </Field>

              <Field label="Capacity">
                <input
                  type="number"
                  value={roomForm.capacity}
                  onChange={(event) =>
                    setRoomForm((previous) => ({
                      ...previous,
                      capacity: event.target.value,
                    }))
                  }
                  placeholder="10"
                  className="admin-input"
                />
              </Field>

              <Field label="Amenities">
                <input
                  type="text"
                  value={roomForm.amenities}
                  onChange={(event) =>
                    setRoomForm((previous) => ({
                      ...previous,
                      amenities: event.target.value,
                    }))
                  }
                  placeholder="Projector, Wi-Fi, Whiteboard"
                  className="admin-input"
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={roomForm.description}
                  onChange={(event) =>
                    setRoomForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Short room description"
                  className="admin-input min-h-[80px] resize-none py-3"
                />
              </Field>
            </div>

            <button
              type="button"
              onClick={handleAddRoom}
              className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <FaPlus size={13} />
              Save Room
            </button>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {room.name}
                  </h3>

                  <StatusBadge status={room.status} />
                  <StatusBadge status={room.isActive ? "active" : "inactive"} />
                </div>

                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                  <span>{room.location}</span>
                  <span>{room.capacity} people</span>
                </div>

                <p className="mt-2 max-w-xl text-sm text-slate-500">
                  {room.description || "No description added."}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {room.amenities?.length > 0 ? (
                    room.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {amenity}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">
                      No amenities added
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openModal({
                      type: "toggleRoom",
                      title: room.isActive ? "Deactivate Room" : "Activate Room",
                      message: room.isActive
                        ? "This room will be hidden from users. Continue?"
                        : "This room will be visible to users. Continue?",
                      confirmText: room.isActive ? "Deactivate" : "Activate",
                      tone: "blue",
                      payload: room.id,
                    })
                  }
                  className="admin-action-amber"
                >
                  {room.isActive ? "Deactivate" : "Activate"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateRoom(room.id, {
                      ...room,
                      status:
                        room.status === "available"
                          ? "unavailable"
                          : "available",
                    })
                  }
                  className="admin-action-blue"
                >
                  <FaEdit size={13} />
                  Change Status
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openModal({
                      type: "deleteRoom",
                      title: "Delete Room",
                      message:
                        "Are you sure you want to delete this room? This action cannot be undone.",
                      confirmText: "Delete Room",
                      tone: "red",
                      payload: room.id,
                    })
                  }
                  className="admin-action-red"
                >
                  <FaTrash size={13} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Reports */
/* -------------------------------------------------------------------------- */

function ReportsSection({ bookings, rooms, users }) {
  const [duration, setDuration] = useState("all");

  const reportCards = [
    {
      title: "Excel Report",
      description: "Export booking records in spreadsheet format.",
      icon: <FaFileExcel />,
      button: "Export Excel",
      tone: "green",
    },
    {
      title: "PDF Report",
      description: "Download a printable booking summary.",
      icon: <FaFilePdf />,
      button: "Export PDF",
      tone: "slate",
    },
    {
      title: "CSV Report",
      description: "Export booking data for analysis tools.",
      icon: <FaFileCsv />,
      button: "Export CSV",
      tone: "blue",
    },
  ];

  return (
    <>
      <SectionTitle
        eyebrow="Reports"
        title="Reports & Exports"
        description="Download booking reports for office tracking."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          title="Bookings"
          value={bookings.length}
          helper="Total records"
          icon={<FaCalendarAlt />}
          tone="blue"
        />

        <StatCard
          title="Rooms"
          value={rooms.length}
          helper="Office rooms"
          icon={<FaBuilding />}
          tone="green"
        />

        <StatCard
          title="Users"
          value={users.length}
          helper="Employees"
          icon={<FaUsers />}
          tone="purple"
        />
      </div>

      <Card>
        <CardHeader
          title="Export Reports"
          description="Select duration and choose export format."
        />

        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[360px_1fr]">
          <Field label="Duration">
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="admin-input"
            >
              <option value="all">All Bookings</option>
              <option value="today">Today</option>
              <option value="month">This Month</option>
              <option value="sixMonths">Last 6 Months</option>
              <option value="year">This Year</option>
            </select>
          </Field>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <h4 className="text-sm font-bold text-blue-700">Ready to export</h4>
            <p className="mt-1 text-sm text-blue-600">
              {bookings.length} booking records are available for export.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 p-4 md:grid-cols-3">
          {reportCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${getToneClass(
                  card.tone
                ).soft} ${getToneClass(card.tone).text}`}
              >
                {card.icon}
              </div>

              <h3 className="text-base font-bold text-slate-900">
                {card.title}
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {card.description}
              </p>

              <button
                type="button"
                className={`mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                  card.tone === "green"
                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : card.tone === "blue"
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {card.icon}
                {card.button}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

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
                        confirmText: "Cancel Booking",
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

function ProfessionalModal({
  open,
  title,
  message,
  confirmText,
  tone,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="admin-action-slate"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={tone === "red" ? "admin-action-red" : "admin-action-blue"}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ type, message }) {
  return (
    <div
      className={`fixed right-5 top-24 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
        type === "success"
          ? "bg-green-600 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      {message}
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