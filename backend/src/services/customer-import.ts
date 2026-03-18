import * as XLSX from "xlsx";
import type { CreateCustomerInput, ColumnMapping, CustomerImportResult, ImportPreview } from "../types/customer";
import { getDatabase, saveDatabase } from "../db";
import { geocodeAddress } from "./geocoder";

const COLUMN_ALIASES: Record<string, string[]> = {
  company_name: ["company", "company name", "company_name", "organization", "org", "customer", "account"],
  contact_name: ["contact", "contact name", "contact_name", "name", "rep", "contact person", "poc"],
  email: ["email", "e-mail", "email address", "e mail"],
  phone: ["phone", "telephone", "tel", "phone number", "mobile", "cell"],
  address: ["address", "street", "street address", "address1", "address_1", "addr"],
  city: ["city", "town"],
  state: ["state", "province", "state/province", "st", "region"],
  zip: ["zip", "postal", "postal code", "zip code", "zipcode", "zip_code"],
  country: ["country", "nation", "country code"],
  customer_type: ["type", "customer type", "customer_type", "category", "industry", "segment"],
  annual_volume_mt: ["volume", "annual volume", "annual_volume", "volume_mt", "annual_volume_mt", "tons", "tonnage"],
  last_visit: ["last visit", "last_visit", "visited", "last contact", "last_contact"],
  priority: ["priority", "tier", "importance", "rank"],
  notes: ["notes", "comments", "memo", "description", "remarks"],
};

function detectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = lowerHeaders.indexOf(alias);
      if (idx >= 0) {
        mapping[field] = headers[idx]!;
        break;
      }
    }
  }

  return mapping;
}

function parseFile(buffer: Buffer, filename: string): { headers: string[]; rows: unknown[][] } {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("No sheets found in file");

  const sheet = wb.Sheets[sheetName]!;
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
  if (raw.length < 2) throw new Error("File must have at least a header row and one data row");

  const headers = (raw[0] as unknown[]).map((h) => String(h ?? "").trim());
  const rows = raw.slice(1).filter((row) => row.some((cell) => cell != null && cell !== ""));

  return { headers, rows };
}

export function previewImport(buffer: Buffer, filename: string): ImportPreview {
  const { headers, rows } = parseFile(buffer, filename);
  const suggestedMapping = detectMapping(headers);

  return {
    headers,
    suggested_mapping: suggestedMapping,
    preview_rows: rows.slice(0, 5),
    total_rows: rows.length,
  };
}

function getVal(row: unknown[], headers: string[], mapping: ColumnMapping, field: string): string {
  const col = mapping[field];
  if (!col) return "";
  const idx = headers.indexOf(col);
  if (idx < 0) return "";
  const val = row[idx];
  return val != null ? String(val).trim() : "";
}

function getNum(row: unknown[], headers: string[], mapping: ColumnMapping, field: string): number | null {
  const s = getVal(row, headers, mapping, field);
  if (!s) return null;
  const n = parseFloat(s.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

const VALID_TYPES = ["refinery", "fertilizer", "chemical", "mining", "other"];
const VALID_PRIORITIES = ["high", "medium", "low"];

export async function importCustomers(
  buffer: Buffer,
  filename: string,
  mapping: ColumnMapping
): Promise<CustomerImportResult> {
  const { headers, rows } = parseFile(buffer, filename);

  const result: CustomerImportResult = {
    total_rows: rows.length,
    imported: 0,
    skipped: 0,
    geocoded: 0,
    geocode_failed: 0,
    errors: [],
  };

  const db = await getDatabase();
  const stmt = db.prepare(
    `INSERT INTO customers (company_name, contact_name, email, phone, address, city, state, zip, country,
      customer_type, annual_volume_mt, last_visit, priority, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertedIds: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const companyName = getVal(row, headers, mapping, "company_name");
    const address = getVal(row, headers, mapping, "address");
    const city = getVal(row, headers, mapping, "city");
    const state = getVal(row, headers, mapping, "state");

    if (!companyName || !address || !city || !state) {
      result.skipped++;
      result.errors.push(`Row ${i + 2}: missing required field (company_name, address, city, or state)`);
      continue;
    }

    const rawType = getVal(row, headers, mapping, "customer_type").toLowerCase();
    const customerType = VALID_TYPES.includes(rawType) ? rawType : "other";
    const rawPriority = getVal(row, headers, mapping, "priority").toLowerCase();
    const priority = VALID_PRIORITIES.includes(rawPriority) ? rawPriority : "medium";

    stmt.run([
      companyName,
      getVal(row, headers, mapping, "contact_name"),
      getVal(row, headers, mapping, "email"),
      getVal(row, headers, mapping, "phone"),
      address,
      city,
      state,
      getVal(row, headers, mapping, "zip"),
      getVal(row, headers, mapping, "country") || "US",
      customerType,
      getNum(row, headers, mapping, "annual_volume_mt"),
      getVal(row, headers, mapping, "last_visit") || null,
      priority,
      getVal(row, headers, mapping, "notes"),
    ]);

    const idResult = db.exec("SELECT last_insert_rowid() as id");
    const id = idResult[0]?.values[0]?.[0] as number;
    insertedIds.push(id);
    result.imported++;
  }

  stmt.free();
  saveDatabase();

  // Geocode inserted customers
  for (const id of insertedIds) {
    const custResult = db.exec("SELECT address, city, state, zip, country FROM customers WHERE id = ?", [id]);
    if (!custResult[0] || custResult[0].values.length === 0) continue;

    const vals = custResult[0].values[0]!;
    const geo = await geocodeAddress(
      String(vals[0] ?? ""),
      String(vals[1] ?? ""),
      String(vals[2] ?? ""),
      String(vals[3] ?? ""),
      String(vals[4] ?? "US")
    );

    if (geo) {
      db.run("UPDATE customers SET latitude = ?, longitude = ? WHERE id = ?",
        [geo.latitude, geo.longitude, id]);
      result.geocoded++;
    } else {
      result.geocode_failed++;
    }
  }

  saveDatabase();
  return result;
}
