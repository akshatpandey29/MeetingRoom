require("./src/config/env");

const env = require("./src/config/env");
const { connectDB } = require("./src/config/database");
const app = require("./src/app");
const logger = require("./src/utils/logger");

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        logger.info("Process terminated");
        process.exit(0);
      });
    });

    process.on("unhandledRejection", (err) => {
      logger.error("Unhandled rejection:", err);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();