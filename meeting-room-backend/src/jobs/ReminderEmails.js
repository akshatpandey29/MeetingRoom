const cron = require('node-cron');
const { Booking } = require('../models');
const { BOOKING_STATUS } = require('../utils/constants');
const { sendEmail } = require('../services/emailService');

// ── Format helpers ────────────────────────────────────────────────────────────
function formatTimeForEmail(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const dh = h % 12 || 12;
  return `${String(dh).padStart(2,'0')}:${String(m).padStart(2,'0')} ${period}`;
}

function formatDateForEmail(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── Send reminder email ───────────────────────────────────────────────────────
async function sendReminderEmail({ to, name, roomName, date, startTime, endTime }) {
  const subject = `⏰ Reminder: Your meeting starts in 15 minutes — ${roomName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h2 style="color: #fff; margin: 0; font-size: 20px;">🔔 RoomBook Reminder</h2>
      </div>
      <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
        <h3 style="color: #0f172a; margin: 0 0 8px;">Your meeting starts in 15 minutes!</h3>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Hello ${name}, this is a reminder that your meeting is starting soon.
        </p>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 14px; color: #475569;">
            <tr><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">Room</td><td style="padding: 6px 0;">${roomName}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">Date</td><td style="padding: 6px 0;">${date}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">Start Time</td><td style="padding: 6px 0; color: #2563eb; font-weight: 600;">${startTime}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">End Time</td><td style="padding: 6px 0;">${endTime}</td></tr>
          </table>
        </div>
        <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
          <p style="color: #92400e; font-size: 13px; margin: 0; font-weight: 500;">
            ⚠️ Please check in within 15 minutes of your start time to secure your room. 
            Bookings without check-in are automatically released.
          </p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Go to <strong>My Bookings</strong> to check in when you arrive at the room.
        </p>
      </div>
    </div>
  `;

  await sendEmail({ to, subject, html, text: `Reminder: Your meeting in ${roomName} starts in 15 minutes at ${startTime}.` });
}

// ── Send reminders for upcoming bookings ──────────────────────────────────────
async function sendUpcomingReminders() {
  try {
    const now = new Date();
    const todayStr = getTodayStr();

    // Find confirmed bookings for today not yet checked in
    const bookings = await Booking.find({
      date: todayStr,
      status: BOOKING_STATUS.CONFIRMED,
      checkedIn: { $ne: true },
      reminderSent: { $ne: true }, // don't send twice
    });

    let sentCount = 0;

    for (const booking of bookings) {
      if (!booking.startTime) continue;

      const [sh, sm] = booking.startTime.split(':').map(Number);
      const startDT = new Date(`${todayStr}T${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}:00`);

      // Minutes until meeting starts
      const minsUntilStart = (startDT - now) / 60000;

      // Send reminder if between 14 and 16 minutes before start
      if (minsUntilStart >= 14 && minsUntilStart <= 16) {
        try {
          await sendReminderEmail({
            to: booking.userEmail,
            name: booking.bookedBy,
            roomName: booking.roomName || '',
            date: formatDateForEmail(booking.date),
            startTime: formatTimeForEmail(booking.startTime),
            endTime: formatTimeForEmail(booking.endTime),
          });

          // Mark reminder as sent so we don't send again
          booking.reminderSent = true;
          await booking.save();
          sentCount++;

          console.log(`[Reminder] Sent to ${booking.userEmail} for ${booking.roomName} at ${booking.startTime}`);
        } catch (emailErr) {
          console.error('[Reminder] Email failed:', emailErr.message);
        }
      }
    }

    if (sentCount > 0) {
      console.log(`[Reminder] Sent ${sentCount} reminder(s) at ${now.toLocaleTimeString()}`);
    }

  } catch (error) {
    console.error('[Reminder] Error:', error.message);
  }
}

// ── Start the cron job ────────────────────────────────────────────────────────
// Runs every minute to catch the 15-min window accurately
function startReminderJob() {
  cron.schedule('* * * * *', sendUpcomingReminders);
  console.log('[Reminder] Email reminder job started — runs every minute');
}

module.exports = { startReminderJob, sendUpcomingReminders };