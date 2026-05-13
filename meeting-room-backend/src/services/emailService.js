const nodemailer = require("nodemailer");
const env = require("../config/env");
const logger = require("../utils/logger");

const isEmailConfigured = () => {
  return (
    env.email &&
    env.email.host &&
    env.email.user &&
    env.email.pass
  );
};

const createTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port || 587,
    secure: env.email.port === 465,
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      logger.warn("Email service is not configured. Email was not sent.", {
        to,
        subject,
      });

      return {
        success: false,
        message: "Email service is not configured.",
      };
    }

    const mailOptions = {
      from: `"Meeting Room Scheduler" <${env.email.user}>`,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info("Email sent successfully", {
      to,
      subject,
      messageId: info.messageId,
    });

    return {
      success: true,
      message: "Email sent successfully.",
      data: info,
    };
  } catch (error) {
    logger.error("Email sending failed:", error);

    return {
      success: false,
      message: "Email sending failed.",
      error: error.message,
    };
  }
};

const sendWelcomeEmail = async ({ to, name }) => {
  return sendEmail({
    to,
    subject: "Welcome to Meeting Room Scheduler",
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been created successfully.</p>
      <p>You can now log in and book meeting rooms.</p>
      <br />
      <p>Regards,</p>
      <p><strong>Meeting Room Scheduler Team</strong></p>
    `,
    text: `Welcome, ${name}! Your account has been created successfully. You can now log in and book meeting rooms.`,
  });
};

const sendBookingConfirmationEmail = async ({
  to,
  name,
  roomName,
  date,
  startTime,
  endTime,
}) => {
  return sendEmail({
    to,
    subject: "Booking Confirmed",
    html: `
      <h2>Booking Confirmed</h2>
      <p>Hello ${name},</p>
      <p>Your meeting room booking has been confirmed.</p>

      <h3>Booking Details</h3>
      <p><strong>Room:</strong> ${roomName}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${startTime} - ${endTime}</p>

      <br />
      <p>Regards,</p>
      <p><strong>Meeting Room Scheduler Team</strong></p>
    `,
    text: `Hello ${name}, your booking is confirmed. Room: ${roomName}, Date: ${date}, Time: ${startTime} - ${endTime}`,
  });
};

const sendBookingCancellationEmail = async ({
  to,
  name,
  roomName,
  date,
  startTime,
  endTime,
}) => {
  return sendEmail({
    to,
    subject: "Booking Cancelled",
    html: `
      <h2>Booking Cancelled</h2>
      <p>Hello ${name},</p>
      <p>Your meeting room booking has been cancelled.</p>

      <h3>Cancelled Booking Details</h3>
      <p><strong>Room:</strong> ${roomName}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${startTime} - ${endTime}</p>

      <br />
      <p>Regards,</p>
      <p><strong>Meeting Room Scheduler Team</strong></p>
    `,
    text: `Hello ${name}, your booking has been cancelled. Room: ${roomName}, Date: ${date}, Time: ${startTime} - ${endTime}`,
  });
};

const sendBookingRequestStatusEmail = async ({
  to,
  name,
  status,
  roomName,
  date,
  startTime,
  endTime,
  adminNote = "",
}) => {
  const isApproved = status === "approved";

  return sendEmail({
    to,
    subject: isApproved
      ? "Booking Request Approved"
      : "Booking Request Rejected",
    html: `
      <h2>Booking Request ${isApproved ? "Approved" : "Rejected"}</h2>
      <p>Hello ${name},</p>
      <p>Your booking request has been <strong>${status}</strong>.</p>

      <h3>Request Details</h3>
      <p><strong>Room:</strong> ${roomName}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${startTime} - ${endTime}</p>

      ${
        adminNote
          ? `<p><strong>Admin Note:</strong> ${adminNote}</p>`
          : ""
      }

      <br />
      <p>Regards,</p>
      <p><strong>Meeting Room Scheduler Team</strong></p>
    `,
    text: `Hello ${name}, your booking request has been ${status}. Room: ${roomName}, Date: ${date}, Time: ${startTime} - ${endTime}. ${adminNote ? `Admin Note: ${adminNote}` : ""}`,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendBookingRequestStatusEmail,
};