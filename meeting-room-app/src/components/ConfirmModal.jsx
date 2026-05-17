import { FaExclamationCircle } from "react-icons/fa";

function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Yes, Confirm",
  cancelText = "No, Keep it",
  tone = "red",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const toneStyles = {
    red: {
      iconBg: "bg-red-50",
      iconText: "text-red-600",
      confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-200",
    },
    blue: {
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
      confirmButton: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-200",
    },
    green: {
      iconBg: "bg-green-50",
      iconText: "text-green-600",
      confirmButton: "bg-green-600 hover:bg-green-700 focus:ring-green-200",
    },
    amber: {
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
      confirmButton: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-200",
    },
    purple: {
      iconBg: "bg-purple-50",
      iconText: "text-purple-600",
      confirmButton: "bg-purple-600 hover:bg-purple-700 focus:ring-purple-200",
    },
  };

  const selectedTone = toneStyles[tone] || toneStyles.red;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close confirmation modal"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      <div className="relative z-10 w-full max-w-[460px] rounded-[22px] bg-white px-7 py-7 shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
        <div
          className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${selectedTone.iconBg}`}
        >
          <FaExclamationCircle
            className={`text-[25px] ${selectedTone.iconText}`}
          />
        </div>

        <h3 className="text-center text-[22px] font-bold leading-tight text-slate-900">
          {title}
        </h3>

        <p className="mx-auto mt-3 max-w-[360px] text-center text-[15px] leading-6 text-slate-500">
          {message}
        </p>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-2xl bg-slate-100 px-5 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`h-12 rounded-2xl px-5 text-[15px] font-semibold text-white shadow-sm transition focus:outline-none focus:ring-4 ${selectedTone.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;