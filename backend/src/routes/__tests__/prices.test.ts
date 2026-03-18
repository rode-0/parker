import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app";
import { createTestPrice } from "../../test-helpers";

describe("prices routes", () => {
  it("GET /api/prices returns latest prices", async () => {
    await createTestPrice("vancouver_fob", 50000, 50500);
    const res = await request(app).get("/api/prices").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/prices/:benchmark/history returns history", async () => {
    await createTestPrice("vancouver_fob", 50000, 50500);
    const res = await request(app)
      .get("/api/prices/vancouver_fob/history?days=365")
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("POST /api/prices adds a price", async () => {
    const res = await request(app)
      .post("/api/prices")
      .send({ benchmark: "test_bm", price_cents: 45000, source: "manual" })
      .expect(201);

    expect(res.body.data.benchmark).toBe("test_bm");
  });

  it("POST /api/prices validates price_cents", async () => {
    await request(app)
      .post("/api/prices")
      .send({ benchmark: "x", price_cents: -1 })
      .expect(400);
  });

  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health").expect(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("gg-internal-api");
  });

  it("GET /api/prices/freight/latest returns freight data", async () => {
    const res = await request(app).get("/api/prices/freight/latest").expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/prices/markets/latest returns markets data", async () => {
    const res = await request(app).get("/api/prices/markets/latest").expect(200);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/prices/fx/latest returns exchange rates", async () => {
    const res = await request(app).get("/api/prices/fx/latest").expect(200);
    expect(res.body.success).toBe(true);
  });
});
