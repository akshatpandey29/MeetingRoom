const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { User } = require("../models");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");

const authenticate = async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.accessToken;

    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return ApiResponse.unauthorized(res, "No token provided");
    }

    const decoded = jwt.verify(token, env.jwt.secret);

    const user = await User.findById(decoded.id).select(
      "-password -refreshToken"
    );

    if (!user || !user.isActive) {
      return ApiResponse.unauthorized(res, "User not found or inactive");
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);

    if (error.name === "TokenExpiredError") {
      return ApiResponse.unauthorized(res, "Token expired");
    }

    if (error.name === "JsonWebTokenError") {
      return ApiResponse.unauthorized(res, "Invalid token");
    }

    return ApiResponse.unauthorized(res, "Authentication failed");
  }
};

module.exports = { authenticate };