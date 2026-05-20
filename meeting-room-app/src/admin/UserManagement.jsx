import { useMemo, useState } from "react";
import {
  FaSearch,
  FaEye,
  FaUserShield,
  FaUserSlash,
  FaUserCheck,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaEnvelope,
  FaCalendarAlt,
  FaUser,
  FaUsers,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

function UserManagement() {
  const { user, users, changeUserRole, toggleUserStatus } = useAuth();

  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [userPage, setUserPage] = useState(1);
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
    tone: "red",
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

  const openModal = ({
    actionType,
    title,
    message,
    confirmText,
    tone = "red",
    payload,
  }) => {
    setModalData({
      actionType,
      title,
      message,
      confirmText,
      tone,
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
      tone: "red",
      payload: null,
    });
  };

  const handleConfirmModalAction = async () => {
    const selectedActionUser = modalData.payload;

    if (!selectedActionUser) {
      closeModal();
      return;
    }

    if (modalData.actionType === "changeRole") {
      const result = await changeUserRole(selectedActionUser.id);

      showMessage(
        result.message ||
          `${selectedActionUser.name}'s role changed successfully.`,
        result.success ? "success" : "error"
      );

      closeModal();
      return;
    }

    if (modalData.actionType === "toggleStatus") {
      const result = await toggleUserStatus(selectedActionUser.id);

      showMessage(
        result.message ||
          (selectedActionUser.status === "active"
            ? `${selectedActionUser.name} has been disabled successfully.`
            : `${selectedActionUser.name} has been enabled successfully.`),
        result.success ? "success" : "error"
      );

      closeModal();
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

  const sortedUsers = useMemo(() => {
    return [...users].sort((firstUser, secondUser) => {
      if (firstUser.role === "admin" && secondUser.role !== "admin") {
        return -1;
      }

      if (firstUser.role !== "admin" && secondUser.role === "admin") {
        return 1;
      }

      return firstUser.name.localeCompare(secondUser.name);
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    return sortedUsers.filter((currentUser) => {
      const searchValue = userSearch.toLowerCase().trim();

      const matchesSearch =
        currentUser.name.toLowerCase().includes(searchValue) ||
        currentUser.email.toLowerCase().includes(searchValue);

      const matchesRole =
        roleFilter === "all" || currentUser.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [sortedUsers, userSearch, roleFilter]);

  const totalAdmins = users.filter(
    (currentUser) => currentUser.role === "admin"
  ).length;

  const totalEmployees = users.filter(
    (currentUser) => currentUser.role !== "admin"
  ).length;

  const activeUsers = users.filter(
    (currentUser) => currentUser.status === "active"
  ).length;

  const usersPerPage = viewMode === "grid" ? 6 : 8;
  const totalUserPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / usersPerPage)
  );
  const currentUserPage = Math.min(userPage, totalUserPages);
  const userStartIndex = (currentUserPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(
    userStartIndex,
    userStartIndex + usersPerPage
  );
  const userShowingStart = filteredUsers.length === 0 ? 0 : userStartIndex + 1;
  const userShowingEnd = Math.min(
    userStartIndex + usersPerPage,
    filteredUsers.length
  );

  const handleViewUser = (currentUser) => {
    setSelectedUser(currentUser);
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
      tone: "purple",
      payload: currentUser,
    });
  };

  const handleToggleStatusClick = (currentUser) => {
    if (currentUser.id === user?.id) {
      showMessage("You cannot disable your own account.", "error");
      return;
    }

    const isActive = currentUser.status === "active";

    openModal({
      actionType: "toggleStatus",
      title: isActive ? "Disable User Account" : "Enable User Account",
      message: isActive
        ? `Are you sure you want to disable ${currentUser.name}? This user will not be able to login.`
        : `Are you sure you want to enable ${currentUser.name}? This user will be able to login again.`,
      confirmText: isActive ? "Yes, Disable" : "Yes, Enable",
      tone: isActive ? "red" : "green",
      payload: currentUser,
    });
  };

  const clearFilters = () => {
    setUserSearch("");
    setRoleFilter("all");
    setUserPage(1);
  };

  return (
    <div className="space-y-5">
      <ConfirmModal
        isOpen={modalOpen}
        title={modalData.title}
        message={modalData.message}
        confirmText={modalData.confirmText}
        cancelText="No, Keep it"
        tone={modalData.tone}
        onConfirm={handleConfirmModalAction}
        onCancel={closeModal}
      />

      {selectedUser && (
        <UserDetailsModal
          currentUser={selectedUser}
          loggedInUser={user}
          formatUserDate={formatUserDate}
          onClose={() => setSelectedUser(null)}
          onChangeRole={handleChangeRoleClick}
          onToggleStatus={handleToggleStatusClick}
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
              Users
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              User Management
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              View employees, manage roles, and control account access.
            </p>
          </div>

          <UserViewToggle
            viewMode={viewMode}
            setViewMode={(nextViewMode) => {
              setViewMode(nextViewMode);
              setUserPage(1);
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <UserSummaryCard
            icon={<FaUsers />}
            label="Total Users"
            value={users.length}
            helper="All employees"
            tone="blue"
          />

          <UserSummaryCard
            icon={<FaUserShield />}
            label="Admins"
            value={totalAdmins}
            helper="Admin access"
            tone="purple"
          />

          <UserSummaryCard
            icon={<FaUser />}
            label="Employees"
            value={totalEmployees}
            helper="Normal users"
            tone="green"
          />

          <UserSummaryCard
            icon={<FaUserCheck />}
            label="Active"
            value={activeUsers}
            helper="Can login"
            tone="slate"
          />
        </div>

        <div className="border-b border-slate-100 bg-slate-50/60 p-5">
          {message.text && (
            <div
              className={`mb-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                message.type === "success"
                  ? "border-green-100 bg-green-50 text-green-700"
                  : "border-red-100 bg-red-50 text-red-600"
              }`}
            >
              <span className="mt-0.5">
                {message.type === "success" ? (
                  <FaCheckCircle size={14} />
                ) : (
                  <FaTimesCircle size={14} />
                )}
              </span>

              <span>{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <FaSearch
                size={13}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(event) => {
                  setUserSearch(event.target.value);
                  setUserPage(1);
                }}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setUserPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="user">Users</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-xl bg-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
            >
              Clear
            </button>
          </div>

          <p className="mt-4 text-sm font-medium text-slate-500">
            Showing {userShowingStart}-{userShowingEnd} of{" "}
            {filteredUsers.length} filtered users.
          </p>
        </div>

        {filteredUsers.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
                {paginatedUsers.map((currentUser) => (
                  <UserGridCard
                    key={currentUser.id}
                    currentUser={currentUser}
                    loggedInUser={user}
                    formatUserDate={formatUserDate}
                    onView={handleViewUser}
                    onChangeRole={handleChangeRoleClick}
                    onToggleStatus={handleToggleStatusClick}
                  />
                ))}
              </div>
            ) : (
              <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((currentUser) => {
                    const isCurrentLoggedInUser = currentUser.id === user?.id;

                    return (
                      <tr
                        key={currentUser.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={currentUser} />

                            <div>
                              <p className="font-semibold text-slate-900">
                                {currentUser.name}
                              </p>

                              {isCurrentLoggedInUser && (
                                <p className="text-xs font-medium text-blue-600">
                                  Current admin
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-500">
                          {currentUser.email}
                        </td>

                        <td className="px-5 py-4">
                          <RoleBadge role={currentUser.role} />
                        </td>

                        <td className="px-5 py-4 text-slate-500">
                          {formatUserDate(currentUser.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={currentUser.status} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <ActionButton
                              type="view"
                              label="View"
                              icon={<FaEye size={11} />}
                              onClick={() => handleViewUser(currentUser)}
                            />

                            <ActionButton
                              type="role"
                              label="Change Role"
                              icon={<FaUserShield size={11} />}
                              disabled={isCurrentLoggedInUser}
                              onClick={() =>
                                handleChangeRoleClick(currentUser)
                              }
                            />

                            <ActionButton
                              type={
                                currentUser.status === "active"
                                  ? "danger"
                                  : "success"
                              }
                              label={
                                currentUser.status === "active"
                                  ? "Disable"
                                  : "Enable"
                              }
                              icon={
                                currentUser.status === "active" ? (
                                  <FaUserSlash size={11} />
                                ) : (
                                  <FaUserCheck size={11} />
                                )
                              }
                              disabled={isCurrentLoggedInUser}
                              onClick={() =>
                                handleToggleStatusClick(currentUser)
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {paginatedUsers.map((currentUser) => {
                const isCurrentLoggedInUser = currentUser.id === user?.id;

                return (
                  <div key={currentUser.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <UserAvatar user={currentUser} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {currentUser.name}
                          </h3>

                          <RoleBadge role={currentUser.role} />
                        </div>

                        <p className="mt-1 break-all text-sm text-slate-500">
                          {currentUser.email}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <StatusBadge status={currentUser.status} />

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {formatUserDate(currentUser.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <ActionButton
                        type="view"
                        label="View"
                        icon={<FaEye size={11} />}
                        onClick={() => handleViewUser(currentUser)}
                        fullWidth
                      />

                      <ActionButton
                        type="role"
                        label="Change Role"
                        icon={<FaUserShield size={11} />}
                        disabled={isCurrentLoggedInUser}
                        onClick={() => handleChangeRoleClick(currentUser)}
                        fullWidth
                      />

                      <ActionButton
                        type={
                          currentUser.status === "active"
                            ? "danger"
                            : "success"
                        }
                        label={
                          currentUser.status === "active"
                            ? "Disable"
                            : "Enable"
                        }
                        icon={
                          currentUser.status === "active" ? (
                            <FaUserSlash size={11} />
                          ) : (
                            <FaUserCheck size={11} />
                          )
                        }
                        disabled={isCurrentLoggedInUser}
                        onClick={() => handleToggleStatusClick(currentUser)}
                        fullWidth
                      />
                    </div>
                  </div>
                );
              })}
            </div>
              </>
            )}

            {filteredUsers.length > usersPerPage && (
              <UserPaginationControls
                currentPage={currentUserPage}
                totalPages={totalUserPages}
                onPageChange={setUserPage}
              />
            )}
          </>
        ) : (
          <div className="flex min-h-[240px] items-center justify-center px-6 py-10 text-center">
            <div>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <FaUsers size={22} />
              </div>

              <h3 className="text-base font-bold text-slate-900">
                No users found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try changing the search keyword or role filter.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UserViewToggle({ viewMode, setViewMode }) {
  return (
    <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
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

function UserPaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-slate-500">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          Previous
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`h-9 min-w-9 rounded-xl px-3 text-sm font-semibold transition ${
              currentPage === pageNumber
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function UserGridCard({
  currentUser,
  loggedInUser,
  formatUserDate,
  onView,
  onChangeRole,
  onToggleStatus,
}) {
  const isCurrentLoggedInUser = currentUser.id === loggedInUser?.id;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <UserAvatar user={currentUser} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-bold text-slate-900">
                {currentUser.name}
              </h3>
              <RoleBadge role={currentUser.role} />
            </div>

            <p className="mt-1 break-all text-sm text-slate-500">
              {currentUser.email}
            </p>

            {isCurrentLoggedInUser && (
              <p className="mt-1 text-xs font-semibold text-blue-600">
                Current admin
              </p>
            )}
          </div>
        </div>

        <StatusBadge status={currentUser.status} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
        <DetailItem
          icon={<FaCalendarAlt />}
          label="Created"
          value={formatUserDate(currentUser.createdAt)}
        />
        <DetailItem
          icon={<FaUserShield />}
          label="Access"
          value={currentUser.role === "admin" ? "Admin" : "User"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ActionButton
          type="view"
          label="View"
          icon={<FaEye size={11} />}
          onClick={() => onView(currentUser)}
          fullWidth
        />

        <ActionButton
          type="role"
          label="Change Role"
          icon={<FaUserShield size={11} />}
          disabled={isCurrentLoggedInUser}
          onClick={() => onChangeRole(currentUser)}
          fullWidth
        />

        <ActionButton
          type={currentUser.status === "active" ? "danger" : "success"}
          label={currentUser.status === "active" ? "Disable" : "Enable"}
          icon={
            currentUser.status === "active" ? (
              <FaUserSlash size={11} />
            ) : (
              <FaUserCheck size={11} />
            )
          }
          disabled={isCurrentLoggedInUser}
          onClick={() => onToggleStatus(currentUser)}
          fullWidth
        />
      </div>
    </div>
  );
}

function UserDetailsModal({
  currentUser,
  loggedInUser,
  formatUserDate,
  onClose,
  onChangeRole,
  onToggleStatus,
}) {
  const isCurrentLoggedInUser = currentUser.id === loggedInUser?.id;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
          <div className="flex items-center gap-3">
            <UserAvatar user={currentUser} size="large" />

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {currentUser.name}
              </h3>

              <p className="mt-0.5 text-sm text-slate-500">
                Employee account details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <FaTimes size={13} />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem
              icon={<FaEnvelope />}
              label="Email"
              value={currentUser.email}
            />

            <DetailItem
              icon={<FaUserShield />}
              label="Role"
              value={<RoleBadge role={currentUser.role} />}
            />

            <DetailItem
              icon={<FaUserCheck />}
              label="Status"
              value={<StatusBadge status={currentUser.status} />}
            />

            <DetailItem
              icon={<FaCalendarAlt />}
              label="Created Date"
              value={formatUserDate(currentUser.createdAt)}
            />
          </div>

          {isCurrentLoggedInUser && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              This is your current admin account. You cannot change your own
              role or disable your own account.
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>

          <button
            type="button"
              disabled={isCurrentLoggedInUser}
              onClick={() => {
                onClose();
                setTimeout(() => {
                  onChangeRole(currentUser);
                }, 100);
              }}
              className="rounded-xl bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Change Role
            </button>

            <button
              type="button"
              disabled={isCurrentLoggedInUser}
              onClick={() => {
                onClose();
                setTimeout(() => {
                  onToggleStatus(currentUser);
                }, 100);
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                currentUser.status === "active"
                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              {currentUser.status === "active" ? "Disable User" : "Enable User"}
          </button>
        </div>
      </div>            
    </div>
  );
}

function UserSummaryCard({ icon, label, value, helper, tone = "blue" }) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            toneClasses[tone] || toneClasses.blue
          }`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold leading-tight text-slate-900">
            {value}
          </p>
          <p className="text-xs text-slate-400">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function TableHead({ children }) {
  return (
    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function UserAvatar({ user, size = "normal" }) {
  const isLarge = size === "large";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        isLarge ? "h-12 w-12" : "h-9 w-9"
      } ${
        user.role === "admin"
          ? "bg-purple-100 text-purple-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      {user.name?.charAt(0)?.toUpperCase() || "U"}
    </div>
  );
}

function RoleBadge({ role }) {
  const isAdmin = role === "admin";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold capitalize ${
        isAdmin
          ? "bg-purple-100 text-purple-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      {isAdmin && <FaUserShield size={10} />}
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  const isActive = status === "active";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
        isActive
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {status}
    </span>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        <span>{icon}</span>
        {label}
      </div>

      <div className="break-words text-sm font-semibold text-slate-800">
        {value}
      </div>
    </div>
  );
}

function ActionButton({
  type = "view",
  label,
  icon,
  disabled = false,
  onClick,
  fullWidth = false,
}) {
  const styles = {
    view: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    role: "bg-purple-50 text-purple-700 hover:bg-purple-100",
    danger: "bg-red-50 text-red-700 hover:bg-red-100",
    success: "bg-green-50 text-green-700 hover:bg-green-100",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
        styles[type] || styles.view
      } ${fullWidth ? "w-full" : ""}`}
    >
      {icon}
      {label}
    </button>
  );
}

export default UserManagement;
