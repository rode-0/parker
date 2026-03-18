import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";
import { initializeDatabase, seedPrices } from "./schema";

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../data/parker.db");

let db: Database | null = null;
let initPromise: Promise<Database> | null = null;

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function getDatabase(): Promise<Database> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs();
    ensureDir(DB_PATH);

    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    initializeDatabase(db);
    seedPrices(db);
    saveDatabase();
    return db;
  })();

  return initPromise;
}

export function saveDatabase(): void {
  if (!db) return;
  ensureDir(DB_PATH);
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    initPromise = null;
  }
}
