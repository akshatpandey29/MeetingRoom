import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaChevronDown } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";

function DateSelector({
  value,
  onChange,
  label = "Date",
  helper = "",
  displayMode = "popover",
  required = false,
  size = "default",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const parseDateString = (dateString) => {
    if (!dateString) return new Date();

    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const selectedDate = parseDateString(value);
  const isLarge = size === "large";

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
      <label
        className={`flex items-center gap-2 font-semibold text-slate-700 mb-2 ${
          isLarge ? "text-base" : "text-sm"
        }`}
      >
        <FaCalendarAlt className="text-blue-500" size={13} />
        {label}
        {required && <span className="text-red-500">•</span>}
      </label>

      {helper && (
        <p className="mb-3 text-xs text-slate-500">{helper}</p>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className={`w-full flex items-center justify-between px-4 border rounded-xl bg-white text-slate-800 outline-none transition-all ${
          isLarge ? "py-3.5 text-base" : "py-2.5 text-sm"
        } ${
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
        <div
          className={`z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 ${
            displayMode === "inline"
              ? "relative w-fit max-w-full"
              : "absolute left-0 top-full"
          }`}
        >
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
