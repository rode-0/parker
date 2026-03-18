import type { Quote, CreateQuoteInput } from "../types";
import { getDatabase, saveDatabase } from "../db";
import { calculateQuotePrice } from "./pricing";
import { quoteLogger } from "../lib/logger";

function rowToQuote(columns: string[], values: unknown[]): Quote {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => { obj[col] = values[i]; });
  return obj as unknown as Quote;
}

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  quoteLogger.info({ customer: input.customer_company, benchmark: input.benchmark, qty: input.quantity_mt }, "Creating quote");
  const pricing = await calculateQuotePrice(
    input.benchmark,
    input.grade,
    input.form,
    input.quantity_mt,
    input.freight_cents
  );

  const db = await getDatabase();
  db.run(
    `INSERT INTO quotes (
      customer_id, customer_name, customer_company, benchmark, grade, form,
      quantity_mt, base_price_cents, grade_adj_cents, form_adj_cents,
      freight_cents, volume_discount_cents, total_cents, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.customer_id ?? null,
      input.customer_name,
      input.customer_company,
      input.benchmark,
      input.grade,
      input.form,
      input.quantity_mt,
      pricing.base_price_cents,
      pricing.grade_adj_cents,
      pricing.form_adj_cents,
      pricing.freight_cents,
      pricing.volume_discount_cents,
      pricing.total_cents,
      input.notes ?? "",
    ]
  );

  const result = db.exec("SELECT * FROM quotes WHERE id = last_insert_rowid()");
  saveDatabase();
  return rowToQuote(result[0]!.columns, result[0]!.values[0]!);
}

export async function getQuote(id: number): Promise<Quote | null> {
  const db = await getDatabase();
  const result = db.exec("SELECT * FROM quotes WHERE id = ?", [id]);
  if (!result[0] || result[0].values.length === 0) return null;
  return rowToQuote(result[0].columns, result[0].values[0]!);
}

export async function listQuotes(params: {
  status?: string;
  customer_id?: number;
}): Promise<Quote[]> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const args: unknown[] = [];

  if (params.status) {
    conditions.push("status = ?");
    args.push(params.status);
  }
  if (params.customer_id) {
    conditions.push("customer_id = ?");
    args.push(params.customer_id);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = db.exec(
    `SELECT * FROM quotes ${where} ORDER BY created_at DESC LIMIT 100`,
    args
  );
  if (!result[0]) return [];
  return result[0].values.map((row: unknown[]) => rowToQuote(result[0]!.columns, row));
}

export async function getQuotesByCustomer(customerId: number): Promise<Quote[]> {
  const db = await getDatabase();
  const result = db.exec(
    "SELECT * FROM quotes WHERE customer_id = ? ORDER BY created_at DESC",
    [customerId]
  );
  if (!result[0]) return [];
  return result[0].values.map((row: unknown[]) => rowToQuote(result[0]!.columns, row));
}

export async function updateQuoteStatus(
  id: number,
  status: "draft" | "sent" | "accepted" | "expired"
): Promise<Quote | null> {
  const db = await getDatabase();
  db.run(
    "UPDATE quotes SET status = ?, updated_at = datetime('now') WHERE id = ?",
    [status, id]
  );
  const result = db.exec("SELECT * FROM quotes WHERE id = ?", [id]);
  if (!result[0] || result[0].values.length === 0) return null;
  saveDatabase();
  return rowToQuote(result[0].columns, result[0].values[0]!);
}

export async function deleteQuote(id: number): Promise<boolean> {
  const db = await getDatabase();
  const before = db.exec("SELECT id FROM quotes WHERE id = ?", [id]);
  if (!before[0] || before[0].values.length === 0) return false;
  db.run("DELETE FROM quotes WHERE id = ?", [id]);
  saveDatabase();
  return true;
}
