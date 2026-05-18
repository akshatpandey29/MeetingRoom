const request = require("supertest");
const app = require("../src/app");

describe("Auth APIs", () => {
  test("GET / should confirm backend is running", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("POST /api/auth/login should validate login payload", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "not-an-email",
        password: "",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
