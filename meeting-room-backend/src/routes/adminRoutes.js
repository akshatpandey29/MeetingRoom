const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { authenticate } = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");

// All routes below are protected.
// First authenticate checks token.
// Then adminOnly checks whether logged-in user is admin.
router.use(authenticate);
router.use(adminOnly);

// Admin dashboard stats
// GET /api/admin/stats
router.get("/stats", adminController.getDashboardStats);

// User management
// GET /api/admin/users
router.get("/users", adminController.getAllUsers);

// Change user role
// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", adminController.changeUserRole);

// Enable / disable user
// PATCH /api/admin/users/:id/status
router.patch("/users/:id/status", adminController.toggleUserStatus);

// Booking requests
// GET /api/admin/booking-requests
router.get("/booking-requests", adminController.getBookingRequests);

// Approve booking request
// PATCH /api/admin/booking-requests/:id/approve
router.patch(
  "/booking-requests/:id/approve",
  adminController.approveBookingRequest
);

// Reject booking request
// PATCH /api/admin/booking-requests/:id/reject
router.patch(
  "/booking-requests/:id/reject",
  adminController.rejectBookingRequest
);

module.exports = router;