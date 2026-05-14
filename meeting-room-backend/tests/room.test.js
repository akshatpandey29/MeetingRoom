const request = require("supertest");
const app = require("../src/app");

describe("Room APIs", () => {
  let token = "";

  beforeAll(() => {
    token = "test-token";
  });

  test("GET / should check backend health", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Backend is running.");
  });

  test("GET /api/rooms should require authentication", async () => {
    const response = await request(app).get("/api/rooms");

    expect(response.statusCode).toBe(401);
  });
});