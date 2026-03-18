import { PDFParse } from "pdf-parse";
import { getDatabase, saveDatabase } from "../db";
import { parseAcuityPdf, type AcuityReport } from "./acuity-parser";

export type ImportResult = {
  report_date: string;
  sulphur_prices: number;
  sulphuric_acid_prices: number;
  freight_rates: number;
  related_markets: number;
  exchange_rates: number;
  total_records: number;
};

export async function importAcuityPdf(
  buffer: Buffer,
  filename: string
): Promise<ImportResult> {
  const parser = new PDFParse(new Uint8Array(buffer));
  const pdfResult = await parser.getText();
  const text = (pdfResult as unknown as { text: string }).text;
  const report = parseAcuityPdf(text);

  const db = await getDatabase();

  // Check for duplicate import
  const existing = db.exec(
    "SELECT id FROM acuity_imports WHERE report_date = ?",
    [report.report_date]
  );
  if (existing[0] && existing[0].values.length > 0) {
    // Delete old data for this report date and re-import
    db.run("DELETE FROM sulfur_prices WHERE report_date = ?", [report.report_date]);
    db.run("DELETE FROM freight_rates WHERE report_date = ?", [report.report_date]);
    db.run("DELETE FROM related_markets WHERE report_date = ?", [report.report_date]);
    db.run("DELETE FROM exchange_rates WHERE report_date = ?", [report.report_date]);
    db.run("DELETE FROM acuity_imports WHERE report_date = ?", [report.report_date]);
  }

  const result: ImportResult = {
    report_date: report.report_date,
    sulphur_prices: 0,
    sulphuric_acid_prices: 0,
    freight_rates: 0,
    related_markets: 0,
    exchange_rates: 0,
    total_records: 0,
  };

  // Insert sulphur prices
  const priceStmt = db.prepare(
    `INSERT INTO sulfur_prices (benchmark, price_low_cents, price_high_cents, price_type, delivery_term, recorded_at, source, report_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const p of report.sulphur_prices) {
    priceStmt.run([
      p.benchmark, p.current_low_cents, p.current_high_cents,
      p.price_type, p.delivery_term, report.report_date, "acuity", report.report_date,
    ]);
    result.sulphur_prices++;
  }

  for (const p of report.sulphuric_acid_prices) {
    priceStmt.run([
      p.benchmark, p.current_low_cents, p.current_high_cents,
      p.price_type, p.delivery_term, report.report_date, "acuity", report.report_date,
    ]);
    result.sulphuric_acid_prices++;
  }

  priceStmt.free();

  // Insert freight rates
  const freightStmt = db.prepare(
    `INSERT INTO freight_rates (route, vessel_size, rate_low_cents, rate_high_cents, recorded_at, source, report_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const f of report.freight_rates) {
    freightStmt.run([
      f.route, f.vessel_size, f.current_low_cents, f.current_high_cents,
      report.report_date, "acuity", report.report_date,
    ]);
    result.freight_rates++;
  }

  freightStmt.free();

  // Insert related markets
  const marketStmt = db.prepare(
    `INSERT INTO related_markets (market, unit, value_low, value_high, recorded_at, source, report_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const m of report.related_markets) {
    marketStmt.run([
      m.market, m.unit, m.current_low, m.current_high,
      report.report_date, "acuity", report.report_date,
    ]);
    result.related_markets++;
  }

  marketStmt.free();

  // Insert exchange rates
  const fxStmt = db.prepare(
    `INSERT INTO exchange_rates (currency, rate, recorded_at, source, report_date)
     VALUES (?, ?, ?, ?, ?)`
  );

  for (const e of report.exchange_rates) {
    fxStmt.run([e.currency, e.current, report.report_date, "acuity", report.report_date]);
    result.exchange_rates++;
  }

  fxStmt.free();

  result.total_records =
    result.sulphur_prices +
    result.sulphuric_acid_prices +
    result.freight_rates +
    result.related_markets +
    result.exchange_rates;

  // Record the import
  db.run(
    "INSERT INTO acuity_imports (filename, report_date, record_count) VALUES (?, ?, ?)",
    [filename, report.report_date, result.total_records]
  );

  saveDatabase();

  return result;
}

export async function getImportHistory(): Promise<Array<{
  id: number;
  filename: string;
  report_date: string;
  imported_at: string;
  record_count: number;
}>> {
  const db = await getDatabase();
  const result = db.exec("SELECT * FROM acuity_imports ORDER BY imported_at DESC LIMIT 50");
  if (!result[0]) return [];
  return result[0].values.map((row: unknown[]) => {
    const obj: Record<string, unknown> = {};
    result[0]!.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj as { id: number; filename: string; report_date: string; imported_at: string; record_count: number };
  });
}
