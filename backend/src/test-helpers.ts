import initSqlJs from "sql.js";
import { initializeDatabase, seedPrices } from "./db/schema";

// Override the DB module for tests — use fresh in-memory DB each time
let testDb: import("sql.js").Database | null = null;

export async function resetDatabase(): Promise<void> {
  if (testDb) {
    testDb.close();
  }
  const SQL = await initSqlJs();
  testDb = new SQL.Database();
  initializeDatabase(testDb);

  // Monkey-patch the db module to return our test DB
  const dbModule = await import("./db");
  (dbModule as unknown as { _setTestDb: (db: import("sql.js").Database) => void })._setTestDb(testDb);
}

export function getTestDb(): import("sql.js").Database {
  if (!testDb) throw new Error("Call resetDatabase() before using getTestDb()");
  return testDb;
}

export async function createTestCustomer(overrides: Record<string, unknown> = {}): Promise<{ id: number }> {
  const { createCustomer } = await import("./services/customers");
  const customer = await createCustomer({
    company_name: (overrides.company_name as string) || "Test Corp",
    contact_name: (overrides.contact_name as string) || "Jane Doe",
    email: (overrides.email as string) || "jane@test.com",
    phone: (overrides.phone as string) || "555-0100",
    address: (overrides.address as string) || "123 Test St",
    city: (overrides.city as string) || "Houston",
    state: (overrides.state as string) || "TX",
    zip: (overrides.zip as string) || "77001",
    country: (overrides.country as string) || "US",
    customer_type: (overrides.customer_type as "refinery") || "refinery",
    priority: (overrides.priority as "high") || "high",
    annual_volume_mt: (overrides.annual_volume_mt as number) || 10000,
    ...overrides,
  });
  return customer;
}

export async function createTestPrice(
  benchmark: string = "vancouver_fob",
  lowCents: number = 50000,
  highCents: number = 50500
): Promise<void> {
  const { getDatabase } = await import("./db");
  const db = await getDatabase();
  db.run(
    "INSERT INTO sulfur_prices (benchmark, price_low_cents, price_high_cents, price_type, delivery_term, source) VALUES (?, ?, ?, ?, ?, ?)",
    [benchmark, lowCents, highCents, "N", "FOB", "test"]
  );
}

export async function createTestQuote(overrides: Record<string, unknown> = {}): Promise<{ id: number }> {
  await createTestPrice();
  const { createQuote } = await import("./services/quotes");
  return createQuote({
    customer_name: (overrides.customer_name as string) || "Jane Doe",
    customer_company: (overrides.customer_company as string) || "Test Corp",
    benchmark: (overrides.benchmark as string) || "vancouver_fob",
    grade: (overrides.grade as "bright_yellow") || "bright_yellow",
    form: (overrides.form as "prills") || "prills",
    quantity_mt: (overrides.quantity_mt as number) || 500,
    freight_cents: (overrides.freight_cents as number) || 1000,
    ...overrides,
  });
}
