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
    durationOptions.find((option) => option.value === selectedDuration)?.label ||
    "All Bookings";

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
      showMessage(
        "No booking records available for the selected duration.",
        "error"
      );
      return false;
    }

    return true;
  };

  const downloadFile = (content, fileName, fileType) => {
    const blob = new Blob([content], { type: fileType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    if (!checkDataAvailable()) return;

    const headers = [
      "S.No",
      "Room Name",
      "Date",
      "Slot",
      "Booked By",
      "User Email",
    ];

    const rows = exportData.map((booking) => [
      booking.serialNo,
      booking.roomName,
      booking.date,
      booking.slot,
      booking.bookedBy,
      booking.userEmail,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    downloadFile(
      csvContent,
      `booking-report-${selectedDuration}.csv`,
      "text/csv;charset=utf-8;"
    );

    showMessage("CSV report downloaded successfully.", "success");
  };

  const exportAsExcel = () => {
    if (!checkDataAvailable()) return;

    const excelRows = exportData.map((booking) => ({
      "S.No": booking.serialNo,
      "Room Name": booking.roomName,
      Date: booking.date,
      Slot: booking.slot,
      "Booked By": booking.bookedBy,
      "User Email": booking.userEmail,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 18 },
      { wch: 24 },
      { wch: 24 },
      { wch: 35 },
    ];

    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          alignment: {
            vertical: "center",
            horizontal: row === 0 ? "center" : "left",
            wrapText: true,
          },
          font: {
            bold: row === 0,
          },
        };
      }
    }

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Booking Report");

    XLSX.writeFile(workbook, `booking-report-${selectedDuration}.xlsx`);

    showMessage("Excel report downloaded successfully.", "success");
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

            .col-small {
              width: 8%;
            }

            .col-room {
              width: 22%;
            }

            .col-date {
              width: 15%;
            }

            .col-slot {
              width: 17%;
            }

            .col-user {
              width: 18%;
            }

            .col-email {
              width: 20%;
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
            <div class="small-title">RoomBook Admin Export</div>
            <h1>Booking Report</h1>
            <div class="subtitle">Generated from Admin Workspace</div>
          </div>

          <div class="summary-box">
            Duration: ${selectedDurationLabel} &nbsp; | &nbsp;
            Total Records: ${exportData.length}
          </div>

          <table>
            <thead>
              <tr>
                <th class="col-small">S.No</th>
                <th class="col-room">Room Name</th>
                <th class="col-date">Date</th>
                <th class="col-slot">Slot</th>
                <th class="col-user">Booked By</th>
                <th class="col-email">User Email</th>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Duration
            </label>

            <div className="relative">
              <FaCalendarAlt
                size={13}
                className="absolute left-3.5 top-3.5 text-slate-400"
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
                className="w-full appearance-none pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-sm font-medium text-blue-800">
              Ready to export
            </p>

            <p className="text-sm text-blue-700 mt-1">
              {filteredBookings.length} booking record
              {filteredBookings.length !== 1 ? "s" : ""} for{" "}
              {selectedDurationLabel.toLowerCase()}.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportAsExcel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
          >
            <FaFileExcel size={13} />
            Export Excel
          </button>

          <button
            type="button"
            onClick={exportAsPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <FaFilePdf size={13} />
            Export PDF
          </button>

          <button
            type="button"
            onClick={exportAsCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <FaDownload size={13} />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminExports;