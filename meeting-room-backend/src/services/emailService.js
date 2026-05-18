const { Resend } = require('resend');
const logger = require('../utils/logger');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'onboarding@resend.dev';
const APP_NAME = 'RoomBook';

// ── Send Email ────────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY not configured. Email not sent.', { to, subject });
      return { success: false, message: 'Email service not configured.' };
    }

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      logger.error('Resend email error:', error);
      return { success: false, message: error.message };
    }

    logger.info('Email sent successfully', { to, subject, id: data?.id });
    return { success: true, message: 'Email sent successfully.', data };

  } catch (error) {
    logger.error('Email sending failed:', error);
    return { success: false, message: 'Email sending failed.', error: error.message };
  }
};

// ── Welcome Email ─────────────────────────────────────────────────────────────
const sendWelcomeEmail = async ({ to, name }) => {
  return sendEmail({
    to,
    subject: `Welcome to ${APP_NAME}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">${APP_NAME}</h2>
          <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Meeting Room Scheduler</p>
        </div>
        <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h3 style="color: #0f172a; margin: 0 0 12px;">Welcome, ${name}! 👋</h3>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            Your account has been created successfully. You can now log in and start booking meeting rooms.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin: 0;">
            © 2026 Plaxonic Technologies · ${APP_NAME}
          </p>
        </div>
      </div>
    `,
    text: `Welcome, ${name}! Your account has been created successfully. You can now log in and book meeting rooms.`,
  });
};

// ── Booking Confirmation Email ─────────────────────────────────────────────────
const sendBookingConfirmationEmail = async ({ to, name, roomName, date, startTime, endTime }) => {
  return sendEmail({
    to,
    subject: 'Booking Confirmed — RoomBook',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">${APP_NAME}</h2>
        </div>
        <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h3 style="color: #0f172a;">Booking Confirmed ✓</h3>
          <p style="color: #64748b; font-size: 14px;">Hello ${name},</p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">Your meeting room booking has been confirmed.</p>
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Room:</strong> ${roomName}</p>
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 0; font-size: 13px;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin: 0;">
            © 2026 Plaxonic Technologies · ${APP_NAME}
          </p>
        </div>
      </div>
    `,
    text: `Hello ${name}, your booking is confirmed. Room: ${roomName}, Date: ${date}, Time: ${startTime} - ${endTime}`,
  });
};

// ── Booking Cancellation Email ────────────────────────────────────────────────
const sendBookingCancellationEmail = async ({ to, name, roomName, date, startTime, endTime }) => {
  return sendEmail({
    to,
    subject: 'Booking Cancelled — RoomBook',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">${APP_NAME}</h2>
        </div>
        <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h3 style="color: #0f172a;">Booking Cancelled</h3>
          <p style="color: #64748b; font-size: 14px;">Hello ${name},</p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">Your meeting room booking has been cancelled.</p>
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Room:</strong> ${roomName}</p>
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 0; font-size: 13px;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin: 0;">
            © 2026 Plaxonic Technologies · ${APP_NAME}
          </p>
        </div>
      </div>
    `,
    text: `Hello ${name}, your booking has been cancelled. Room: ${roomName}, Date: ${date}, Time: ${startTime} - ${endTime}`,
  });
};

// ── Booking Request Status Email ──────────────────────────────────────────────
const sendBookingRequestStatusEmail = async ({ to, name, status, roomName, date, startTime, endTime, adminNote = '' }) => {
  const isApproved = status === 'approved';
  return sendEmail({
    to,
    subject: isApproved ? 'Booking Request Approved — RoomBook' : 'Booking Request Rejected — RoomBook',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">${APP_NAME}</h2>
        </div>
        <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h3 style="color: #0f172a;">Booking Request ${isApproved ? 'Approved ✓' : 'Rejected'}</h3>
          <p style="color: #64748b; font-size: 14px;">Hello ${name},</p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            Your booking request has been <strong>${status}</strong>.
          </p>
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Room:</strong> ${roomName}</p>
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
            ${adminNote ? `<p style="margin: 0; font-size: 13px;"><strong>Note:</strong> ${adminNote}</p>` : ''}
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin: 0;">
            © 2026 Plaxonic Technologies · ${APP_NAME}
          </p>
        </div>
      </div>
    `,
    text: `Hello ${name}, your booking request has been ${status}. Room: ${roomName}, Date: ${date}, Time: ${startTime} - ${endTime}.${adminNote ? ` Note: ${adminNote}` : ''}`,
  });
};

// ── Password Reset Email ──────────────────────────────────────────────────────
const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  return sendEmail({
    to,
    subject: 'Reset Your Password — RoomBook',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">${APP_NAME}</h2>
          <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Meeting Room Scheduler</p>
        </div>
        <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h3 style="color: #0f172a; margin: 0 0 12px;">Reset your password</h3>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            Hello ${name},<br/><br/>
            We received a request to reset your password. Click the button below to set a new password.
            This link expires in <strong>15 minutes</strong>.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}"
              style="background: #0f172a; color: #fff; padding: 14px 32px; border-radius: 10px;
              text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin: 0;">
            © 2026 Plaxonic Technologies · ${APP_NAME}
          </p>
        </div>
      </div>
    `,
    text: `Hello ${name}, reset your password here: ${resetUrl}. This link expires in 15 minutes.`,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendBookingRequestStatusEmail,
  sendPasswordResetEmail,
};