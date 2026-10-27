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

  // Seed default phone device and simulator if empty
  const devCount = await getQuery(`SELECT COUNT(*) as count FROM devices`);
  if (devCount.count === 0) {
    await runQuery(`
      INSERT INTO devices (device_id, device_name, device_ip, device_secret, auth_token, status, last_sync, total_messages, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?, datetime('now', 'localtime'))
    `, ['dev_default_phone', 'هاتف الاستقبال (Android)', '192.168.1.20:5500', 'token_sec_amn_9988_device_secret_2026', 'token_sec_amn_9988', 'CONNECTED', 24]);

    await runQuery(`
      INSERT INTO devices (device_id, device_name, device_ip, device_secret, auth_token, status, last_sync, total_messages, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?, datetime('now', 'localtime'))
    `, ['sms_simulator_phone', 'محاكي الاختبار المدمج', '127.0.0.1:5500', 'sim_secret_amn_internal_2026', 'sim_token_local', 'CONNECTED', 0]);
  }

  // Seed sample transactions if empty
  const txCount = await getQuery(`SELECT COUNT(*) as count FROM transactions`);
  if (txCount.count === 0) {
    const samples = [
      {
        event_id: 'ev_001',
        type: 'INCOMING',
        amount: 200000,
        fee: 10000,
        cost: 2000,
        profit: 8000,
        phone: '01012345678',
        ref: 'TRX-948301',
        time: '2026-10-26 14:32:00'
      },
      {
        event_id: 'ev_002',
        type: 'INCOMING',
        amount: 100000,
        fee: 5000,
        cost: 1000,
        profit: 4000,
        phone: '01198765432',
        ref: 'TRX-948270',
        time: '2026-10-26 12:10:00'
      },
      {
        event_id: 'ev_003',
        type: 'WITHDRAWAL',
        amount: 500000,
        fee: 0,
        cost: 0,
        profit: 0,
        phone: '01055566777',
        ref: 'ATM-118492',
        time: '2026-10-26 10:03:00'
      },
      {
        event_id: 'ev_004',
        type: 'INCOMING',
        amount: 300000,
        fee: 15000,
        cost: 3000,
        profit: 12000,
        phone: '01033445566',
        ref: 'TRX-947812',
        time: '2026-10-26 09:15:00'
      },
      {
        event_id: 'ev_005',
        type: 'INCOMING',
        amount: 400000,
        fee: 20000,
        cost: 4000,
        profit: 16000,
        phone: '01234567890',
        ref: 'TRX-946520',
        time: '2026-10-25 16:45:00'
      },
      {
        event_id: 'ev_006',
        type: 'WITHDRAWAL',
        amount: 6600000,
        fee: 0,
        cost: 0,
        profit: 0,
        phone: 'سحب نقدي من ماكينة ATM',
        ref: 'ATM-942100',
        time: '2026-10-25 11:20:00'
      },
      {
        event_id: 'ev_007',
        type: 'INCOMING',
        amount: 7520000,
        fee: 300000,
        cost: 60000,
        profit: 240000,
        phone: 'تحويلات مجمعة لفترة الأسبوع',
        ref: 'TRX-BATCH-01',
        time: '2026-10-24 18:00:00'
      }
    ];

    for (const s of samples) {
      await runQuery(`
        INSERT INTO transactions (
          event_id, device_id, type, amount_piasters, fee_piasters, cost_piasters, profit_piasters,
          sender_or_recipient, reference_number, raw_sms, status, source, timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', 'SMS', ?, ?)
      `, [
        s.event_id,
        'dev_default_phone',
        s.type,
        s.amount,
        s.fee,
        s.cost,
        s.profit,
        s.phone,
        s.ref,
        `رسالة فودافون كاش مسجلة للعملية ${s.ref} بمبلغ ${s.amount / 100} جنيه`,
        s.time,
        s.time
      ]);
    }
  }

  console.log('✓ SQLite database initialized successfully at:', dbPath);
}
