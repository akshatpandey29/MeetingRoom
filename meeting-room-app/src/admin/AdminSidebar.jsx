import {
  FaTachometerAlt,
  FaUsers,
  FaDoorOpen,
  FaCalendarCheck,
  FaFileExport,
  FaBell,
} from "react-icons/fa";

function AdminSidebar({ activeSection, setActiveSection, pendingCount }) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <FaTachometerAlt size={14} />,
    },
    {
      id: "users",
      label: "Users",
      icon: <FaUsers size={14} />,
    },
    {
      id: "rooms",
      label: "Rooms",
      icon: <FaDoorOpen size={14} />,
    },
    {
      id: "bookings",
      label: "Booking Management",
      icon: <FaCalendarCheck size={14} />,
    },
    {
      id: "requests",
      label: "Booking Requests",
      icon: <FaBell size={14} />,
      badge: pendingCount,
    },
    {
      id: "exports",
      label: "Admin Exports",
      icon: <FaFileExport size={14} />,
    },
  ];

  return (
    <aside className="hidden lg:block lg:w-64 bg-white border border-gray-200 rounded-2xl shadow-sm p-4 h-fit">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">
        Admin Workspace
      </h2>

      <p className="text-xs text-slate-500 mb-5">
        Control users, rooms, bookings, and reports.
      </p>

      <div className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
              activeSection === item.id
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-gray-100 hover:text-slate-900"
            }`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {/* Pending badge */}
            {item.badge > 0 && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                ${activeSection === item.id
                  ? 'bg-white text-blue-600'
                  : 'bg-red-100 text-red-600'
                }`}>
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