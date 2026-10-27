package com.amn.cash.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.amn.cash.network.WindowsApiClient
import java.util.regex.Pattern

class VodafoneSmsReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "VodafoneSmsReceiver"

        // Sensitive OTP / PIN patterns: strictly drop on phone before transmission
        private val SENSITIVE_PATTERNS = listOf(
            Pattern.compile("(?i)otp"),
            Pattern.compile("(?i)pin"),
            Pattern.compile("كود التأكيد"),
            Pattern.compile("رمز التأكيد"),
            Pattern.compile("رمز التحقق"),
            Pattern.compile("كود التحقق"),
            Pattern.compile("كلمة السر"),
            Pattern.compile("لا تشارك هذا الكود"),
            Pattern.compile("لا تشارك الرقم السري")
        )
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        val fullBody = StringBuilder()
        var sender = ""

        for (sms in messages) {
            fullBody.append(sms.messageBody)
            if (sender.isEmpty()) {
                sender = sms.originatingAddress ?: ""
            }
        }

        val text = fullBody.toString()
        Log.d(TAG, "SMS received from: $sender")

        // 1. Strict Privacy Filter (Drop any OTP or PIN)
        for (pattern in SENSITIVE_PATTERNS) {
            if (pattern.matcher(text).find()) {
                Log.w(TAG, "Dropping message: contains sensitive OTP/PIN pattern.")
                return
            }
        }

        // 2. Filter for Vodafone Cash Keywords
        val isVodafoneCash = text.contains("فودافون كاش", ignoreCase = true) ||
                text.contains("Vodafone Cash", ignoreCase = true) ||
                text.contains("محفظتك", ignoreCase = true) ||
                text.contains("رصيدك الحالي", ignoreCase = true) ||
                sender.contains("VF-Cash", ignoreCase = true) ||
                sender.contains("Vodafone", ignoreCase = true)

        if (isVodafoneCash) {
            Log.i(TAG, "Valid Vodafone Cash financial SMS detected! Sending to Windows PC...")
            // Post to Windows Server via Client
            WindowsApiClient.sendSmsEvent(context, text)
        } else {
            Log.d(TAG, "Ignored SMS: not a Vodafone Cash transaction.")
        }
    }
}
