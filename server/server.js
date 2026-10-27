import express from 'express';
import cors from 'cors';
import http from 'http';
import os from 'os';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { initDatabase, runQuery, getQuery, allQuery } from './db.js';
import { calculateFees } from './feeEngine.js';
import { parseVodafoneCashSms, isSensitiveMessage } from './smsParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Server-Sent Events (SSE) clients for real-time updates without external packages
let sseClients = [];

function broadcast(type, data) {
  const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

// SSE stream endpoint
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// Get Local Machine IP addresses for LAN Android connection
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses.length > 0 ? addresses[0] : '127.0.0.1';
}

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------

// 1. Dashboard Stats & KPIs
app.get('/api/stats', async (req, res) => {
  try {
    const { period } = req.query; // 'today', 'week', 'month', 'all'
    let timeCondition = '';
    
    if (period === 'today') {
      timeCondition = "WHERE date(timestamp) = date('now', 'localtime')";
    } else if (period === 'week') {
      timeCondition = "WHERE timestamp >= datetime('now', '-7 days', 'localtime')";
    } else if (period === 'month') {
      timeCondition = "WHERE timestamp >= datetime('now', '-30 days', 'localtime')";
    }

    const rows = await allQuery(`
      SELECT 
        type,
        SUM(amount_piasters) as sum_amount,
        SUM(fee_piasters) as sum_fee,
        SUM(cost_piasters) as sum_cost,
        SUM(profit_piasters) as sum_profit,
        COUNT(*) as count
      FROM transactions
      ${timeCondition}
      GROUP BY type
    `);

    let totalIncomingPiasters = 0;
    let totalWithdrawalsPiasters = 0;
    let totalFeesPiasters = 0;
    let totalCostPiasters = 0;
    let totalProfitPiasters = 0;
    let incomingCount = 0;
    let withdrawalCount = 0;
    let otherCount = 0;

    for (const r of rows) {
      if (r.type === 'INCOMING') {
        totalIncomingPiasters += r.sum_amount || 0;
        incomingCount += r.count;
      } else if (r.type === 'WITHDRAWAL') {
        totalWithdrawalsPiasters += r.sum_amount || 0;
        withdrawalCount += r.count;
      } else {
        otherCount += r.count;
      }
      totalFeesPiasters += r.sum_fee || 0;
      totalCostPiasters += r.sum_cost || 0;
      totalProfitPiasters += r.sum_profit || 0;
    }

    const totalCount = incomingCount + withdrawalCount + otherCount;

    res.json({
      success: true,
      data: {
        totalIncomingEGP: totalIncomingPiasters / 100,
        totalWithdrawalsEGP: totalWithdrawalsPiasters / 100,
        totalFeesEGP: totalFeesPiasters / 100,
        totalCostEGP: totalCostPiasters / 100,
        totalProfitEGP: totalProfitPiasters / 100,
        totalCount,
        incomingCount,
        withdrawalCount,
        otherCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Transactions List
app.get('/api/transactions', async (req, res) => {
  try {
    const { type, search, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];

    if (type && type !== 'ALL') {
      sql += ' AND type = ?';
      params.push(type);
    }

    if (search) {
      sql += ' AND (sender_or_recipient LIKE ? OR reference_number LIKE ? OR raw_sms LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const rows = await allQuery(sql, params);
    
    // Map to friendly view model
    const items = rows.map(r => {
      const amountEGP = r.amount_piasters / 100;
      const feeEGP = r.fee_piasters / 100;
      // 5% cashout fee rule: 50 EGP per 1000 EGP
      const estimatedFee = feeEGP > 0 ? feeEGP : Math.round((amountEGP * 50) / 1000);
      const beneficiaryPayoutEGP = r.type === 'INCOMING' ? Math.max(0, amountEGP - estimatedFee) : amountEGP;

      return {
        id: r.id,
        eventId: r.event_id,
        type: r.type,
        amountEGP,
        feeEGP,
        costEGP: r.cost_piasters / 100,
        profitEGP: r.profit_piasters / 100,
        beneficiaryPayoutEGP,
        senderOrRecipient: r.sender_or_recipient,
        referenceNumber: r.reference_number,
        status: r.status,
        timestamp: r.timestamp,
        rawSms: r.raw_sms,
        source: r.source
      };
    });

    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Settings Get / Update
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await allQuery('SELECT key, value FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await runQuery('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
    }
    broadcast('SETTINGS_UPDATED', req.body);
    res.json({ success: true, message: 'Settings saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Calculate Fee Preview (For Fee Calculator Tool)
app.post('/api/calculate-fee', async (req, res) => {
  try {
    const { amountEGP } = req.body;
    if (!amountEGP || amountEGP <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    const feePer1000Row = await getQuery("SELECT value FROM settings WHERE key='fee_per_1000'");
    const costPer1000Row = await getQuery("SELECT value FROM settings WHERE key='cost_per_1000'");

    const feePer1000 = feePer1000Row ? parseInt(feePer1000Row.value) : 50;
    const costPer1000 = costPer1000Row ? parseInt(costPer1000Row.value) : 10;

    const amountPiasters = Math.round(amountEGP * 100);
    const result = calculateFees(amountPiasters, {
      feePer1000Piasters: feePer1000 * 100,
      costPer1000Piasters: costPer1000 * 100
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Security: Cryptographic HMAC Signature Verification Middleware
// -----------------------------------------------------------------------------
export async function verifyDeviceSignature(req, res, next) {
  const deviceId = req.headers['x-device-id'] || req.body?.deviceId;
  const timestamp = req.headers['x-timestamp'];
  const nonce = req.headers['x-nonce'];
  const signature = req.headers['x-signature'];

  // Built-in simulator or localhost bypass for internal debugging
  if (deviceId === 'sms_simulator_phone' || deviceId === 'dev_simulator') {
    return next();
  }

  if (!deviceId || !timestamp || !nonce || !signature) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing security headers (x-device-id, x-timestamp, x-nonce, x-signature)'
    });
  }

  // Prevent Replay Attacks (5-minute window)
  if (Math.abs(Date.now() - parseInt(timestamp)) > 300000) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Request timestamp expired (> 5 min window)'
    });
  }

  try {
    const device = await getQuery('SELECT device_secret, auth_token FROM devices WHERE device_id = ?', [deviceId]);
    if (!device) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Unknown or revoked device' });
    }

    const secret = device.device_secret || device.auth_token;
    const rawBody = JSON.stringify(req.body);
    const computedSig = crypto
      .createHmac('sha256', secret)
      .update(req.method + req.path + timestamp + nonce + rawBody)
      .digest('hex');

    if (computedSig !== signature) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid cryptographic signature' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 5. Ingest SMS (From Android Collector or Simulator)
app.post('/api/sms/inbox', verifyDeviceSignature, async (req, res) => {
  try {
    const { smsText, deviceId = 'android_app', eventId = `ev_${Date.now()}` } = req.body;

    if (!smsText) {
      return res.status(400).json({ success: false, error: 'SMS text is required' });
    }

    // 1. Strict Privacy Check (OTP / PIN)
    if (isSensitiveMessage(smsText)) {
      return res.status(403).json({
        success: false,
        error: 'REJECTED: Sensitive OTP/PIN content detected. Message dropped permanently.'
      });
    }

    // 2. Parse SMS
    const parsed = parseVodafoneCashSms(smsText);
    if (!parsed.success) {
      return res.status(422).json({ success: false, error: 'Unrecognized SMS template' });
    }

    // 3. Check for duplicates (Idempotency)
    const existing = await getQuery(
      'SELECT id FROM transactions WHERE reference_number = ? OR event_id = ?',
      [parsed.referenceNumber, eventId]
    );

    if (existing) {
      return res.json({ success: true, duplicate: true, message: 'Transaction already recorded' });
    }

    // 4. Check Fee Auto-Calc Policy
    const autoCalcRow = await getQuery("SELECT value FROM settings WHERE key='auto_calc_fees_for_incoming'");
    const isAutoCalc = autoCalcRow && autoCalcRow.value === 'true';

    let feePiasters = 0;
    let costPiasters = 0;
    let profitPiasters = 0;
    let status = 'OBSERVED';

    // Apply fee calculation only if auto_calc_fees_for_incoming is enabled or transaction already verified
    if (parsed.type === 'INCOMING' && isAutoCalc) {
      const feeRow = await getQuery("SELECT value FROM settings WHERE key='fee_per_1000'");
      const costRow = await getQuery("SELECT value FROM settings WHERE key='cost_per_1000'");
      const feePer1000 = feeRow ? parseInt(feeRow.value) : 50;
      const costPer1000 = costRow ? parseInt(costRow.value) : 10;

      const calc = calculateFees(parsed.amountPiasters, {
        feePer1000Piasters: feePer1000 * 100,
        costPer1000Piasters: costPer1000 * 100
      });
      feePiasters = calc.feePiasters;
      costPiasters = calc.costPiasters;
      profitPiasters = calc.profitPiasters;
      status = 'VERIFIED';
    } else if (parsed.type === 'WITHDRAWAL' || parsed.type === 'OUTGOING') {
      status = 'COMPLETED';
    }

    // 5. Insert to DB
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const insertRes = await runQuery(`
      INSERT INTO transactions (
        event_id, device_id, type, amount_piasters, fee_piasters, cost_piasters, profit_piasters,
        sender_or_recipient, reference_number, current_balance_piasters, raw_sms, status, source, timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      eventId,
      deviceId,
      parsed.type,
      parsed.amountPiasters,
      feePiasters,
      costPiasters,
      profitPiasters,
      parsed.phone,
      parsed.referenceNumber,
      parsed.balancePiasters || 0,
      smsText,
      status,
      'SMS',
      now,
      now
    ]);

    // Update Device last sync & message counter
    await runQuery(`
      UPDATE devices 
      SET last_sync = datetime('now', 'localtime'), total_messages = total_messages + 1, status = 'CONNECTED'
      WHERE device_id = ?
    `, [deviceId]);

    const newTx = {
      id: insertRes.lastID,
      eventId,
      type: parsed.type,
      amountEGP: parsed.amountPiasters / 100,
      feeEGP: feePiasters / 100,
      costEGP: costPiasters / 100,
      profitEGP: profitPiasters / 100,
      senderOrRecipient: parsed.phone,
      referenceNumber: parsed.referenceNumber,
      status,
      timestamp: now,
      rawSms: smsText
    };

    // Realtime notification to all connected UIs
    broadcast('NEW_TRANSACTION', newTx);

    res.json({
      success: true,
      message: 'Transaction successfully processed and recorded',
      data: newTx
    });

  } catch (err) {
    console.error('Error processing SMS inbox:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5.b Verify & Confirm an Observed Transaction (Explicit Eligibility)
app.post('/api/transactions/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await getQuery('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    const feeRow = await getQuery("SELECT value FROM settings WHERE key='fee_per_1000'");
    const costRow = await getQuery("SELECT value FROM settings WHERE key='cost_per_1000'");
    const feePer1000 = feeRow ? parseInt(feeRow.value) : 50;
    const costPer1000 = costRow ? parseInt(costRow.value) : 10;

    const calc = calculateFees(tx.amount_piasters, {
      feePer1000Piasters: feePer1000 * 100,
      costPer1000Piasters: costPer1000 * 100
    });

    await runQuery(`
      UPDATE transactions 
      SET fee_piasters = ?, cost_piasters = ?, profit_piasters = ?, status = 'VERIFIED'
      WHERE id = ?
    `, [calc.feePiasters, calc.costPiasters, calc.profitPiasters, id]);

    const updated = await getQuery('SELECT * FROM transactions WHERE id = ?', [id]);
    broadcast('TRANSACTION_UPDATED', updated);

    res.json({ success: true, message: 'Transaction verified and fees calculated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5.c Mark Delivered / Cash Handed Over (Final Completed Stage)
app.post('/api/transactions/:id/deliver', async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await getQuery('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    await runQuery(`
      UPDATE transactions 
      SET status = 'COMPLETED'
      WHERE id = ?
    `, [id]);

    const updated = await getQuery('SELECT * FROM transactions WHERE id = ?', [id]);
    broadcast('TRANSACTION_UPDATED', updated);

    res.json({ success: true, message: 'تم تسليم المبلغ للعميل واكتمال المعاملة بنجاح', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function getApkFilePath() {
  const candidates = [
    path.resolve(__dirname, '../public/apk/AMN-Cash.apk'),
    path.resolve(__dirname, '../dist-android/app-debug.apk'),
    path.resolve(__dirname, '../../dist-android/app-debug.apk'),
    path.resolve(__dirname, '../dist/apk/AMN-Cash.apk'),
    path.join(process.resourcesPath || '', 'apk/AMN-Cash.apk'),
    path.join(process.resourcesPath || '', 'dist-android/app-debug.apk'),
    'G:\\amn cash\\resources\\apk\\AMN-Cash.apk'
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

// 6. Devices and Pairing QR Code
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await allQuery('SELECT * FROM devices ORDER BY last_sync DESC');
    const localIp = getLocalIpAddresses();
    res.json({
      success: true,
      data: {
        devices,
        serverHost: `${localIp}:5500`,
        status: 'LISTENING'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Interactive Mobile Portal for Phone Browsers via QR Code: Choose between Download or Pair
app.get(['/connect', '/download-app'], async (req, res) => {
  const localIp = getLocalIpAddresses();
  const serverUrl = `http://${localIp}:5500`;
  const deepLink = `amncash://pair?server=${encodeURIComponent(serverUrl)}`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بوابة هاتف فودافون كاش - AMN Cash</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", sans-serif; }
    body { background-color: #f3f5f8; color: #1e293b; padding: 16px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: white; max-width: 460px; width: 100%; border-radius: 28px; padding: 28px 20px; box-shadow: 0 20px 45px -15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; text-align: center; }
    .logo { width: 68px; height: 68px; background: #ca1535; border-radius: 20px; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 22px; box-shadow: 0 10px 20px rgba(202,21,53,0.22); }
    h1 { font-size: 19px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
    p.sub { font-size: 12px; color: #64748b; margin-bottom: 20px; line-height: 1.5; }
    
    .choice-container { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
    
    /* Option 1: Pair & Activate (If already installed) */
    .option-card-pair { background: #f0fdf4; border: 2px solid #86efac; border-radius: 22px; padding: 18px 16px; text-align: right; transition: all 0.2s; }
    .option-title-pair { font-size: 14px; font-weight: 900; color: #166534; display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .option-desc-pair { font-size: 11px; color: #15803d; line-height: 1.5; margin-bottom: 12px; }
    .btn-pair { display: block; width: 100%; background: #16a34a; color: white; text-decoration: none; padding: 13px; border-radius: 14px; font-weight: 800; font-size: 14px; text-align: center; box-shadow: 0 4px 12px rgba(22,163,74,0.25); border: none; cursor: pointer; }
    .btn-pair:active { transform: scale(0.98); }

    /* Option 2: Download APK (For new phones) */
    .option-card-download { background: #fef2f2; border: 2px solid #fecaca; border-radius: 22px; padding: 18px 16px; text-align: right; transition: all 0.2s; }
    .option-title-download { font-size: 14px; font-weight: 900; color: #991b1b; display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .option-desc-download { font-size: 11px; color: #b91c1c; line-height: 1.5; margin-bottom: 12px; }
    .btn-download { display: block; width: 100%; background: #ca1535; color: white; text-decoration: none; padding: 13px; border-radius: 14px; font-weight: 800; font-size: 14px; text-align: center; box-shadow: 0 4px 12px rgba(202,21,53,0.25); border: none; }
    .btn-download:active { transform: scale(0.98); }

    .net-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px; font-size: 11px; text-align: right; margin-bottom: 16px; }
    .net-row { display: flex; justify-content: space-between; align-items: center; font-mono; font-size: 11px; margin-top: 4px; }
    .badge { display: inline-block; background: #ecfdf5; color: #059669; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid #a7f3d0; margin-bottom: 12px; }
    .btn-copy { background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 3px 8px; font-size: 10px; font-weight: 700; cursor: pointer; }
    .ping-result { margin-top: 8px; font-size: 11px; font-weight: bold; padding: 8px; border-radius: 10px; display: none; }
    .footer { font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">AMN</div>
    <span class="badge">● متصل بالشبكة المحلية (${localIp})</span>
    <h1>بوابة هاتف AMN Cash</h1>
    <p class="sub">اختر الإجراء المطلوب: تفعيل الاتصال إذا كان التطبيق لديك، أو تحميل نسخة جديدة للهاتف.</p>

    <div class="choice-container">
      
      <!-- Option 1: Activate & Pair Connection -->
      <div class="option-card-pair">
        <div class="option-title-pair">
          <span>🔗 1. تفعيل وربط الهاتف بالنظام</span>
          <span style="background:#dcfce7; padding:2px 8px; border-radius:8px; font-size:10px;">التطبيق مثبت مسبقاً</span>
        </div>
        <p class="option-desc-pair">اضغط هنا لفتح التطبيق على هاتفك وتفعيل استقبال رسائل فودافون كاش ومزامنتها فورياً مع جهاز الكمبيوتر.</p>
        <a href="${deepLink}" class="btn-pair" id="pairBtn">تفعيل الاتصال وفتح التطبيق فوراً</a>
      </div>

      <!-- Option 2: Download APK -->
      <div class="option-card-download">
        <div class="option-title-download">
          <span>📥 2. تحميل وتثبيت التطبيق (APK)</span>
          <span style="background:#fee2e2; padding:2px 8px; border-radius:8px; font-size:10px;">هاتف جديد / لأول مرة</span>
        </div>
        <p class="option-desc-download">اضغط هنا فقط إذا لم يكن التطبيق مثبتاً على هاتفك لتنزيل الحزمة (حجم الملف: 8.2 ميجابايت).</p>
        <a href="/api/download/apk" class="btn-download">تحميل ملف التطبيق (Download APK)</a>
      </div>

    </div>

    <!-- LAN Server Details Box -->
    <div class="net-box">
      <div style="font-weight:bold; color:#334155; margin-bottom:4px;">معلومات الاتصال المباشر:</div>
      <div class="net-row">
        <span style="color:#64748b;">عنوان السيرفر:</span>
        <span style="font-family:monospace; font-weight:bold; color:#ca1535; direction:ltr;">${serverUrl}</span>
      </div>
      <div style="margin-top:8px; display:flex; gap:6px;">
        <button class="btn-copy" onclick="copyServerUrl()" style="flex:1;">📋 نسخ رابط السيرفر</button>
        <button class="btn-copy" onclick="pingServer()" style="flex:1; background:#f1f5f9;">📡 فحص جودة الاتصال</button>
      </div>
      <div id="pingBox" class="ping-result"></div>
    </div>

    <div class="footer">نظام إدارة ومتابعة معاملات فودافون كاش - AMN Cash v1.0</div>
  </div>

  <script>
    function copyServerUrl() {
      navigator.clipboard.writeText('${serverUrl}');
      alert('تم نسخ عنوان السيرفر: ${serverUrl}');
    }

    async function pingServer() {
      const box = document.getElementById('pingBox');
      box.style.display = 'block';
      box.style.background = '#fef9c3';
      box.style.color = '#854d0e';
      box.textContent = 'جاري قياس استجابة السيرفر...';
      try {
        const start = Date.now();
        const res = await fetch('/api/settings');
        const latency = Date.now() - start;
        if (res.ok) {
          box.style.background = '#dcfce7';
          box.style.color = '#15803d';
          box.textContent = '✅ الاتصال بالسيرفر ممتاز! سرعة الاستجابة: ' + latency + ' مللي ثانية.';
        } else {
          throw new Error('HTTP ' + res.status);
        }
      } catch (err) {
        box.style.background = '#fee2e2';
        box.style.color = '#b91c1c';
        box.textContent = '❌ تعذر الاتصال، تأكد من أن الهاتف على نفس شبكة الواي فاي.';
      }
    }
  </script>
</body>
</html>`;
  res.send(html);
});

// Download Binary APK Endpoint
app.get('/api/download/apk', (req, res) => {
  const apkPath = getApkFilePath();
  if (apkPath && fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="AMN-Cash-Collector.apk"');
    res.sendFile(apkPath);
  } else {
    res.status(404).send('ملف تطبيق الهاتف (APK) غير متوفر حالياً على هذا السيرفر.');
  }
});

// Get QR Code for Mobile APK Download
app.get('/api/apk-download-qr', async (req, res) => {
  try {
    const localIp = getLocalIpAddresses();
    const downloadPageUrl = `http://${localIp}:5500/download-app`;
    const apkDirectUrl = `http://${localIp}:5500/api/download/apk`;
    const apkPath = getApkFilePath();

    const qrDataUrl = await QRCode.toDataURL(downloadPageUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      data: {
        downloadPageUrl,
        apkDirectUrl,
        qrCode: qrDataUrl,
        localIp,
        apkAvailable: !!apkPath,
        apkSizeMB: apkPath ? (fs.statSync(apkPath).size / (1024 * 1024)).toFixed(1) : '8.2'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/pairing-qr', async (req, res) => {
  try {
    const localIp = getLocalIpAddresses();
    const newDeviceId = `dev_${crypto.randomBytes(4).toString('hex')}`;
    const newDeviceSecret = crypto.randomBytes(32).toString('hex');

    // Register or upsert device in database
    await runQuery(`
      INSERT INTO devices (device_id, device_name, device_ip, device_secret, auth_token, status, last_sync, total_messages, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING_PAIR', datetime('now', 'localtime'), 0, datetime('now', 'localtime'))
      ON CONFLICT(device_id) DO UPDATE SET device_secret = excluded.device_secret
    `, [newDeviceId, 'هاتف جديد (Android)', `${localIp}:5500`, newDeviceSecret, newDeviceSecret]);

    const pairingPayload = {
      appName: 'AMN Cash Collector',
      serverUrl: `http://${localIp}:5500/api/sms/inbox`,
      deviceId: newDeviceId,
      deviceSecret: newDeviceSecret,
      timestamp: Date.now()
    };

    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(pairingPayload), {
      width: 280,
      margin: 2,
      color: {
        dark: '#ca1535',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      data: {
        qrCode: qrDataUrl,
        serverAddress: `${localIp}:5500`,
        pairingPayload
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Backup Download (With VACUUM INTO support)
app.get('/api/backup/download', async (req, res) => {
  try {
    const dbDir = path.resolve(__dirname, '../data');
    const backupDir = path.join(dbDir, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const backupFileName = `AMN_Cash_Backup_${new Date().toISOString().slice(0, 10)}_${Date.now()}.sqlite`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // Create safe snapshot via SQLite VACUUM INTO
    await runQuery(`VACUUM INTO ?`, [backupFilePath]);

    res.download(backupFilePath, backupFileName, () => {
      try {
        if (fs.existsSync(backupFilePath)) fs.unlinkSync(backupFilePath);
      } catch {}
    });
  } catch {
    const dbFile = path.resolve(__dirname, '../data/amn_cash.sqlite');
    if (fs.existsSync(dbFile)) {
      res.download(dbFile, `AMN_Cash_Backup_${new Date().toISOString().slice(0, 10)}.sqlite`);
    } else {
      res.status(404).json({ success: false, error: 'Database file not found' });
    }
  }
});

// -----------------------------------------------------------------------------
// Static Frontend Files & SPA Fallback
// -----------------------------------------------------------------------------
let distPath = path.resolve(__dirname, '../dist');
if (!fs.existsSync(distPath)) {
  const asarDist = path.resolve(__dirname, '../../app.asar/dist');
  if (fs.existsSync(asarDist)) distPath = asarDist;
}

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// -----------------------------------------------------------------------------
// Initialize and Start Server
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 5500;

async function start() {
  await initDatabase();
  server.listen(PORT, () => {
    const localIp = getLocalIpAddresses();
    console.log(`====================================================`);
    console.log(`  AMN Cash Server running on: http://localhost:${PORT}`);
    console.log(`  LAN Address for Android App: http://${localIp}:${PORT}`);
    console.log(`====================================================`);
  });
}

start().catch(err => {
  console.error('Failed to start AMN Cash server:', err);
});
