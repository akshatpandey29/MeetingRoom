import { useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUsers,
  FaMapMarkerAlt,
  FaToggleOn,
  FaToggleOff,
  FaCalendarAlt,
  FaClock,
  FaEnvelope,
  FaSave,
  FaTimes,
  FaDoorOpen,
  FaCheckCircle,
  FaThLarge,
  FaListUl,
} from "react-icons/fa";
import { useRooms } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import AdminSidebar from "../admin/AdminSidebar";
import AdminExports from "../admin/AdminExports";
import UserManagement from "../admin/UserManagement";
import AdminGlobalSearch from "../admin/AdminGlobalSearch";

function AdminDashboard() {
  const {
    rooms,
    slots,
    bookings,
    adminRequests,
    addRoom,
    updateRoom,
    deleteRoom,
    toggleRoomActive,
    cancelBooking,
    rescheduleBooking,
    getAvailableSlots,
    bookSlot,
    updateAdminRequest,
  } = useRooms();

  const { normalUsers } = useAuth();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [bookingView, setBookingView] = useState("grid");
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    capacity: "",
    isActive: true,
    description: "",
    amenities: "",
  });
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [bookingFormData, setBookingFormData] = useState({
    newDate: "",
    newSlot: "",
  });
  const [adminBookingData, setAdminBookingData] = useState({
    userEmail: "",
    roomId: "",
    date: "",
    slot: "",
  });
  const [bookingMessage, setBookingMessage] = useState({
    text: "",
    type: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    actionType: "",
    title: "",
    message: "",
    confirmText: "",
    payload: null,
  });

  const today = new Date().toISOString().split("T")[0];

  const selectedAdminRoom = rooms.find(
    (room) => room.id === Number(adminBookingData.roomId)
  );

  const selectedAdminUser = normalUsers.find(
    (user) => user.email === adminBookingData.userEmail
  );

  const adminAvailableSlots =
    adminBookingData.roomId && adminBookingData.date
      ? getAvailableSlots(adminBookingData.roomId, adminBookingData.date)
      : [];

  const pendingCount = adminRequests
    ? adminRequests.filter((r) => r.status === "pending").length
    : 0;

  const openModal = ({ actionType, title, message, confirmText, payload }) => {
    setModalData({ actionType, title, message, confirmText, payload });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalData({
      actionType: "",
      title: "",
      message: "",
      confirmText: "",
      payload: null,
    });
  };

  const handleConfirmModalAction = () => {
    if (modalData.actionType === "editRoom") {
      const room = modalData.payload;
      setEditingRoomId(room.id);
      setFormData({
        name: room.name,
        location: room.location,
        capacity: room.capacity,
        isActive: room.isActive,
        description: room.description,
        amenities: room.amenities.join(", "),
      });
      setActiveSection("rooms");
      closeModal();
      return;
    }
    if (modalData.actionType === "deleteRoom") {
      deleteRoom(modalData.payload);
      closeModal();
      return;
    }
    if (modalData.actionType === "toggleRoom") {
      toggleRoomActive(modalData.payload);
      closeModal();
      return;
    }
    if (modalData.actionType === "cancelBooking") {
      cancelBooking(modalData.payload);
      setBookingMessage({ text: "Booking cancelled successfully.", type: "success" });
      closeModal();
      return;
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      capacity: "",
      isActive: true,
      description: "",
      amenities: "",
    });
    setEditingRoomId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.location.trim() || !formData.capacity) {
      alert("Please fill room name, location, and capacity.");
      return;
    }
    const roomData = {
      name: formData.name,
      location: formData.location,
      capacity: Number(formData.capacity),
      status: "available",
      isActive: true,
      description: formData.description,
      amenities: formData.amenities
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a !== ""),
    };
    if (editingRoomId) {
      updateRoom(editingRoomId, roomData);
      resetForm();
      return;
    }
    addRoom(roomData);
    resetForm();
  };

  const handleEditRoomClick = (room) => {
    openModal({
      actionType: "editRoom",
      title: "Edit Room",
      message: `Are you sure you want to edit ${room.name}?`,
      confirmText: "Yes, Edit",
      payload: room,
    });
  };

  const handleDeleteRoomClick = (roomId) => {
    openModal({
      actionType: "deleteRoom",
      title: "Delete Room",
      message: "Are you sure you want to delete this room? All bookings will also be removed.",
      confirmText: "Yes, Delete",
      payload: roomId,
    });
  };

  const handleToggleActiveClick = (room) => {
    openModal({
      actionType: "toggleRoom",
      title: room.isActive ? "Deactivate Room" : "Activate Room",
      message: room.isActive
        ? `Deactivate ${room.name}? Users won't be able to book it.`
        : `Activate ${room.name}? Users can book it again.`,
      confirmText: room.isActive ? "Yes, Deactivate" : "Yes, Activate",
      payload: room.id,
    });
  };

  const handleCancelBookingClick = (bookingId) => {
    openModal({
      actionType: "cancelBooking",
      title: "Cancel Booking",
      message: "Are you sure you want to cancel this booking?",
      confirmText: "Yes, Cancel",
      payload: bookingId,
    });
  };

  const handleStartReschedule = (booking) => {
    setEditingBookingId(booking.id);
    setBookingFormData({ newDate: booking.date, newSlot: booking.slot });
    setBookingMessage({ text: "", type: "" });
  };

  const handleBookingInputChange = (event) => {
    const { name, value } = event.target;
    setBookingFormData({ ...bookingFormData, [name]: value });
  };

  const handleRescheduleBooking = (bookingId) => {
    if (!bookingFormData.newDate || !bookingFormData.newSlot) {
      setBookingMessage({ text: "Please select date and slot.", type: "error" });
      return;
    }
    const result = rescheduleBooking({
      bookingId,
      newDate: bookingFormData.newDate,
      newSlot: bookingFormData.newSlot,
    });
    if (result.success) {
      setBookingMessage({ text: "Booking rescheduled successfully.", type: "success" });
      setEditingBookingId(null);
      setBookingFormData({ newDate: "", newSlot: "" });
    } else {
      setBookingMessage({ text: result.message, type: "error" });
    }
  };

  const handleCancelReschedule = () => {
    setEditingBookingId(null);
    setBookingFormData({ newDate: "", newSlot: "" });
    setBookingMessage({ text: "", type: "" });
  };

  const handleAdminBookingChange = (event) => {
    const { name, value } = event.target;
    setAdminBookingData({
      ...adminBookingData,
      [name]: value,
      ...(name === "roomId" || name === "date" ? { slot: "" } : {}),
    });
    setBookingMessage({ text: "", type: "" });
  };

  const handleAdminBookForUser = () => {
    if (!adminBookingData.userEmail || !adminBookingData.roomId ||
        !adminBookingData.date || !adminBookingData.slot) {
      setBookingMessage({ text: "Please select user, room, date, and slot.", type: "error" });
      return;
    }
    if (!selectedAdminUser || !selectedAdminRoom) {
      setBookingMessage({ text: "Selected user or room is invalid.", type: "error" });
      return;
    }
    const result = bookSlot({
      roomId: selectedAdminRoom.id,
      roomName: selectedAdminRoom.name,
      date: adminBookingData.date,
      slot: adminBookingData.slot,
      bookedBy: selectedAdminUser.name,
      userEmail: selectedAdminUser.email,
    });
    if (result.success) {
      setBookingMessage({
        text: `Booking created successfully for ${selectedAdminUser.name}.`,
        type: "success",
      });
      setAdminBookingData({ userEmail: "", roomId: "", date: "", slot: "" });
    } else {
      setBookingMessage({ text: result.message, type: "error" });
    }
  };

  const handleApproveRequest = (request) => {
    bookSlot({
      roomId: request.roomId,
      roomName: request.roomName,
      date: request.date,
      slot: request.slot,
      startTime: request.startTime,
      endTime: request.endTime,
      bookedBy: request.requestedBy,
      userEmail: request.userEmail,
    });
    updateAdminRequest(request.id, "approved");
  };

  const handleRejectRequest = (requestId) => {
    updateAdminRequest(requestId, "rejected");
  };

  return (
    <section className="min-h-screen px-4 md:px-6 py-8">
      <ConfirmModal
        isOpen={modalOpen}
        title={modalData.title}
        message={modalData.message}
        confirmText={modalData.confirmText}
        cancelText="No, Keep it"
        onConfirm={handleConfirmModalAction}
        onCancel={closeModal}
      />

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-2">
                Admin Workspace
              </p>
              <h1 className="text-3xl font-bold text-slate-900">
                Complete Admin Control
              </h1>
              <p className="text-slate-500 mt-2 max-w-2xl">
                Manage users, rooms, bookings, and reports from one admin workspace.
              </p>
            </div>
            <AdminGlobalSearch
              setActiveSection={setActiveSection}
              setBookingView={setBookingView}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          <AdminSidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            pendingCount={pendingCount}
          />

          <main>

            {/* Dashboard */}
            {activeSection === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <FaUsers className="text-blue-500" />
                      <p className="text-sm text-slate-500">Total Users</p>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">
                      {normalUsers.length}
                    </h2>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <FaDoorOpen className="text-blue-500" />
                      <p className="text-sm text-slate-500">Total Rooms</p>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">
                      {rooms.length}
                    </h2>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <FaCalendarAlt className="text-blue-500" />
                      <p className="text-sm text-slate-500">Total Bookings</p>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">
                      {bookings.length}
                    </h2>
                  </div>
                </div>

                {/* Pending Requests on Dashboard */}
                {pendingCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-yellow-800">
                          You have {pendingCount} pending booking request{pendingCount > 1 ? 's' : ''}
                        </h3>
                        <p className="text-xs text-yellow-600 mt-1">
                          Go to Booking Requests to approve or reject them.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveSection("requests")}
                        className="px-4 py-2 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-xl hover:bg-yellow-200 transition-colors"
                      >
                        View Requests
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Users */}
            {activeSection === "users" && <UserManagement />}

            {/* Rooms */}
            {activeSection === "rooms" && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-1">
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-5">
                      {editingRoomId ? "Edit Room" : "Add New Room"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Room Name</label>
                        <input type="text" name="name" placeholder="Enter room name"
                          value={formData.name} onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                        <input type="text" name="location" placeholder="Example: First Floor"
                          value={formData.location} onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Capacity</label>
                        <input type="number" name="capacity" placeholder="Enter capacity"
                          value={formData.capacity} onChange={handleInputChange} min="1"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                        <textarea name="description" placeholder="Write short room description"
                          value={formData.description} onChange={handleInputChange} rows="3"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Amenities</label>
                        <input type="text" name="amenities" placeholder="Projector, Wi-Fi, Whiteboard"
                          value={formData.amenities} onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        <p className="text-xs text-slate-400 mt-1">Separate amenities using comma.</p>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="submit"
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700">
                          <FaPlus size={13} />
                          {editingRoomId ? "Update Room" : "Add Room"}
                        </button>
                        {editingRoomId && (
                          <button type="button" onClick={resetForm}
                            className="px-4 py-2.5 bg-gray-100 text-slate-600 text-sm font-medium rounded-xl hover:bg-gray-200">
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>

                <div className="xl:col-span-2">
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <h2 className="text-xl font-semibold text-slate-900">Room Management</h2>
                    </div>
                    {rooms.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {rooms.map((room) => (
                          <div key={room.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-slate-900">{room.name}</h3>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full
                                  ${room.status === "available" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {room.status}
                                </span>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full
                                  ${room.isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                                  {room.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-3">
                                <span className="flex items-center gap-2">
                                  <FaMapMarkerAlt size={13} />{room.location}
                                </span>
                                <span className="flex items-center gap-2">
                                  <FaUsers size={13} />{room.capacity} people
                                </span>
                              </div>
                              <p className="text-sm text-slate-500 mb-3">
                                {room.description || "No description added."}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {room.amenities.length > 0 ? (
                                  room.amenities.map((amenity, index) => (
                                    <span key={index}
                                      className="text-xs bg-gray-100 text-slate-600 px-2.5 py-1 rounded-full">
                                      {amenity}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400">No amenities added</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => handleToggleActiveClick(room)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl
                                  ${room.isActive ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                                {room.isActive ? <FaToggleOn size={15} /> : <FaToggleOff size={15} />}
                                {room.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button onClick={() => handleEditRoomClick(room)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100">
                                <FaEdit size={13} /> Edit
                              </button>
                              <button onClick={() => handleDeleteRoomClick(room.id)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-xl hover:bg-red-100">
                                <FaTrash size={13} /> Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 text-center">
                        <h3 className="text-lg font-semibold text-slate-800">No rooms found</h3>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bookings */}
            {activeSection === "bookings" && (
              <div className="space-y-8">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">Book Room for User</h2>
                  <p className="text-sm text-slate-500 mb-6">
                    Select a user and create a booking on their behalf.
                  </p>
                  {bookingMessage.text && (
                    <div className={`mb-5 px-4 py-3 rounded-xl text-sm border
                      ${bookingMessage.type === "success"
                        ? "bg-green-50 border-green-100 text-green-700"
                        : "bg-red-50 border-red-100 text-red-600"}`}>
                      {bookingMessage.text}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Select User</label>
                      <select name="userEmail" value={adminBookingData.userEmail}
                        onChange={handleAdminBookingChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select user</option>
                        {normalUsers.map((u) => (
                          <option key={u.id} value={u.email}>{u.name} - {u.email}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Select Room</label>
                      <select name="roomId" value={adminBookingData.roomId}
                        onChange={handleAdminBookingChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select room</option>
                        {rooms.filter((r) => r.isActive).map((r) => (
                          <option key={r.id} value={r.id}>{r.name} - {r.location}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                      <input type="date" name="date" min={today}
                        value={adminBookingData.date} onChange={handleAdminBookingChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Select Slot</label>
                      <select name="slot" value={adminBookingData.slot}
                        onChange={handleAdminBookingChange}
                        disabled={!adminBookingData.roomId || !adminBookingData.date}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400">
                        <option value="">Select slot</option>
                        {adminAvailableSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {selectedAdminUser && selectedAdminRoom && adminBookingData.date && adminBookingData.slot && (
                    <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                      <p className="text-sm font-semibold text-blue-800 mb-1">Booking Summary</p>
                      <p className="text-sm text-blue-700">User: {selectedAdminUser.name}</p>
                      <p className="text-sm text-blue-700">Room: {selectedAdminRoom.name}</p>
                      <p className="text-sm text-blue-700">Date: {adminBookingData.date}</p>
                      <p className="text-sm text-blue-700">Slot: {adminBookingData.slot}</p>
                    </div>
                  )}
                  <button onClick={handleAdminBookForUser}
                    className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700">
                    Book Room for Selected User
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">All Bookings</h2>
                        <p className="text-sm text-slate-500 mt-1">
                          Admin can view, reschedule, cancel, or delete all bookings.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                        <button type="button" onClick={() => setBookingView("grid")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${bookingView === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                          <FaThLarge size={13} /> Grid View
                        </button>
                        <button type="button" onClick={() => setBookingView("list")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${bookingView === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                          <FaListUl size={13} /> List View
                        </button>
                      </div>
                    </div>
                  </div>

                  {bookings.length > 0 ? (
                    <>
                      {bookingView === "grid" && (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                          {bookings.map((booking) => (
                            <div key={booking.id}
                              className="border border-gray-200 rounded-2xl p-5 bg-white hover:shadow-md transition-all">
                              <div className="flex items-start justify-between gap-3 mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold text-slate-900">{booking.roomName}</h3>
                                  <p className="text-sm text-slate-500 mt-1">Booked by {booking.bookedBy || "Unknown"}</p>
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
                                  Confirmed
                                </span>
                              </div>
                              <div className="space-y-3 text-sm text-slate-600 mb-5">
                                <p className="flex items-center gap-2">
                                  <FaCalendarAlt size={13} className="text-blue-500" />
                                  Date: {booking.date}
                                </p>
                                <p className="flex items-center gap-2">
                                  <FaClock size={13} className="text-blue-500" />
                                  Slot: {booking.slot}
                                </p>
                                <p className="flex items-center gap-2">
                                  <FaEnvelope size={13} className="text-blue-500" />
                                  {booking.userEmail || "Not available"}
                                </p>
                              </div>
                              {editingBookingId === booking.id && (
                                <div className="mb-5 bg-gray-50 border border-gray-100 rounded-xl p-4">
                                  <h4 className="text-sm font-semibold text-slate-800 mb-3">Reschedule Booking</h4>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">New Date</label>
                                      <input type="date" name="newDate" min={today}
                                        value={bookingFormData.newDate} onChange={handleBookingInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">New Slot</label>
                                      <select name="newSlot" value={bookingFormData.newSlot}
                                        onChange={handleBookingInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">Select slot</option>
                                        {slots.map((slot) => (
                                          <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    <button onClick={() => handleRescheduleBooking(booking.id)}
                                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                                      <FaSave size={12} /> Save
                                    </button>
                                    <button onClick={handleCancelReschedule}
                                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-gray-100 text-slate-600 rounded-lg hover:bg-gray-200">
                                      <FaTimes size={12} /> Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2">
                                <button onClick={() => handleStartReschedule(booking)}
                                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100">
                                  <FaEdit size={13} /> Reschedule
                                </button>
                                <button onClick={() => handleCancelBookingClick(booking.id)}
                                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-xl hover:bg-red-100">
                                  <FaTrash size={13} /> Cancel
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {bookingView === "list" && (
                        <div className="divide-y divide-gray-100">
                          {bookings.map((booking) => (
                            <div key={booking.id}
                              className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                  <h3 className="text-lg font-semibold text-slate-900">{booking.roomName}</h3>
                                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
                                    Confirmed
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-500">
                                  <span className="flex items-center gap-2">
                                    <FaCalendarAlt size={13} className="text-blue-500" />
                                    Date: {booking.date}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <FaClock size={13} className="text-blue-500" />
                                    Slot: {booking.slot}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <FaUsers size={13} className="text-blue-500" />
                                    Booked By: {booking.bookedBy || "Unknown"}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <FaEnvelope size={13} className="text-blue-500" />
                                    Email: {booking.userEmail || "Not available"}
                                  </span>
                                </div>
                                {editingBookingId === booking.id && (
                                  <div className="mt-5 bg-gray-50 border border-gray-100 rounded-xl p-4">
                                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Reschedule Booking</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">New Date</label>
                                        <input type="date" name="newDate" min={today}
                                          value={bookingFormData.newDate} onChange={handleBookingInputChange}
                                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">New Slot</label>
                                        <select name="newSlot" value={bookingFormData.newSlot}
                                          onChange={handleBookingInputChange}
                                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                          <option value="">Select slot</option>
                                          {slots.map((slot) => (
                                            <option key={slot} value={slot}>{slot}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-4">
                                      <button onClick={() => handleRescheduleBooking(booking.id)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-50 text-green-600 rounded-xl hover:bg-green-100">
                                        <FaSave size={13} /> Save Changes
                                      </button>
                                      <button onClick={handleCancelReschedule}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-100 text-slate-600 rounded-xl hover:bg-gray-200">
                                        <FaTimes size={13} /> Cancel Edit
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button onClick={() => handleStartReschedule(booking)}
                                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100">
                                  <FaEdit size={13} /> Reschedule
                                </button>
                                <button onClick={() => handleCancelBookingClick(booking.id)}
                                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-xl hover:bg-red-100">
                                  <FaTrash size={13} /> Cancel / Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-10 text-center">
                      <FaCheckCircle size={34} className="text-slate-300 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-slate-800">No bookings found</h3>
                      <p className="text-sm text-slate-500 mt-2">
                        When bookings are created, they will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Exports */}
            {activeSection === "exports" && (
              <AdminExports bookings={bookings} />
            )}

            {/* Booking Requests */}
            {activeSection === "requests" && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Booking Requests
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Approve or reject user booking requests.
                    </p>
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {pendingCount} pending
                    </span>
                  )}
                </div>

                {adminRequests && adminRequests.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {adminRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {request.roomName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Date: {request.date} | Time: {request.slot}
                          </p>
                          <p className="text-xs text-slate-500">
                            Requested by: {request.requestedBy} ({request.userEmail})
                          </p>
                          <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full
                            ${request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                            }`}>
                            {request.status}
                          </span>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveRequest(request)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <p className="text-sm text-slate-500">No booking requests yet.</p>
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;