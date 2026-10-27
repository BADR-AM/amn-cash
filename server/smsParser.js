import crypto from 'crypto';

/**
 * Deterministic Vodafone Cash SMS Parser
 * Extracts transaction metadata, amounts, counterparty phone, and reference numbers.
 * Strictly filters out OTP / PIN / password messages.
 */

// Deny-list patterns: NEVER accept or store these
const SENSITIVE_KEYWORDS = [
  /otp/i,
  /pin/i,
  /كود التأكيد/i,
  /رمز التأكيد/i,
  /رمز التحقق/i,
  /كود التحقق/i,
  /كلمة السر/i,
  /لا تشارك هذا الكود/i,
  /لا تشارك الرقم السري/i,
  /verification code/i,
  /security code/i
];

export function isSensitiveMessage(text) {
  if (!text || typeof text !== 'string') return true;
  return SENSITIVE_KEYWORDS.some(pattern => pattern.test(text));
}

/**
 * Normalizes Arabic numbers (٠-٩) to standard digits (0-9)
 */
export function normalizeDigits(str) {
  if (!str) return '';
  return str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

/**
 * Extracts amount in piasters from text (e.g. 1000.50 -> 100050)
 */
function parseAmountToPiasters(numStr) {
  if (!numStr) return 0;
  const clean = numStr.replace(/,/g, '').trim();
  const val = parseFloat(clean);
  if (isNaN(val) || val <= 0) return 0;
  return Math.round(val * 100);
}

/**
 * Main parser function
 */
export function parseVodafoneCashSms(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { success: false, reason: 'Empty or invalid message' };
  }

  // 1. Strict Privacy & Security Guard
  if (isSensitiveMessage(rawText)) {
    return {
      success: false,
      reason: 'REJECTED_SENSITIVE_CONTENT',
      isSensitive: true
    };
  }

  const normalized = normalizeDigits(rawText);

  // Flexible, Comprehensive Regex patterns for all Egyptian Vodafone Cash templates
  // 1. Incoming transfers (استلام / إيداع / تحويل من رقم X إلى محفظتك)
  const incomingTransferFromMatch = normalized.match(/(?:تم\s+)?تحويل\s+(?:مبلغ\s+)?([\d,.]+)\s*(?:جنيه|ج\.م)?\s+من\s+(?:رقم\s+)?(\d{10,12})/i);
  const incomingStandardMatch = normalized.match(/(?:تم\s+)?(?:استلام|إيداع)\s+(?:مبلغ\s+)?([\d,.]+)\s*(?:جنيه|ج\.م)?(?:\s+من\s+(?:رقم\s+)?(\d{10,12}))?/i);
  const incomingMatch = incomingTransferFromMatch || incomingStandardMatch;

  // 2. Outgoing transfers (تحويل إلى رقم X)
  const outgoingMatch = normalized.match(/(?:تم\s+)?(?:تحويل|إرسال)\s+(?:مبلغ\s+)?([\d,.]+)\s*(?:جنيه|ج\.م)?\s+إلى\s+(?:رقم\s+)?(\d{10,12})/i);

  // 3. Cash Withdrawals (سحب من ATM أو فرع)
  const withdrawalMatch = normalized.match(/(?:تم\s+)?سحب\s+(?:مبلغ\s+)?([\d,.]+)\s*(?:جنيه|ج\.م)?/i);

  // Extract Operation / Reference Number
  const opMatch = normalized.match(/(?:رقم\s+العملية|كود\s+العملية|المرجع|رقم\s+المرجع)\s*(?:هو|:)?\s*(\d{6,16})/i);
  const referenceNumber = opMatch ? opMatch[1] : `REF-${crypto.randomUUID().slice(0, 8)}`;

  // Extract Balance if present
  const balanceMatch = normalized.match(/رصيدك\s+الحالي\s*(?:هو|:)?\s*([\d,.]+)/i);
  const balancePiasters = balanceMatch ? parseAmountToPiasters(balanceMatch[1]) : 0;

  if (outgoingMatch) {
    const amountPiasters = parseAmountToPiasters(outgoingMatch[1]);
    const phone = outgoingMatch[2] || 'غير محدد';
    if (amountPiasters > 0) {
      return {
        success: true,
        type: 'OUTGOING',
        typeLabel: 'صادر',
        amountPiasters,
        phone,
        referenceNumber,
        balancePiasters,
        rawSms: rawText
      };
    }
  }

  if (withdrawalMatch) {
    const amountPiasters = parseAmountToPiasters(withdrawalMatch[1]);
    if (amountPiasters > 0) {
      return {
        success: true,
        type: 'WITHDRAWAL',
        typeLabel: 'سحب',
        amountPiasters,
        phone: 'سحب نقدي (ATM / منفذ)',
        referenceNumber,
        balancePiasters,
        rawSms: rawText
      };
    }
  }

  if (incomingMatch) {
    const amountPiasters = parseAmountToPiasters(incomingMatch[1]);
    const phone = incomingMatch[2] || 'غير محدد';
    if (amountPiasters > 0) {
      return {
        success: true,
        type: 'INCOMING',
        typeLabel: 'وارد',
        amountPiasters,
        phone,
        referenceNumber,
        balancePiasters,
        rawSms: rawText
      };
    }
  }

  // Fallback for generic financial SMS containing Vodafone Cash terms
  if (normalized.includes('فودافون كاش') || normalized.includes('Vodafone Cash') || normalized.includes('محفظتك')) {
    const anyNumMatch = normalized.match(/مبلغ\s+([\d,.]+)/i);
    if (anyNumMatch) {
      const amountPiasters = parseAmountToPiasters(anyNumMatch[1]);
      return {
        success: true,
        type: 'OTHER',
        typeLabel: 'معاملة أخرى',
        amountPiasters,
        phone: 'فودافون كاش',
        referenceNumber,
        balancePiasters,
        rawSms: rawText,
        needsReview: true
      };
    }
  }

  return {
    success: false,
    reason: 'UNKNOWN_SMS_FORMAT'
  };
}
