import type { SulfurGrade, SulfurForm, PricingBenchmark, SulfurPrice, PriceEntry } from "../types";
import { getDatabase, saveDatabase } from "../db";
import { priceLogger } from "../lib/logger";

const GRADE_ADJUSTMENTS: Record<SulfurGrade, number> = {
  bright_yellow: 500,
  dark: -800,
  recovered: -300,
};

const FORM_ADJUSTMENTS: Record<SulfurForm, number> = {
  molten: 0,
  prills: 200,
  granular: 150,
  blocks: -100,
};

function getVolumeDiscount(quantityMt: number): number {
  if (quantityMt >= 10000) return 300;
  if (quantityMt >= 5000) return 200;
  if (quantityMt >= 1000) return 100;
  return 0;
}

function rowToPrice(columns: string[], values: unknown[]): SulfurPrice {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => { obj[col] = values[i]; });
  return obj as unknown as SulfurPrice;
}

export async function getLatestPrice(benchmark: string): Promise<SulfurPrice | null> {
  const db = await getDatabase();
  const result = db.exec(
    "SELECT * FROM sulfur_prices WHERE benchmark = ? ORDER BY recorded_at DESC LIMIT 1",
    [benchmark]
  );
  if (!result[0] || result[0].values.length === 0) return null;
  return rowToPrice(result[0].columns, result[0].values[0]!);
}

export async function getAllLatestPrices(): Promise<SulfurPrice[]> {
  const db = await getDatabase();
  const result = db.exec(
    `SELECT sp.*
     FROM sulfur_prices sp
     INNER JOIN (
       SELECT benchmark, MAX(recorded_at) as max_date
       FROM sulfur_prices
       GROUP BY benchmark
     ) latest ON sp.benchmark = latest.benchmark AND sp.recorded_at = latest.max_date`
  );
  if (!result[0]) return [];
  return result[0].values.map((row: unknown[]) => rowToPrice(result[0]!.columns, row));
}

export async function getPriceHistory(
  benchmark: string,
  days: number = 90
): Promise<SulfurPrice[]> {
  const db = await getDatabase();
  const result = db.exec(
    `SELECT * FROM sulfur_prices
     WHERE benchmark = ? AND recorded_at >= datetime('now', ?)
     ORDER BY recorded_at ASC`,
    [benchmark, `-${days} days`]
  );
  if (!result[0]) return [];
  return result[0].values.map((row: unknown[]) => rowToPrice(result[0]!.columns, row));
}

export async function addPrice(entry: PriceEntry): Promise<SulfurPrice> {
  priceLogger.info({ benchmark: entry.benchmark, cents: entry.price_cents }, "Adding price");
  const db = await getDatabase();
  db.run(
    "INSERT INTO sulfur_prices (benchmark, price_low_cents, price_high_cents, price_type, delivery_term, source) VALUES (?, ?, ?, ?, ?, ?)",
    [entry.benchmark, entry.price_cents, entry.price_cents, "N", "", entry.source]
  );
  const result = db.exec("SELECT * FROM sulfur_prices WHERE id = last_insert_rowid()");
  saveDatabase();
  return rowToPrice(result[0]!.columns, result[0]!.values[0]!);
}

export async function calculateQuotePrice(
  benchmark: string,
  grade: SulfurGrade,
  form: SulfurForm,
  quantityMt: number,
  freightCents: number
): Promise<{
  base_price_cents: number;
  grade_adj_cents: number;
  form_adj_cents: number;
  freight_cents: number;
  volume_discount_cents: number;
  total_cents: number;
}> {
  const latestPrice = await getLatestPrice(benchmark);
  if (!latestPrice) {
    priceLogger.error({ benchmark }, "No pricing data available for benchmark");
    throw new Error(`No pricing data available for benchmark: ${benchmark}`);
  }

  // Use midpoint of range for quote pricing
  const basePriceCents = Math.round(
    ((latestPrice as unknown as Record<string, number>).price_low_cents +
     (latestPrice as unknown as Record<string, number>).price_high_cents) / 2
  );
  const gradeAdj = GRADE_ADJUSTMENTS[grade];
  const formAdj = FORM_ADJUSTMENTS[form];
  const volumeDiscount = getVolumeDiscount(quantityMt);

  const perTonCents = basePriceCents + gradeAdj + formAdj + freightCents - volumeDiscount;
  const totalCents = Math.round(perTonCents * quantityMt);

  return {
    base_price_cents: basePriceCents,
    grade_adj_cents: gradeAdj,
    form_adj_cents: formAdj,
    freight_cents: freightCents,
    volume_discount_cents: volumeDiscount,
    total_cents: totalCents,
  };
}

export { GRADE_ADJUSTMENTS, FORM_ADJUSTMENTS, getVolumeDiscount };
