import {
  FaUsers,
  FaDoorOpen,
  FaCalendarCheck,
  FaFileExport,
  FaBell,
} from "react-icons/fa";

function AdminSidebar({ activeSection, setActiveSection, pendingCount }) {
  const menuItems = [
    {
      id: "bookings",
      label: "Bookings",
      icon: <FaCalendarCheck size={13} />,
    },
    {
      id: "requests",
      label: "Requests",
      icon: <FaBell size={13} />,
      badge: pendingCount,
    },
    {
      id: "users",
      label: "Users",
      icon: <FaUsers size={13} />,
    },
    {
      id: "rooms",
      label: "Rooms",
      icon: <FaDoorOpen size={13} />,
    },
    {
      id: "exports",
      label: "Reports",
      icon: <FaFileExport size={13} />,
    },
  ];

  return (
    <aside className="hidden lg:block lg:w-56 bg-white border border-gray-200 rounded-xl shadow-sm p-3 h-fit">
      <div className="px-2 pb-3 border-b border-gray-100 mb-3">
        <h2 className="text-base font-semibold text-slate-900">
          Admin Workspace
        </h2>

        <p className="text-xs text-slate-500 mt-1">
          Manage rooms, bookings, users, and reports.
        </p>
      </div>

      <div className="space-y-1.5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeSection === item.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-gray-100 hover:text-slate-900"
            }`}
          >
            {item.icon}

            <span className="flex-1 text-left">{item.label}</span>

            {item.badge > 0 && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  activeSection === item.id
                    ? "bg-white text-blue-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}

export default AdminSidebar;