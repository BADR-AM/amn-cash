package com.amn.cash.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
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
            Pattern.compile("لا تشارك الرقم السري"),
            Pattern.compile("do not share", Pattern.CASE_INSENSITIVE)
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
        Log.d(TAG, "SMS received from: $sender | body: $text")

        // 1. Strict Privacy Filter (Drop any OTP or PIN immediately)
        for (pattern in SENSITIVE_PATTERNS) {
            if (pattern.matcher(text).find()) {
                Log.w(TAG, "Dropping message: contains sensitive OTP/PIN pattern.")
                return
            }
        }

        // 2. Comprehensive Filter for Vodafone Cash Keywords
        val senderNormalized = sender.uppercase()
        val isSenderVodafone = senderNormalized.contains("VF-CASH") ||
                senderNormalized.contains("VODAFONE") ||
                senderNormalized.contains("V-CASH") ||
                senderNormalized.contains("1000") ||
                senderNormalized.contains("9009")

        val isVodafoneCashText = text.contains("فودافون كاش", ignoreCase = true) ||
                text.contains("Vodafone Cash", ignoreCase = true) ||
                text.contains("محفظتك", ignoreCase = true) ||
                text.contains("رصيدك الحالي", ignoreCase = true) ||
                text.contains("رصيدك", ignoreCase = true) ||
                text.contains("تم استلام", ignoreCase = true) ||
                text.contains("تم إيداع", ignoreCase = true) ||
                text.contains("إيداع", ignoreCase = true) ||
                text.contains("تم تحويل", ignoreCase = true) ||
                text.contains("تحويل", ignoreCase = true) ||
                text.contains("سحب نقدي", ignoreCase = true) ||
                text.contains("مصاريف السحب", ignoreCase = true) ||
                (text.contains("جنيه") && text.contains("العملية"))

        if (isSenderVodafone || isVodafoneCashText) {
            Log.i(TAG, "Valid Vodafone Cash financial SMS detected! Enqueueing & Syncing...")

            // Haptic notification (vibrate)
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                    vm?.defaultVibrator?.vibrate(VibrationEffect.createOneShot(300, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    val v = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        v?.vibrate(VibrationEffect.createOneShot(300, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        v?.vibrate(300)
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Vibrate error: ${e.message}")
            }

            // PowerManager WakeLock: hold CPU for 15 seconds to finish queue write & network send
            val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            val wakeLock = pm?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AMNCash:SmsReceiverWakeLock")
            wakeLock?.acquire(15000)

            val pendingResult = goAsync()

            WindowsApiClient.enqueueAndSyncMessage(
                context = context,
                sender = sender.ifEmpty { "VF-Cash" },
                text = text
            ) { success ->
                Log.i(TAG, "SMS Processed with status: success=$success")
                try {
                    wakeLock?.release()
                } catch (e: Exception) {}
                try {
                    pendingResult.finish()
                } catch (e: Exception) {}
            }
        } else {
            Log.d(TAG, "Ignored SMS: not a Vodafone Cash transaction.")
        }
    }
}
