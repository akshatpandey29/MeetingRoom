const request = require("supertest");
const app = require("../src/app");

describe("Booking APIs", () => {
  test("POST /api/bookings should require authentication", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send({
        roomId: "room-id",
        date: "2026-05-12",
        startTime: "10:00",
        endTime: "11:00",
        purpose: "Team meeting",
      });

    expect(response.statusCode).toBe(401);
  });

  test("GET /api/bookings/my should require authentication", async () => {
    const response = await request(app).get("/api/bookings/my");

    expect(response.statusCode).toBe(401);
  });

  test("GET /api/bookings should require authentication", async () => {
    const response = await request(app).get("/api/bookings");

    expect(response.statusCode).toBe(401);
  });
});