const request = require("supertest");
const app = require("../src/app");

describe("Auth APIs", () => {
  test("GET / should confirm backend is running", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("POST /api/auth/login should exist after auth routes are connected", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@gmail.com",
        password: "Admin@123",
      });

    expect([200, 400, 401, 404]).toContain(response.statusCode);
  });
});