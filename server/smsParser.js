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

  // 1. Privacy & Security Guard
  if (isSensitiveMessage(rawText)) {
    return {
      success: false,
      reason: 'REJECTED_SENSITIVE_CONTENT',
      isSensitive: true
    };
  }

  const normalized = normalizeDigits(rawText);

  // Pattern A: Incoming Transfer (استلام أموال / تحويل وارد)
  // "تم استلام مبلغ 1,000.00 جنيه من رقم 01012345678 رصيدك الحالي هو 15,200.00 جنيه رقم العملية 123456789"
  const incomingMatch = normalized.match(/تم\s+(?:استلام|إيداع|تحويل)\s+مبلغ\s+([\d,.]+)\s*(?:جنيه|ج\.م)?(?:\s+من\s+(?:رقم\s+)?(\d{10,12}))?/i);
  
  // Pattern B: Cash Withdrawal (سحب كاش من منفذ أو ATM)
  // "تم سحب مبلغ 5,000.00 جنيه من محفظتك فودافون كاش ... رقم العملية 987654321"
  const withdrawalMatch = normalized.match(/تم\s+سحب\s+مبلغ\s+([\d,.]+)\s*(?:جنيه|ج\.م)?/i);

  // Pattern C: Outgoing Transfer (تحويل إلى رقم آخر)
  // "تم تحويل مبلغ 500.00 جنيه إلى رقم 01099887766 ... رقم العملية 55443322"
  const outgoingMatch = normalized.match(/تم\s+تحويل\s+مبلغ\s+([\d,.]+)\s*(?:جنيه|ج\.م)?\s+إلى\s+(?:رقم\s+)?(\d{10,12})/i);

  // Extract Operation / Reference Number
  const opMatch = normalized.match(/(?:رقم\s+العملية|كود\s+العملية|المرجع|رقم\s+المرجع)\s*(?:هو|:)?\s*(\d{6,16})/i);
  const referenceNumber = opMatch ? opMatch[1] : `REF-${Date.now().toString().slice(-8)}`;

  // Extract Balance if present
  const balanceMatch = normalized.match(/رصيدك\s+الحالي\s*(?:هو|:)?\s*([\d,.]+)/i);
  const balancePiasters = balanceMatch ? parseAmountToPiasters(balanceMatch[1]) : 0;

  if (incomingMatch && !outgoingMatch && !withdrawalMatch) {
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

  if (withdrawalMatch) {
    const amountPiasters = parseAmountToPiasters(withdrawalMatch[1]);
    if (amountPiasters > 0) {
      return {
        success: true,
        type: 'WITHDRAWAL',
        typeLabel: 'سحب',
        amountPiasters,
        phone: 'سحب نقدي (ATM / فرع)',
        referenceNumber,
        balancePiasters,
        rawSms: rawText
      };
    }
  }

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
