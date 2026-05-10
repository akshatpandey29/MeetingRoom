import { MdMeetingRoom } from 'react-icons/md';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Footer() {
  const { isAdmin } = useAuth();

  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">

        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6 md:mb-8">

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <MdMeetingRoom size={22} className="text-blue-500" />
              <span className="text-base font-semibold text-slate-900">
                RoomBook
              </span>
            </div>

            <p className="text-sm text-slate-500 max-w-xs">
              Smart meeting room booking system for teams. Book rooms, manage schedules, stay organised.
            </p>
          </div>

          <div className="flex gap-8 md:gap-12">
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-slate-800 mb-1">
                Navigation
              </h4>

              {isAdmin() ? (
                <Link
                  to="/admin"
                  className="text-sm text-slate-500 hover:text-blue-600 transition-colors duration-150"
                >
                  Admin Workspace
                </Link>
              ) : (
                <>
                  <Link
                    to="/rooms"
                    className="text-sm text-slate-500 hover:text-blue-600 transition-colors duration-150"
                  >
                    Rooms
                  </Link>

                  <Link
                    to="/mybookings"
                    className="text-sm text-slate-500 hover:text-blue-600 transition-colors duration-150"
                  >
                    My Bookings
                  </Link>
                </>
              )}
            </div>
          </div>

        </div>

        <div className="border-t border-gray-100 pt-5 flex flex-col md:flex-row items-center justify-between gap-3">

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} RoomBook. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-700 transition-colors duration-150"
            >
              <FaGithub size={16} />
            </a>

            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-blue-600 transition-colors duration-150"
            >
              <FaLinkedin size={16} />
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}

export default Footer;