import { getDatabase, saveDatabase } from "../db";

export type Activity = {
  id: number;
  customer_id: number;
  type: "visit" | "call" | "email" | "note";
  date: string;
  duration_minutes: number | null;
  notes: string;
  created_at: string;
};

export type CreateActivityInput = {
  customer_id: number;
  type: "visit" | "call" | "email" | "note";
  date: string;
  duration_minutes?: number;
  notes?: string;
};

function rowToActivity(columns: string[], values: unknown[]): Activity {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => { obj[col] = values[i]; });
  return obj as unknown as Activity;
}

export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const db = await getDatabase();

  db.run(
    `INSERT INTO activities (customer_id, type, date, duration_minutes, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [input.customer_id, input.type, input.date, input.duration_minutes ?? null, input.notes ?? ""]
  );

  const result = db.exec("SELECT * FROM activities WHERE id = last_insert_rowid()");

  // Update last_visit on customer if this is a visit
  if (input.type === "visit") {
    db.run(
      "UPDATE customers SET last_visit = ?, updated_at = datetime('now') WHERE id = ? AND (last_visit IS NULL OR last_visit < ?)",
      [input.date, input.customer_id, input.date]
    );
  }

  saveDatabase();
  return rowToActivity(result[0]!.columns, result[0]!.values[0]!);
}

export async function getActivitiesByCustomer(customerId: number): Promise<Activity[]> {
  const db = await getDatabase();
  const result = db.exec(
    "SELECT * FROM activities WHERE customer_id = ? ORDER BY date DESC, created_at DESC LIMIT 100",
    [customerId]
  );
  if (!result[0]) return [];
  return result[0].values.map((row: unknown[]) => rowToActivity(result[0]!.columns, row));
}

export async function deleteActivity(id: number): Promise<boolean> {
  const db = await getDatabase();
  const before = db.exec("SELECT id FROM activities WHERE id = ?", [id]);
  if (!before[0] || before[0].values.length === 0) return false;
  db.run("DELETE FROM activities WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

export async function getCustomersNeedingAttention(limit: number = 20): Promise<Array<{
  id: number;
  company_name: string;
  city: string;
  state: string;
  priority: string;
  last_visit: string | null;
  days_since_visit: number | null;
}>> {
  const db = await getDatabase();
  const result = db.exec(
    `SELECT id, company_name, city, state, priority, last_visit,
       CASE WHEN last_visit IS NOT NULL
         THEN CAST(julianday('now') - julianday(last_visit) AS INTEGER)
         ELSE NULL
       END as days_since_visit
     FROM customers
     ORDER BY
       CASE WHEN last_visit IS NULL THEN 0 ELSE 1 END,
       last_visit ASC
     LIMIT ?`,
    [limit]
  );
  if (!result[0]) return [];
  return result[0].values.map((row: unknown[]) => {
    const obj: Record<string, unknown> = {};
    result[0]!.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj as { id: number; company_name: string; city: string; state: string; priority: string; last_visit: string | null; days_since_visit: number | null };
  });
}
