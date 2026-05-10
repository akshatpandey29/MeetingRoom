import { useState, useEffect, useRef } from 'react';

function TimePickerWheel({ value, onChange, disabled, label }) {
  const hours = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
  const periods = ['AM', 'PM'];

  const [selHour, setSelHour] = useState('10');
  const [selMin, setSelMin] = useState('00');
  const [selPeriod, setSelPeriod] = useState('AM');
  const [isOpen, setIsOpen] = useState(false);

  const wrapperRef = useRef(null);

  // parse value when it changes externally
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      setSelHour(String(displayH).padStart(2, '0'));
      setSelMin(String(m).padStart(2, '0'));
      setSelPeriod(period);
    }
  }, [value]);

  // close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const emitChange = (h, m, p) => {
    let hour24 = parseInt(h);
    if (p === 'PM' && hour24 !== 12) hour24 += 12;
    if (p === 'AM' && hour24 === 12) hour24 = 0;
    const timeStr = `${String(hour24).padStart(2, '0')}:${m}`;
    onChange(timeStr);
  };

  const handleHour = (h) => { setSelHour(h); emitChange(h, selMin, selPeriod); };
  const handleMin = (m) => { setSelMin(m); emitChange(selHour, m, selPeriod); };
  const handlePeriod = (p) => { setSelPeriod(p); emitChange(selHour, selMin, p); };

  const displayValue = value
    ? `${selHour}:${selMin} ${selPeriod}`
    : label || 'Select time';

  return (
    <div ref={wrapperRef} className="relative w-full">

      {/* Input trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 border rounded-xl text-sm text-left transition-all
          ${disabled
            ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border-gray-200 text-slate-800 hover:border-blue-400 cursor-pointer'
          }
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : ''}
        `}
      >
        {value ? displayValue : (
          <span className="text-gray-400">{label || 'Select time'}</span>
        )}
      </button>

      {/* Dropdown wheel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-56">

          <p className="text-xs font-medium text-slate-500 text-center mb-3">
            Select Time
          </p>

          <div className="flex items-center justify-center gap-1">

            {/* Hours */}
            <ScrollColumn
              items={hours}
              selected={selHour}
              onSelect={handleHour}
            />

            <span className="text-xl font-semibold text-slate-700 pb-1">:</span>

            {/* Minutes */}
            <ScrollColumn
              items={minutes}
              selected={selMin}
              onSelect={handleMin}
            />

            {/* AM/PM */}
            <div className="flex flex-col gap-1 ml-1">
              {periods.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePeriod(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${selPeriod === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>

          </div>

          {/* Confirm */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="mt-3 w-full py-2 bg-slate-900 text-white text-xs font-medium rounded-xl hover:bg-slate-700 transition-colors"
          >
            Confirm {displayValue}
          </button>

        </div>
      )}
    </div>
  );
}

function ScrollColumn({ items, selected, onSelect }) {
  const colRef = useRef(null);

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (colRef.current && idx >= 0) {
      colRef.current.scrollTop = idx * 36;
    }
  }, [selected, items]);

  return (
    <div
      ref={colRef}
      className="h-36 w-12 overflow-y-scroll scrollbar-hide relative"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* fade top */}
      <div className="sticky top-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />

      {/* padding top */}
      <div className="h-8" />

      {items.map((item) => (
        <div
          key={item}
          onClick={() => onSelect(item)}
          className={`h-9 flex items-center justify-center text-sm rounded-lg cursor-pointer transition-all
            ${selected === item
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-500 hover:bg-gray-100'
            }`}
        >
          {item}
        </div>
      ))}

      {/* padding bottom */}
      <div className="h-8" />

      {/* fade bottom */}
      <div className="sticky bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
    </div>
  );
}

export default TimePickerWheel;