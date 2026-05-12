const express = require("express");
const cors = require("cors");
const env = require("./src/config/env");
const { connectDB } = require("./src/config/database");

const roomRoutes = require("./src/routes/roomRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

const {
  errorHandler,
  notFoundHandler,
} = require("./src/middleware/errorHandler");

const { globalLimiter } = require("./src/middleware/rateLimiter");

const app = express();

app.use(cors());
app.use(express.json());
app.use(globalLimiter);

connectDB();

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running.",
    data: {
      service: "meeting-room-scheduler-api",
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Backend running on port ${env.port}`);
});