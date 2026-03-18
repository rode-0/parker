import type { Customer, CreateCustomerInput } from "../types/customer";
import { getDatabase, saveDatabase } from "../db";
import { customerLogger } from "../lib/logger";

function rowToCustomer(columns: string[], values: unknown[]): Customer {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => { obj[col] = values[i]; });
  return obj as unknown as Customer;
}

export async function listCustomers(params: {
  search?: string;
  state?: string;
  customer_type?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}): Promise<Customer[]> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const args: unknown[] = [];

  if (params.search) {
    conditions.push("(company_name LIKE ? OR contact_name LIKE ? OR city LIKE ?)");
    const term = `%${params.search}%`;
    args.push(term, term, term);
  }
  if (params.state) {
    conditions.push("state = ?");
    args.push(params.state);
  }
  if (params.customer_type) {
    conditions.push("customer_type = ?");
    args.push(params.customer_type);
  }
  if (params.priority) {
    conditions.push("priority = ?");
    args.push(params.priority);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit || 200;
  const offset = params.offset || 0;

  const result = db.exec(
    `SELECT * FROM customers ${where} ORDER BY company_name ASC LIMIT ? OFFSET ?`,
    [...args, limit, offset]
  );
  if (!result[0]) return [];
  return result[0].values.map((row: unknown[]) => rowToCustomer(result[0]!.columns, row));
}

export async function getCustomer(id: number): Promise<Customer | null> {
  const db = await getDatabase();
  const result = db.exec("SELECT * FROM customers WHERE id = ?", [id]);
  if (!result[0] || result[0].values.length === 0) return null;
  return rowToCustomer(result[0].columns, result[0].values[0]!);
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  customerLogger.info({ company: input.company_name, city: input.city, state: input.state }, "Creating customer");
  const db = await getDatabase();
  db.run(
    `INSERT INTO customers (company_name, contact_name, email, phone, address, city, state, zip, country,
      customer_type, annual_volume_mt, last_visit, priority, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.company_name,
      input.contact_name ?? "",
      input.email ?? "",
      input.phone ?? "",
      input.address,
      input.city,
      input.state,
      input.zip ?? "",
      input.country ?? "US",
      input.customer_type ?? "other",
      input.annual_volume_mt ?? null,
      input.last_visit ?? null,
      input.priority ?? "medium",
      input.notes ?? "",
    ]
  );
  const result = db.exec("SELECT * FROM customers WHERE id = last_insert_rowid()");
  saveDatabase();
  return rowToCustomer(result[0]!.columns, result[0]!.values[0]!);
}

export async function updateCustomer(
  id: number,
  input: Partial<CreateCustomerInput>
): Promise<Customer | null> {
  const existing = await getCustomer(id);
  if (!existing) return null;

  const db = await getDatabase();
  db.run(
    `UPDATE customers SET
      company_name = ?, contact_name = ?, email = ?, phone = ?,
      address = ?, city = ?, state = ?, zip = ?, country = ?,
      customer_type = ?, annual_volume_mt = ?, last_visit = ?,
      priority = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [
      input.company_name ?? existing.company_name,
      input.contact_name ?? existing.contact_name,
      input.email ?? existing.email,
      input.phone ?? existing.phone,
      input.address ?? existing.address,
      input.city ?? existing.city,
      input.state ?? existing.state,
      input.zip ?? existing.zip,
      input.country ?? existing.country,
      input.customer_type ?? existing.customer_type,
      input.annual_volume_mt ?? existing.annual_volume_mt,
      input.last_visit ?? existing.last_visit,
      input.priority ?? existing.priority,
      input.notes ?? existing.notes,
      id,
    ]
  );
  saveDatabase();
  return getCustomer(id);
}

export async function deleteCustomer(id: number): Promise<boolean> {
  const db = await getDatabase();
  const before = db.exec("SELECT id FROM customers WHERE id = ?", [id]);
  if (!before[0] || before[0].values.length === 0) return false;
  db.run("DELETE FROM customers WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

export async function getCustomersForMap(filters?: {
  customer_type?: string;
  priority?: string;
}): Promise<Customer[]> {
  const db = await getDatabase();
  const conditions = ["latitude IS NOT NULL", "longitude IS NOT NULL"];
  const args: unknown[] = [];

  if (filters?.customer_type) {
    conditions.push("customer_type = ?");
    args.push(filters.customer_type);
  }
  if (filters?.priority) {
    conditions.push("priority = ?");
    args.push(filters.priority);
  }

  const result = db.exec(
    `SELECT * FROM customers WHERE ${conditions.join(" AND ")} ORDER BY company_name ASC`,
    args
  );
  if (!result[0]) return [];
  return result[0].values.map((row: unknown[]) => rowToCustomer(result[0]!.columns, row));
}

export async function updateCustomerCoords(
  id: number,
  latitude: number,
  longitude: number
): Promise<void> {
  const db = await getDatabase();
  db.run("UPDATE customers SET latitude = ?, longitude = ?, updated_at = datetime('now') WHERE id = ?",
    [latitude, longitude, id]);
  saveDatabase();
}
