import { useState } from "react";
import * as XLSX from "xlsx";
import {
  FaChevronDown,
  FaFileExcel,
  FaFilePdf,
  FaDownload,
  FaTimesCircle,
  FaCheckCircle,
} from "react-icons/fa";

function AdminExports({ bookings = [] }) {
  const [selectedDuration, setSelectedDuration] = useState("all");

  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  const durationOptions = [
    { value: "today", label: "Today" },
    { value: "month", label: "This Month" },
    { value: "3months", label: "Last 3 Months" },
    { value: "6months", label: "Last 6 Months" },
    { value: "year", label: "This Year" },
    { value: "all", label: "All Bookings" },
  ];

  const selectedDurationLabel =
    durationOptions.find((option) => option.value === selectedDuration)
      ?.label || "All Bookings";

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const formatDisplayDate = (dateValue) => {
    if (!dateValue) return "Not available";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDisplayDateTime = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBookingStatus = (booking) => {
    if (booking.status) return booking.status;

    if (!booking.date) return "unknown";

    if (booking.date < getTodayDate()) return "completed";

    return "upcoming";
  };

  const getActionHistory = (booking) => {
    if (
      Array.isArray(booking.actionHistory) &&
      booking.actionHistory.length > 0
    ) {
      return booking.actionHistory
        .map((historyItem) => {
          const action =
            historyItem.action ||
            historyItem.type ||
            historyItem.message ||
            "Updated";

          const by =
            historyItem.by ||
            historyItem.performedBy ||
            historyItem.actionBy ||
            "Admin";

          const date =
            historyItem.date ||
            historyItem.createdAt ||
            historyItem.timestamp ||
            "";

          return date
            ? `${action} by ${by} on ${formatDisplayDateTime(date)}`
            : `${action} by ${by}`;
        })
        .join(" | ");
    }

    if (booking.createdByAdmin) return "Created by Admin";

    if (booking.source === "admin-request") {
      return "Created from approved request";
    }

    if (booking.rescheduledBy) {
      return `Rescheduled by ${booking.rescheduledBy}`;
    }

    if (booking.cancelledBy) {
      return `Cancelled by ${booking.cancelledBy}`;
    }

    return "Created";
  };

  const isBookingInsideSelectedDuration = (booking) => {
    if (!booking.date) return false;

    const bookingDate = new Date(booking.date);
    const today = new Date();

    bookingDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (selectedDuration === "all") {
      return true;
    }

    if (selectedDuration === "today") {
      return bookingDate.getTime() === today.getTime();
    }

    if (selectedDuration === "month") {
      return (
        bookingDate.getMonth() === today.getMonth() &&
        bookingDate.getFullYear() === today.getFullYear()
      );
    }

    if (selectedDuration === "3months") {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      threeMonthsAgo.setHours(0, 0, 0, 0);

      return bookingDate >= threeMonthsAgo && bookingDate <= today;
    }

    if (selectedDuration === "6months") {
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      return bookingDate >= sixMonthsAgo && bookingDate <= today;
    }

    if (selectedDuration === "year") {
      return bookingDate.getFullYear() === today.getFullYear();
    }

    return true;
  };

  const filteredBookings = bookings.filter(isBookingInsideSelectedDuration);

  const exportData = filteredBookings.map((booking, index) => ({
    serialNo: index + 1,
    employeeName: booking.bookedBy || booking.userName || "Unknown",
    email: booking.userEmail || "Not available",
    room: booking.roomName || "Not available",
    date: formatDisplayDate(booking.date),
    time: booking.slot || booking.time || "Not available",
    status: getBookingStatus(booking),
    actionHistory: getActionHistory(booking),
  }));

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

  const checkDataAvailable = () => {
    if (exportData.length === 0) {
      showMessage(
        "No booking records available for the selected duration.",
        "error"
      );
      return false;
    }

    return true;
  };

  const escapeHtml = (value) => {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  const downloadTextFile = (content, fileName, fileType) => {
    const blob = new Blob([content], { type: fileType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const getReportHtml = ({ autoPrint = false }) => {
    const rows = exportData
      .map(
        (booking) => `
          <tr>
            <td>${escapeHtml(booking.serialNo)}</td>
            <td>${escapeHtml(booking.employeeName)}</td>
            <td>${escapeHtml(booking.email)}</td>
            <td>${escapeHtml(booking.room)}</td>
            <td>${escapeHtml(booking.date)}</td>
            <td>${escapeHtml(booking.time)}</td>
            <td>
              <span class="status-badge">${escapeHtml(booking.status)}</span>
            </td>
            <td>${escapeHtml(booking.actionHistory)}</td>
          </tr>
        `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Booking Report</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              padding: 28px;
              color: #0f172a;
              background: #ffffff;
            }

            .report-header {
              margin-bottom: 24px;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 16px;
            }

            .small-title {
              font-size: 12px;
              color: #2563eb;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: 700;
              margin-bottom: 6px;
            }

            h1 {
              margin: 0;
              font-size: 24px;
              color: #0f172a;
            }

            .subtitle {
              margin-top: 8px;
              color: #64748b;
              font-size: 13px;
            }

            .summary-box {
              margin-bottom: 20px;
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 10px;
              padding: 12px 16px;
              color: #1d4ed8;
              font-size: 13px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
              table-layout: fixed;
            }

            th {
              background: #2563eb;
              color: white;
              padding: 10px 8px;
              border: 1px solid #d1d5db;
              text-align: left;
              word-wrap: break-word;
            }

            td {
              padding: 9px 8px;
              border: 1px solid #d1d5db;
              color: #334155;
              word-wrap: break-word;
              vertical-align: top;
            }

            tr:nth-child(even) {
              background: #f8fafc;
            }

            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 999px;
              background: #dbeafe;
              color: #1d4ed8;
              font-size: 10px;
              font-weight: 700;
              text-transform: capitalize;
            }

            .print-note {
              margin-top: 18px;
              color: #64748b;
              font-size: 12px;
            }

            .col-small {
              width: 5%;
            }

            .col-employee {
              width: 14%;
            }

            .col-email {
              width: 18%;
            }

            .col-room {
              width: 15%;
            }

            .col-date {
              width: 11%;
            }

            .col-time {
              width: 13%;
            }

            .col-status {
              width: 9%;
            }

            .col-history {
              width: 15%;
            }

            @media print {
              body {
                padding: 18px;
              }

              .print-note {
                display: none;
              }

              table {
                page-break-inside: auto;
              }

              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
            }
          </style>
        </head>

        <body>
          <div class="report-header">
            <div class="small-title">RoomBook Admin Report</div>
            <h1>Booking Report</h1>
            <div class="subtitle">Generated from Reports section</div>
          </div>

          <div class="summary-box">
            Duration: ${escapeHtml(selectedDurationLabel)} &nbsp; | &nbsp;
            Total Records: ${exportData.length}
          </div>

          <table>
            <thead>
              <tr>
                <th class="col-small">S.No</th>
                <th class="col-employee">Employee Name</th>
                <th class="col-email">Email</th>
                <th class="col-room">Room</th>
                <th class="col-date">Date</th>
                <th class="col-time">Time</th>
                <th class="col-status">Status</th>
                <th class="col-history">Action History</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>
          </table>

          <p class="print-note">
            For PDF download: choose Destination as "Save as PDF" in the print dialog.
          </p>

          ${
            autoPrint
              ? `
                <script>
                  window.onload = function () {
                    setTimeout(function () {
                      window.print();
                    }, 400);
                  };
                </script>
              `
              : ""
          }
        </body>
      </html>
    `;
  };

  const openReportPreview = ({ autoPrint = false }) => {
    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
      showMessage("Please allow popups to open the report preview.", "error");
      return false;
    }

    reportWindow.document.open("text/html");
    reportWindow.document.write(
      getReportHtml({
        autoPrint,
      })
    );
    reportWindow.document.close();

    return true;
  };

  const exportAsExcel = () => {
    if (!checkDataAvailable()) return;

    const excelRows = exportData.map((booking) => ({
      "S.No": booking.serialNo,
      "Employee Name": booking.employeeName,
      Email: booking.email,
      Room: booking.room,
      Date: booking.date,
      Time: booking.time,
      Status: booking.status,
      "Action History": booking.actionHistory,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 24 },
      { wch: 34 },
      { wch: 28 },
      { wch: 18 },
      { wch: 24 },
      { wch: 16 },
      { wch: 55 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Booking Report");

    XLSX.writeFile(workbook, `booking-report-${selectedDuration}.xlsx`, {
      bookType: "xlsx",
    });

    openReportPreview({
      autoPrint: false,
    });

    showMessage("Excel .xlsx report downloaded and preview opened.", "success");
  };

  const exportAsCSV = () => {
    if (!checkDataAvailable()) return;

    const headers = [
      "S.No",
      "Employee Name",
      "Email",
      "Room",
      "Date",
      "Time",
      "Status",
      "Action History",
    ];

    const rows = exportData.map((booking) => [
      booking.serialNo,
      booking.employeeName,
      booking.email,
      booking.room,
      booking.date,
      booking.time,
      booking.status,
      booking.actionHistory,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    downloadTextFile(
      csvContent,
      `booking-report-${selectedDuration}.csv`,
      "text/csv;charset=utf-8;"
    );

    openReportPreview({
      autoPrint: false,
    });

    showMessage("CSV report downloaded and preview opened.", "success");
  };

  const exportAsPDF = () => {
    if (!checkDataAvailable()) return;

    const opened = openReportPreview({
      autoPrint: true,
    });

    if (!opened) return;

    showMessage(
      "PDF preview opened. In the print dialog, choose Save as PDF.",
      "success"
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <p className="text-sm font-medium text-blue-600 mb-2">
          Admin Exports
        </p>

        <h2 className="text-xl font-semibold text-slate-900">
          Download Booking Reports
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Export booking records by selected duration.
        </p>
      </div>

      <div className="p-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Duration
            </label>

            <div className="relative">
              <select
                value={selectedDuration}
                onChange={(event) => {
                  setSelectedDuration(event.target.value);
                  setMessage({
                    text: "",
                    type: "",
                  });
                }}
                className="w-full appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <FaChevronDown
                size={12}
                className="absolute right-4 top-4 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
            <p className="text-sm font-semibold text-blue-800">
              Ready to export
            </p>

            <p className="text-sm text-blue-700 mt-1">
              {exportData.length} booking records are available for export.
            </p>
          </div>
        </div>

        {exportData.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No report data found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Change the duration filter or create bookings to generate reports.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <ExportCard
              icon={<FaFileExcel />}
              title="Excel Report"
              description="Downloads a real .xlsx file and opens report preview."
              buttonText="Export Excel"
              buttonClass="bg-green-50 text-green-700 hover:bg-green-100"
              onClick={exportAsExcel}
            />

            <ExportCard
              icon={<FaFilePdf />}
              title="PDF Report"
              description="Opens printable PDF preview in a new tab."
              buttonText="Export PDF"
              buttonClass="bg-slate-100 text-slate-700 hover:bg-slate-200"
              onClick={exportAsPDF}
            />

            <ExportCard
              icon={<FaDownload />}
              title="CSV Report"
              description="Downloads CSV file and opens report preview."
              buttonText="Export CSV"
              buttonClass="bg-blue-50 text-blue-700 hover:bg-blue-100"
              onClick={exportAsCSV}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ExportCard({
  icon,
  title,
  description,
  buttonText,
  buttonClass,
  onClick,
}) {
  return (
    <div className="border border-gray-200 rounded-2xl p-5">
      <div className="w-11 h-11 rounded-xl bg-slate-50 text-blue-600 flex items-center justify-center mb-5">
        {icon}
      </div>

      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>

      <p className="text-sm text-slate-500 mt-2 min-h-[44px]">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${buttonClass}`}
      >
        {icon}
        {buttonText}
      </button>
    </div>
  );
}

export default AdminExports;