import type { Database } from "sql.js";

export function initializeDatabase(db: Database): void {
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS sulfur_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      benchmark TEXT NOT NULL,
      price_low_cents INTEGER NOT NULL,
      price_high_cents INTEGER NOT NULL,
      price_type TEXT NOT NULL DEFAULT 'N',
      delivery_term TEXT NOT NULL DEFAULT '',
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      source TEXT NOT NULL DEFAULT 'manual',
      report_date TEXT
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_prices_benchmark_date
      ON sulfur_prices(benchmark, recorded_at DESC)
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS freight_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route TEXT NOT NULL,
      vessel_size TEXT NOT NULL DEFAULT '',
      rate_low_cents INTEGER NOT NULL,
      rate_high_cents INTEGER NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      source TEXT NOT NULL DEFAULT 'manual',
      report_date TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS related_markets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      market TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT '$/t',
      value_low REAL NOT NULL,
      value_high REAL NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      source TEXT NOT NULL DEFAULT 'manual',
      report_date TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency TEXT NOT NULL,
      rate REAL NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      source TEXT NOT NULL DEFAULT 'manual',
      report_date TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS acuity_imports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      report_date TEXT NOT NULL,
      imported_at TEXT NOT NULL DEFAULT (datetime('now')),
      record_count INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_company TEXT NOT NULL,
      benchmark TEXT NOT NULL,
      grade TEXT NOT NULL CHECK(grade IN ('bright_yellow', 'dark', 'recovered')),
      form TEXT NOT NULL CHECK(form IN ('molten', 'prills', 'granular', 'blocks')),
      quantity_mt REAL NOT NULL CHECK(quantity_mt > 0),
      base_price_cents INTEGER NOT NULL,
      grade_adj_cents INTEGER NOT NULL DEFAULT 0,
      form_adj_cents INTEGER NOT NULL DEFAULT 0,
      freight_cents INTEGER NOT NULL DEFAULT 0,
      volume_discount_cents INTEGER NOT NULL DEFAULT 0,
      total_cents INTEGER NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'accepted', 'expired')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run("CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status)");
  db.run("CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_company)");
}

export function seedPrices(db: Database): void {
  const result = db.exec("SELECT COUNT(*) as cnt FROM sulfur_prices");
  const count = result[0]?.values[0]?.[0] as number;
  if (count > 0) return;

  const stmt = db.prepare(
    "INSERT INTO sulfur_prices (benchmark, price_low_cents, price_high_cents, price_type, delivery_term, recorded_at, source) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  const benchmarks = [
    { name: "vancouver_fob", base: 50000, term: "FOB" },
    { name: "us_gulf_coast_fob", base: 49700, term: "FOB" },
    { name: "tampa_contract_del", base: 49569, term: "DEL" },
  ];

  for (const bm of benchmarks) {
    for (let i = 90; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const drift = Math.round((Math.random() - 0.48) * 500);
      const price = bm.base + drift * Math.round((90 - i) / 15);
      const spread = bm.name === "tampa_contract_del" ? 0 : 500;
      stmt.run([
        bm.name, price, price + spread, "N", bm.term,
        date.toISOString().slice(0, 19).replace("T", " "), "seed",
      ]);
    }
  }

  stmt.free();
}
