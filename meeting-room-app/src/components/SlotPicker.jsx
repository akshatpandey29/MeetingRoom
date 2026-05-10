import { FaClock } from 'react-icons/fa';

function SlotPicker({ availableSlots, bookedSlots, selectedSlot, onSelectSlot }) {

  if (!availableSlots) {
    return (
      <div className="text-sm text-slate-500">
        Please select a date to view slots.
      </div>
    );
  }

  // check if slot is booked
  const isBooked = (slot) => bookedSlots?.some(b => b.slot === slot);

  // check if slot is selected
  const isSelected = (slot) => selectedSlot === slot;

  if (availableSlots.length === 0) {
    return (
      <div className="mt-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
        <p className="text-sm text-red-600">
          No available slots for this date. Please select another date.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-slate-500">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <span className="text-xs text-slate-500">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span className="text-xs text-slate-500">Selected</span>
        </div>
      </div>

      {/* Slots Grid — reads from availableSlots prop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {availableSlots.map((slot) => {
          const booked = isBooked(slot);
          const selected = isSelected(slot);

          return (
            <button
              key={slot}
              type="button"
              disabled={booked}
              onClick={() => !booked && onSelectSlot(slot)}
              className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium border transition-all duration-150
                ${selected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : booked
                  ? 'bg-red-50 text-red-400 border-red-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-gray-200 hover:border-blue-400 hover:text-blue-600 cursor-pointer'
                }`}
            >
              <FaClock size={12} />
              {slot}
              {booked && (
                <span className="text-xs font-medium">Booked</span>
              )}
              {selected && (
                <span className="text-xs font-medium">Selected</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SlotPicker;