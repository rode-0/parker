import { Router, Request, Response } from "express";
import type { PricingBenchmark } from "../types";
import { getAllLatestPrices, getPriceHistory, addPrice } from "../services/pricing";

const router = Router();

const VALID_BENCHMARKS = ["tampa_cfr", "vancouver_fob", "middle_east_fob", "china_cfr"];

router.get("/", async (_req: Request, res: Response) => {
  const prices = await getAllLatestPrices();
  res.json({ success: true, data: prices });
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
