import { useState } from "react";
import {
  FaSearch,
  FaEye,
  FaUserShield,
  FaUserSlash,
  FaUserCheck,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

function UserManagement() {
  const { user, users, changeUserRole, toggleUserStatus } = useAuth();

  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);

  const [message, setMessage] = useState({
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

  const showMessage = (text, type) => {
    setMessage({
      text,
      type,
    });

    setTimeout(() => {
      setMessage({
        text: "",
        type: "",
      });
    }, 3000);
  };

  const openModal = ({ actionType, title, message, confirmText, payload }) => {
    setModalData({
      actionType,
      title,
      message,
      confirmText,
      payload,
    });

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
    const selectedActionUser = modalData.payload;

    if (!selectedActionUser) {
      closeModal();
      return;
    }

    if (modalData.actionType === "changeRole") {
      changeUserRole(selectedActionUser.id);

      showMessage(
        `${selectedActionUser.name}'s role changed successfully.`,
        "success"
      );

      closeModal();
      return;
    }

    if (modalData.actionType === "toggleStatus") {
      toggleUserStatus(selectedActionUser.id);

      showMessage(
        selectedActionUser.status === "active"
          ? `${selectedActionUser.name} has been disabled successfully.`
          : `${selectedActionUser.name} has been enabled successfully.`,
        "success"
      );

      closeModal();
      return;
    }
  };

  const formatUserDate = (dateValue) => {
    if (!dateValue) return "Not available";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const sortedUsers = [...users].sort((firstUser, secondUser) => {
    if (firstUser.role === "admin" && secondUser.role !== "admin") {
      return -1;
    }

    if (firstUser.role !== "admin" && secondUser.role === "admin") {
      return 1;
    }

    return firstUser.name.localeCompare(secondUser.name);
  });

  const filteredUsers = sortedUsers.filter((currentUser) => {
    const searchValue = userSearch.toLowerCase();

    const matchesSearch =
      currentUser.name.toLowerCase().includes(searchValue) ||
      currentUser.email.toLowerCase().includes(searchValue);

    const matchesRole =
      roleFilter === "all" || currentUser.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleViewUser = (currentUser) => {
    setSelectedUser(currentUser);

    showMessage(`${currentUser.name}'s details are now visible.`, "success");
  };

  const handleChangeRoleClick = (currentUser) => {
    if (currentUser.id === user?.id) {
      showMessage("You cannot change your own role.", "error");
      return;
    }

    openModal({
      actionType: "changeRole",
      title: "Change User Role",
      message:
        currentUser.role === "admin"
          ? `Are you sure you want to change ${currentUser.name} from admin to user?`
          : `Are you sure you want to change ${currentUser.name} from user to admin?`,
      confirmText:
        currentUser.role === "admin" ? "Yes, Make User" : "Yes, Make Admin",
      payload: currentUser,
    });
  };

  const handleToggleStatusClick = (currentUser) => {
    if (currentUser.id === user?.id) {
      showMessage("You cannot disable your own account.", "error");
      return;
    }

    openModal({
      actionType: "toggleStatus",
      title:
        currentUser.status === "active"
          ? "Disable User Account"
          : "Enable User Account",
      message:
        currentUser.status === "active"
          ? `Are you sure you want to disable ${currentUser.name}? This user will not be able to login.`
          : `Are you sure you want to enable ${currentUser.name}? This user will be able to login again.`,
      confirmText:
        currentUser.status === "active" ? "Yes, Disable" : "Yes, Enable",
      payload: currentUser,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <ConfirmModal
        isOpen={modalOpen}
        title={modalData.title}
        message={modalData.message}
        confirmText={modalData.confirmText}
        cancelText="No, Keep it"
        onConfirm={handleConfirmModalAction}
        onCancel={closeModal}
      />

      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-slate-900">
          User Management
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Admins are shown first, then normal users. Search, filter, and manage
          access.
        </p>
      </div>

      <div className="p-6 border-b border-gray-100">
        {message.text && (
          <div
            className={`mb-5 px-4 py-3 rounded-xl text-sm border flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 border-green-100 text-green-700"
                : "bg-red-50 border-red-100 text-red-600"
            }`}
          >
            {message.type === "success" ? (
              <FaCheckCircle size={14} />
            ) : (
              <FaTimesCircle size={14} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
          <div className="relative">
            <FaSearch
              size={13}
              className="absolute left-4 top-3.5 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>
        </div>
      </div>

      {selectedUser && (
        <div className="m-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">
                User Details
              </p>

              <h3 className="text-lg font-semibold text-slate-900">
                {selectedUser.name}
              </h3>

              <div className="mt-2 space-y-1">
                <p className="text-sm text-slate-600">
                  <strong>Email:</strong> {selectedUser.email}
                </p>

                <p className="text-sm text-slate-600">
                  <strong>Role:</strong> {selectedUser.role}
                </p>

                <p className="text-sm text-slate-600">
                  <strong>Status:</strong> {selectedUser.status}
                </p>

                <p className="text-sm text-slate-600">
                  <strong>Created Date:</strong>{" "}
                  {formatUserDate(selectedUser.createdAt)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="p-2 bg-white text-slate-500 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <FaTimes size={13} />
            </button>
          </div>
        </div>
      )}

      {filteredUsers.length > 0 ? (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600">
                    Name
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600">
                    Role
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600">
                    Created Date
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((currentUser) => {
                  const isCurrentLoggedInUser = currentUser.id === user?.id;

                  return (
                    <tr key={currentUser.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                              currentUser.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {currentUser.name.charAt(0).toUpperCase()}
                          </div>

                          <span className="font-medium text-slate-900">
                            {currentUser.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {currentUser.email}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                            currentUser.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {currentUser.role === "admin" && (
                            <FaUserShield size={11} />
                          )}
                          {currentUser.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {formatUserDate(currentUser.createdAt)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            currentUser.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {currentUser.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewUser(currentUser)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                          >
                            <FaEye size={11} />
                            View
                          </button>

                          <button
                            type="button"
                            disabled={isCurrentLoggedInUser}
                            onClick={() => handleChangeRoleClick(currentUser)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            <FaUserShield size={11} />
                            Change Role
                          </button>

                          <button
                            type="button"
                            disabled={isCurrentLoggedInUser}
                            onClick={() => handleToggleStatusClick(currentUser)}
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${
                              currentUser.status === "active"
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                          >
                            {currentUser.status === "active" ? (
                              <FaUserSlash size={11} />
                            ) : (
                              <FaUserCheck size={11} />
                            )}
                            {currentUser.status === "active"
                              ? "Disable"
                              : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-100">
            {filteredUsers.map((currentUser) => {
              const isCurrentLoggedInUser = currentUser.id === user?.id;

              return (
                <div key={currentUser.id} className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {currentUser.name}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        {currentUser.email}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        currentUser.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 mb-4">
                    <p>
                      <strong>Created:</strong>{" "}
                      {formatUserDate(currentUser.createdAt)}
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={
                          currentUser.status === "active"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {currentUser.status}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewUser(currentUser)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                      <FaEye size={11} />
                      View
                    </button>

                    <button
                      type="button"
                      disabled={isCurrentLoggedInUser}
                      onClick={() => handleChangeRoleClick(currentUser)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <FaUserShield size={11} />
                      Change Role
                    </button>

                    <button
                      type="button"
                      disabled={isCurrentLoggedInUser}
                      onClick={() => handleToggleStatusClick(currentUser)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${
                        currentUser.status === "active"
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {currentUser.status === "active" ? (
                        <FaUserSlash size={11} />
                      ) : (
                        <FaUserCheck size={11} />
                      )}
                      {currentUser.status === "active" ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="p-10 text-center">
          <h3 className="text-lg font-semibold text-slate-800">
            No users found
          </h3>

          <p className="text-sm text-slate-500 mt-2">
            Try changing your search or role filter.
          </p>
        </div>
      )}
    </div>
  );
}

export default UserManagement;