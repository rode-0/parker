import type { Quote, CreateQuoteInput } from "../types";
import { getDatabase, saveDatabase } from "../db";
import { calculateQuotePrice } from "./pricing";

function rowToQuote(columns: string[], values: unknown[]): Quote {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => { obj[col] = values[i]; });
  return obj as unknown as Quote;
}

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
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
      customer_name, customer_company, benchmark, grade, form,
      quantity_mt, base_price_cents, grade_adj_cents, form_adj_cents,
      freight_cents, volume_discount_cents, total_cents, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
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

export async function listQuotes(status?: string): Promise<Quote[]> {
  const db = await getDatabase();
  const query = status
    ? "SELECT * FROM quotes WHERE status = ? ORDER BY created_at DESC LIMIT 100"
    : "SELECT * FROM quotes ORDER BY created_at DESC LIMIT 100";
  const params = status ? [status] : [];
  const result = db.exec(query, params);
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
