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

  // Determine Transaction Direction with contextual understanding
  let detectedType = null;
  let typeLabel = null;

  if (normalized.includes('سحب')) {
    detectedType = 'WITHDRAWAL';
    typeLabel = 'سحب';
  } else if (
    normalized.includes('إلى محفظتك') || 
    normalized.includes('في محفظتك') || 
    normalized.includes('استلام') || 
    normalized.includes('إيداع') ||
    normalized.includes('تم استلام') ||
    normalized.includes('تم إيداع')
  ) {
    detectedType = 'INCOMING';
    typeLabel = 'وارد';
  } else if (
    normalized.includes('من محفظتك') || 
    normalized.includes('من رقمك') || 
    normalized.includes('إلى رقم') || 
    normalized.includes('تحويل إلى') ||
    normalized.includes('تم تحويل')
  ) {
    detectedType = 'OUTGOING';
    typeLabel = 'صادر';
  }

  // Flexible Amount Matcher: finds any amount followed by currency or preceding currency
  const amtMatch = normalized.match(/(?:مبلغ\s+)?([\d,.]+)\s*(?:جنيه|ج\.م)/i) ||
                   normalized.match(/(?:استلام|إيداع|تحويل|سحب)\s+(?:مبلغ\s+)?([\d,.]+)/i);

  // Extract Operation / Reference Number
  const opMatch = normalized.match(/(?:رقم\s+العملية|كود\s+العملية|كود|العملية|المرجع|رقم\s+المرجع)\s*(?:هو|:)?\s*(\d{6,16})/i);
  const referenceNumber = opMatch ? opMatch[1] : `REF-${crypto.randomUUID().slice(0, 8)}`;

  // Extract Balance if present
  const balanceMatch = normalized.match(/رصيدك\s*(?:الحالي)?\s*(?:هو|:)?\s*([\d,.]+)/i);
  const balancePiasters = balanceMatch ? parseAmountToPiasters(balanceMatch[1]) : 0;

  // Extract Phone Number involved
  let phone = 'غير محدد';
  if (detectedType === 'INCOMING') {
    const fromPhoneMatch = normalized.match(/من\s+(?:رقم\s+)?(\d{10,12})/i);
    if (fromPhoneMatch) phone = fromPhoneMatch[1];
  } else if (detectedType === 'OUTGOING') {
    const toPhoneMatch = normalized.match(/إلى\s+(?:رقم\s+)?(\d{10,12})/i);
    if (toPhoneMatch) phone = toPhoneMatch[1];
  } else if (detectedType === 'WITHDRAWAL') {
    phone = 'سحب نقدي (ATM / منفذ)';
  }

  if (amtMatch) {
    const amountPiasters = parseAmountToPiasters(amtMatch[1]);
    if (amountPiasters > 0 && detectedType) {
      return {
        success: true,
        type: detectedType,
        typeLabel,
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
