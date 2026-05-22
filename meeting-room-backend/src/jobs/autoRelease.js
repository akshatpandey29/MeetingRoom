const cron = require('node-cron');
const { Booking } = require('../models');
const { BOOKING_STATUS } = require('../utils/constants');
const { sendBookingCancellationEmail } = require('../services/emailService');

// ── Format time helper ────────────────────────────────────────────────────────
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

// ── Get today's date string ───────────────────────────────────────────────────
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── Auto-release no-show bookings ─────────────────────────────────────────────
async function autoReleaseNoShows() {
  try {
    const now = new Date();
    const todayStr = getTodayStr();

    // Find all confirmed bookings for today that haven't been checked in
    const confirmedBookings = await Booking.find({
      date: todayStr,
      status: BOOKING_STATUS.CONFIRMED,
      checkedIn: { $ne: true },
    });

    let releasedCount = 0;

    for (const booking of confirmedBookings) {
      if (!booking.startTime) continue;

      // Parse start time
      const [sh, sm] = booking.startTime.split(':').map(Number);
      const startDT = new Date(`${todayStr}T${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}:00`);

      // Calculate minutes since start
      const minutesSinceStart = (now - startDT) / 60000;

      // If more than 15 minutes have passed without check-in → no-show
      if (minutesSinceStart >= 15) {
        booking.status = 'no-show';
        booking.cancelledAt = now;
        booking.cancelReason = 'Auto-released: No check-in within 15 minutes of start time';
        await booking.save();
        releasedCount++;

        console.log(`[AutoRelease] No-show: ${booking.roomId} on ${booking.date} at ${booking.startTime} by ${booking.bookedBy}`);

        // Send no-show notification email
        try {
          await sendBookingCancellationEmail({
            to: booking.userEmail,
            name: booking.bookedBy,
            roomName: booking.roomName || '',
            date: formatDateForEmail(booking.date),
            startTime: formatTimeForEmail(booking.startTime),
            endTime: formatTimeForEmail(booking.endTime),
            reason: 'Your booking was auto-released because no check-in was recorded within 15 minutes of the start time.',
          });
        } catch (emailErr) {
          console.error('[AutoRelease] Email failed:', emailErr.message);
        }
      }
    }

    if (releasedCount > 0) {
      console.log(`[AutoRelease] Released ${releasedCount} no-show booking(s) at ${now.toLocaleTimeString()}`);
    }

  } catch (error) {
    console.error('[AutoRelease] Error:', error.message);
  }
}

// ── Start the cron job ────────────────────────────────────────────────────────
// Runs every 5 minutes
function startAutoReleaseJob() {
  cron.schedule('*/5 * * * *', autoReleaseNoShows);
  console.log('[AutoRelease] No-show auto-release job started — runs every 5 minutes');
}

module.exports = { startAutoReleaseJob, autoReleaseNoShows };