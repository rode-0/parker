import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app";
import { createTestCustomer } from "../../test-helpers";

describe("activities routes", () => {
  it("POST /api/activities creates an activity", async () => {
    const customer = await createTestCustomer();
    const res = await request(app)
      .post("/api/activities")
      .send({
        customer_id: customer.id,
        type: "visit",
        date: "2026-03-15",
        duration_minutes: 60,
        notes: "Great meeting",
      })
      .expect(201);

    expect(res.body.data.type).toBe("visit");
    expect(res.body.data.date).toBe("2026-03-15");
  });

  it("POST /api/activities validates required fields", async () => {
    await request(app)
      .post("/api/activities")
      .send({ customer_id: 1 })
      .expect(400);
  });

  it("POST /api/activities validates type enum", async () => {
    const res = await request(app)
      .post("/api/activities")
      .send({ customer_id: 1, type: "invalid", date: "2026-03-15" })
      .expect(400);

    expect(res.body.error).toContain("type");
  });

  it("GET /api/activities/customer/:id returns activities", async () => {
    const customer = await createTestCustomer();
    await request(app).post("/api/activities").send({
      customer_id: customer.id, type: "call", date: "2026-03-10",
    });

    const res = await request(app)
      .get(`/api/activities/customer/${customer.id}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("DELETE /api/activities/:id removes", async () => {
    const customer = await createTestCustomer();
    const created = await request(app).post("/api/activities").send({
      customer_id: customer.id, type: "note", date: "2026-03-10", notes: "test",
    });

    await request(app).delete(`/api/activities/${created.body.data.id}`).expect(200);
  });

  it("GET /api/activities/attention returns customers", async () => {
    await createTestCustomer();
    const res = await request(app).get("/api/activities/attention").expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
