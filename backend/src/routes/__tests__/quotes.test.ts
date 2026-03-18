import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app";
import { createTestPrice, createTestCustomer } from "../../test-helpers";

describe("quotes routes", () => {
  it("POST /api/quotes creates a quote", async () => {
    await createTestPrice("vancouver_fob", 50000, 50000);
    const res = await request(app)
      .post("/api/quotes")
      .send({
        customer_name: "John",
        customer_company: "TestCo",
        benchmark: "vancouver_fob",
        grade: "bright_yellow",
        form: "prills",
        quantity_mt: 100,
        freight_cents: 500,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.total_cents).toBeGreaterThan(0);
    expect(res.body.data.status).toBe("draft");
  });

  it("POST /api/quotes validates required fields", async () => {
    const res = await request(app)
      .post("/api/quotes")
      .send({ customer_name: "John" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("POST /api/quotes validates grade enum", async () => {
    const res = await request(app)
      .post("/api/quotes")
      .send({
        customer_name: "J", customer_company: "C", benchmark: "x",
        grade: "invalid", form: "prills", quantity_mt: 10, freight_cents: 0,
      })
      .expect(400);

    expect(res.body.error).toContain("grade");
  });

  it("GET /api/quotes returns list", async () => {
    await createTestPrice();
    await request(app).post("/api/quotes").send({
      customer_name: "J", customer_company: "C", benchmark: "vancouver_fob",
      grade: "bright_yellow", form: "prills", quantity_mt: 10, freight_cents: 0,
    });

    const res = await request(app).get("/api/quotes").expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/quotes?status=draft filters", async () => {
    const res = await request(app).get("/api/quotes?status=draft").expect(200);
    expect(res.body.data.every((q: { status: string }) => q.status === "draft")).toBe(true);
  });

  it("GET /api/quotes/:id returns a quote", async () => {
    await createTestPrice();
    const created = await request(app).post("/api/quotes").send({
      customer_name: "J", customer_company: "C", benchmark: "vancouver_fob",
      grade: "bright_yellow", form: "prills", quantity_mt: 10, freight_cents: 0,
    });

    const res = await request(app).get(`/api/quotes/${created.body.data.id}`).expect(200);
    expect(res.body.data.id).toBe(created.body.data.id);
  });

  it("GET /api/quotes/999 returns 404", async () => {
    await request(app).get("/api/quotes/999").expect(404);
  });

  it("PATCH /api/quotes/:id/status updates status", async () => {
    await createTestPrice();
    const created = await request(app).post("/api/quotes").send({
      customer_name: "J", customer_company: "C", benchmark: "vancouver_fob",
      grade: "bright_yellow", form: "prills", quantity_mt: 10, freight_cents: 0,
    });

    const res = await request(app)
      .patch(`/api/quotes/${created.body.data.id}/status`)
      .send({ status: "sent" })
      .expect(200);

    expect(res.body.data.status).toBe("sent");
  });

  it("DELETE /api/quotes/:id removes quote", async () => {
    await createTestPrice();
    const created = await request(app).post("/api/quotes").send({
      customer_name: "J", customer_company: "C", benchmark: "vancouver_fob",
      grade: "bright_yellow", form: "prills", quantity_mt: 10, freight_cents: 0,
    });

    await request(app).delete(`/api/quotes/${created.body.data.id}`).expect(200);
    await request(app).get(`/api/quotes/${created.body.data.id}`).expect(404);
  });

  it("POST /api/quotes/preview returns pricing without saving", async () => {
    await createTestPrice("vancouver_fob", 50000, 50000);
    const res = await request(app)
      .post("/api/quotes/preview")
      .send({
        customer_name: "J", customer_company: "C", benchmark: "vancouver_fob",
        grade: "bright_yellow", form: "prills", quantity_mt: 100, freight_cents: 0,
      })
      .expect(200);

    expect(res.body.data.base_price_cents).toBe(50000);
    expect(res.body.data.total_cents).toBeGreaterThan(0);
  });

  it("POST /api/quotes with customer_id links quote", async () => {
    await createTestPrice();
    const customer = await createTestCustomer();
    const res = await request(app)
      .post("/api/quotes")
      .send({
        customer_id: customer.id,
        customer_name: "J", customer_company: "C", benchmark: "vancouver_fob",
        grade: "bright_yellow", form: "prills", quantity_mt: 10, freight_cents: 0,
      })
      .expect(201);

    expect(res.body.data.customer_id).toBe(customer.id);
  });
});
