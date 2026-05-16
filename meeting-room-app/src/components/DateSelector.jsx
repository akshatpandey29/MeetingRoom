import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaChevronDown } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";

function DateSelector({ value, onChange, label = "Date" }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const parseDateString = (dateString) => {
    if (!dateString) return new Date();

    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const selectedDate = parseDateString(value);

  const formatDateForState = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
        <FaCalendarAlt className="text-blue-500" size={13} />
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-sm bg-white text-slate-800 outline-none transition-all ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-100"
            : "border-gray-300 hover:border-blue-400"
        }`}
      >
        <span>{formatDateForDisplay(selectedDate)}</span>

        <FaChevronDown
          size={12}
          className={`text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[78px] z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-3">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => {
              onChange(formatDateForState(date));
              setIsOpen(false);
            }}
            inline
            minDate={new Date()}
          />
        </div>
      )}
    </div>
  );
}

export default DateSelector;