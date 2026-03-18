import type { Database } from "sql.js";

export function initializeDatabase(db: Database): void {
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS sulfur_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      benchmark TEXT NOT NULL CHECK(benchmark IN ('tampa_cfr', 'vancouver_fob', 'middle_east_fob', 'china_cfr')),
      price_cents INTEGER NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      source TEXT NOT NULL DEFAULT 'manual'
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_prices_benchmark_date
      ON sulfur_prices(benchmark, recorded_at DESC)
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_company TEXT NOT NULL,
      benchmark TEXT NOT NULL CHECK(benchmark IN ('tampa_cfr', 'vancouver_fob', 'middle_east_fob', 'china_cfr')),
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
    "INSERT INTO sulfur_prices (benchmark, price_cents, recorded_at, source) VALUES (?, ?, ?, ?)"
  );

  const benchmarks = [
    { name: "tampa_cfr", base: 15500 },
    { name: "vancouver_fob", base: 14200 },
    { name: "middle_east_fob", base: 13800 },
    { name: "china_cfr", base: 16100 },
  ];

  for (const bm of benchmarks) {
    for (let i = 90; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const drift = Math.round((Math.random() - 0.48) * 300);
      const price = bm.base + drift * Math.round((90 - i) / 10);
      stmt.run([bm.name, price, date.toISOString().slice(0, 19).replace("T", " "), "seed"]);
    }
  }

  stmt.free();
}
