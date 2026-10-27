import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure writable path in production (AppData) or local project folder in development
const isProd = process.env.NODE_ENV === 'production' || process.env.IS_PACKAGED === 'true';
const dataDir = process.env.AMN_DATA_DIR || 
  (isProd && process.env.APPDATA 
    ? path.join(process.env.APPDATA, 'AMN Cash', 'data') 
    : path.resolve(__dirname, '../data'));

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'amn_cash.sqlite');
export const db = new sqlite3.Database(dbPath, (err) => {
  if (!err) {
    db.run("PRAGMA journal_mode = WAL;");
    db.run("PRAGMA synchronous = NORMAL;");
  }
});

export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export async function initDatabase() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE,
      device_name TEXT NOT NULL,
      device_ip TEXT,
      device_secret TEXT NOT NULL DEFAULT '',
      auth_token TEXT,
      status TEXT DEFAULT 'CONNECTED',
      last_sync TEXT,
      total_messages INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  // Migration for existing databases
  try {
    await runQuery(`ALTER TABLE devices ADD COLUMN device_secret TEXT DEFAULT ''`);
  } catch {
    // Column already exists
  }

  await runQuery(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT UNIQUE,
      device_id TEXT,
      type TEXT NOT NULL,
      amount_piasters INTEGER NOT NULL,
      fee_piasters INTEGER NOT NULL DEFAULT 0,
      cost_piasters INTEGER NOT NULL DEFAULT 0,
      profit_piasters INTEGER NOT NULL DEFAULT 0,
      sender_or_recipient TEXT,
      reference_number TEXT,
      current_balance_piasters INTEGER DEFAULT 0,
      raw_sms TEXT,
      status TEXT DEFAULT 'OBSERVED',
      source TEXT DEFAULT 'SMS',
      timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Default settings
  const defaults = [
    ['fee_per_1000', '50'],
    ['cost_per_1000', '10'],
    ['profit_per_1000', '40'],
    ['wallet_name', 'محفظة فودافون كاش - AMN'],
    ['wallet_phone', '01012345678'],
    ['auto_calc_fees_for_incoming', 'false'],
    ['theme', 'light']
  ];

  for (const [k, v] of defaults) {
    await runQuery(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, [k, v]);
  }

  // Production Mode: Initialize settings and schema cleanly without injecting any fake/mock data
  await runQuery(`INSERT OR REPLACE INTO settings (key, value) VALUES ('initial_seed_done', 'true')`);

  console.log('✓ SQLite database initialized successfully at:', dbPath);
}

// Helper: Wipe all transactions for fresh production start
export async function wipeAllTransactions() {
  await runQuery(`DELETE FROM transactions`);
  try {
    await runQuery(`DELETE FROM sqlite_sequence WHERE name = 'transactions'`);
  } catch {}
  await runQuery(`INSERT OR REPLACE INTO settings (key, value) VALUES ('initial_seed_done', 'true')`);
}

// Helper: Clear mock/sample transactions only
export async function clearMockTransactions() {
  await runQuery(`DELETE FROM transactions WHERE event_id LIKE 'ev_%' OR source = 'SIMULATOR'`);
  await runQuery(`INSERT OR REPLACE INTO settings (key, value) VALUES ('initial_seed_done', 'true')`);
}

// Helper: Clean offline or pending unverified devices
export async function cleanOfflineDevices() {
  await runQuery(`DELETE FROM devices WHERE status = 'PENDING_PAIR' OR status = 'DISCONNECTED' OR device_id = 'dev_mobile_companion'`);
}
