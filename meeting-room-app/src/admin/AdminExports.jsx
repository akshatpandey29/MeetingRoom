import { useState } from "react";
import * as XLSX from "xlsx";
import {
  FaCalendarAlt,
  FaChevronDown,
  FaFileExcel,
  FaFilePdf,
  FaDownload,
  FaTimesCircle,
  FaCheckCircle,
  FaFileExport,
  FaTable,
  FaUsers,
} from "react-icons/fa";

function AdminExports({ bookings }) {
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

  const formatDisplayDate = (dateValue) => {
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

  const uniqueUsers = new Set(
    filteredBookings
      .map((booking) => booking.userEmail)
      .filter((email) => Boolean(email))
  );

  const exportData = filteredBookings.map((booking, index) => ({
    serialNo: index + 1,
    roomName: booking.roomName || "Not available",
    date: formatDisplayDate(booking.date),
    slot: booking.slot || "Not available",
    bookedBy: booking.bookedBy || "Unknown",
    userEmail: booking.userEmail || "Not available",
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
      showMessage("No booking records available for selected duration.", "error");
      return false;
    }

    return true;
  };

  const exportAsExcel = () => {
    if (!checkDataAvailable()) return;

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 24 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 28 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Booking Report");

    XLSX.writeFile(workbook, `booking-report-${selectedDuration}.xlsx`);

    showMessage("Excel report downloaded successfully.", "success");
  };

  const exportAsCSV = () => {
    if (!checkDataAvailable()) return;

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csvOutput], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `booking-report-${selectedDuration}.csv`;
    link.click();

    URL.revokeObjectURL(url);

    showMessage("CSV report downloaded successfully.", "success");
  };

  const exportAsPDF = () => {
    if (!checkDataAvailable()) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      showMessage("Please allow popups to export PDF report.", "error");
      return;
    }

    const rows = exportData
      .map(
        (booking) => `
          <tr>
            <td>${booking.serialNo}</td>
            <td>${booking.roomName}</td>
            <td>${booking.date}</td>
            <td>${booking.slot}</td>
            <td>${booking.bookedBy}</td>
            <td>${booking.userEmail}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
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
              font-size: 11px;
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
            }

            tr:nth-child(even) {
              background: #f8fafc;
            }

            @media print {
              body {
                padding: 18px;
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
            Duration: ${selectedDurationLabel} &nbsp; | &nbsp;
            Total Records: ${exportData.length}
          </div>

          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Room Name</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Booked By</th>
                <th>User Email</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 300);

    showMessage(
      "PDF report is ready. Choose Save as PDF in print window.",
      "success"
    );
  };

  return (
    <div className="space-y-4">
      {message.text && (
        <div
          className={`px-4 py-3 rounded-xl text-sm border flex items-center gap-2 ${
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ReportInfoCard
          icon={<FaTable />}
          title="Booking Records"
          value={filteredBookings.length}
          helper="Records available for selected duration"
          color="blue"
        />

        <ReportInfoCard
          icon={<FaCalendarAlt />}
          title="Duration"
          value={selectedDurationLabel}
          helper="Current report filter"
          color="purple"
        />

        <ReportInfoCard
          icon={<FaUsers />}
          title="Unique Users"
          value={uniqueUsers.size}
          helper="Employees in filtered report"
          color="green"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FaFileExport size={14} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Reports & Exports
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Download booking data in Excel, PDF, or CSV format.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Select Duration
              </label>

              <div className="relative">
                <FaCalendarAlt
                  size={13}
                  className="absolute left-3.5 top-3 text-slate-400"
                />

                <select
                  value={selectedDuration}
                  onChange={(event) => {
                    setSelectedDuration(event.target.value);
                    setMessage({
                      text: "",
                      type: "",
                    });
                  }}
                  className="w-full appearance-none pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <FaChevronDown
                  size={12}
                  className="absolute right-4 top-3.5 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-blue-800">
                {filteredBookings.length} records ready
              </p>

              <p className="text-xs text-blue-700 mt-1">
                Report duration: {selectedDurationLabel}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportAsExcel}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              <FaFileExcel size={13} />
              Export Excel
            </button>

            <button
              type="button"
              onClick={exportAsPDF}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <FaFilePdf size={13} />
              Export PDF
            </button>

            <button
              type="button"
              onClick={exportAsCSV}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <FaDownload size={13} />
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportInfoCard({ icon, title, value, helper, color }) {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          styles[color] || styles.blue
        }`}
      >
        {icon}
      </div>

      <div>
        <p className="text-xs text-slate-500">{title}</p>

        <h3 className="text-lg font-bold text-slate-900 leading-tight">
          {value}
        </h3>

        <p className="text-[11px] text-slate-400 mt-0.5">{helper}</p>
      </div>
    </div>
  );
}

export default AdminExports;