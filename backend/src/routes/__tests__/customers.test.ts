import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app";

describe("customers routes", () => {
  it("POST /api/customers creates a customer", async () => {
    const res = await request(app)
      .post("/api/customers")
      .send({
        company_name: "Mosaic",
        address: "123 Main",
        city: "Plymouth",
        state: "MN",
        customer_type: "fertilizer",
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.company_name).toBe("Mosaic");
    expect(res.body.data.customer_type).toBe("fertilizer");
  });

  it("POST /api/customers validates required fields", async () => {
    await request(app)
      .post("/api/customers")
      .send({ company_name: "Test" })
      .expect(400);
  });

  it("GET /api/customers returns list", async () => {
    await request(app).post("/api/customers").send({
      company_name: "A", address: "1 St", city: "X", state: "TX",
    });

    const res = await request(app).get("/api/customers").expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/customers?search= filters by name", async () => {
    await request(app).post("/api/customers").send({
      company_name: "UniqueSearchName", address: "1 St", city: "X", state: "TX",
    });

    const res = await request(app).get("/api/customers?search=UniqueSearch").expect(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("GET /api/customers/:id returns one", async () => {
    const created = await request(app).post("/api/customers").send({
      company_name: "GetMe", address: "1 St", city: "X", state: "TX",
    });

    const res = await request(app).get(`/api/customers/${created.body.data.id}`).expect(200);
    expect(res.body.data.company_name).toBe("GetMe");
  });

  it("GET /api/customers/999 returns 404", async () => {
    await request(app).get("/api/customers/999").expect(404);
  });

  it("PUT /api/customers/:id updates", async () => {
    const created = await request(app).post("/api/customers").send({
      company_name: "OldName", address: "1 St", city: "X", state: "TX",
    });

    const res = await request(app)
      .put(`/api/customers/${created.body.data.id}`)
      .send({ company_name: "NewName" })
      .expect(200);

    expect(res.body.data.company_name).toBe("NewName");
  });

  it("DELETE /api/customers/:id removes", async () => {
    const created = await request(app).post("/api/customers").send({
      company_name: "DeleteMe", address: "1 St", city: "X", state: "TX",
    });

    await request(app).delete(`/api/customers/${created.body.data.id}`).expect(200);
    await request(app).get(`/api/customers/${created.body.data.id}`).expect(404);
  });

  it("GET /api/customers/map returns only geocoded", async () => {
    const res = await request(app).get("/api/customers/map").expect(200);
    expect(res.body.data.every((c: { latitude: number | null }) => c.latitude !== null)).toBe(true);
  });
});
