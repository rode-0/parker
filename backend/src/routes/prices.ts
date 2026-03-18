import { Router, Request, Response } from "express";
import type { PricingBenchmark } from "../types";
import { getAllLatestPrices, getPriceHistory, addPrice } from "../services/pricing";
import { getDatabase } from "../db";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const prices = await getAllLatestPrices();
  res.json({ success: true, data: prices });
});

// Static routes must come before /:benchmark/history
router.get("/freight/latest", async (_req: Request, res: Response) => {
  const db = await getDatabase();
  const result = db.exec(
    `SELECT fr.* FROM freight_rates fr
     INNER JOIN (SELECT route, MAX(recorded_at) as max_date FROM freight_rates GROUP BY route) latest
     ON fr.route = latest.route AND fr.recorded_at = latest.max_date`
  );
  if (!result[0]) { res.json({ success: true, data: [] }); return; }
  const data = result[0].values.map((row: unknown[]) => {
    const obj: Record<string, unknown> = {};
    result[0]!.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
  res.json({ success: true, data });
});

router.get("/markets/latest", async (_req: Request, res: Response) => {
  const db = await getDatabase();
  const result = db.exec(
    `SELECT rm.* FROM related_markets rm
     INNER JOIN (SELECT market, MAX(recorded_at) as max_date FROM related_markets GROUP BY market) latest
     ON rm.market = latest.market AND rm.recorded_at = latest.max_date`
  );
  if (!result[0]) { res.json({ success: true, data: [] }); return; }
  const data = result[0].values.map((row: unknown[]) => {
    const obj: Record<string, unknown> = {};
    result[0]!.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
  res.json({ success: true, data });
});

router.get("/fx/latest", async (_req: Request, res: Response) => {
  const db = await getDatabase();
  const result = db.exec(
    `SELECT er.* FROM exchange_rates er
     INNER JOIN (SELECT currency, MAX(recorded_at) as max_date FROM exchange_rates GROUP BY currency) latest
     ON er.currency = latest.currency AND er.recorded_at = latest.max_date`
  );
  if (!result[0]) { res.json({ success: true, data: [] }); return; }
  const data = result[0].values.map((row: unknown[]) => {
    const obj: Record<string, unknown> = {};
    result[0]!.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
  res.json({ success: true, data });
});

router.get("/:benchmark/history", async (req: Request, res: Response) => {
  const benchmark = req.params.benchmark as string;
  if (!benchmark) {
    res.status(400).json({ success: false, error: "Invalid benchmark" });
    return;
  }

  const days = parseInt(req.query.days as string) || 90;
  const history = await getPriceHistory(benchmark as PricingBenchmark, days);
  res.json({ success: true, data: history });
});

router.post("/", async (req: Request, res: Response) => {
  const { benchmark, price_cents, source } = req.body;

  if (!benchmark || typeof benchmark !== "string") {
    res.status(400).json({ success: false, error: "Invalid benchmark" });
    return;
  }
  if (typeof price_cents !== "number" || price_cents <= 0) {
    res.status(400).json({ success: false, error: "price_cents must be a positive number" });
    return;
  }

  const price = await addPrice({
    benchmark: benchmark as PricingBenchmark,
    price_cents,
    source: source || "manual",
  });
  res.status(201).json({ success: true, data: price });
});

export default router;
