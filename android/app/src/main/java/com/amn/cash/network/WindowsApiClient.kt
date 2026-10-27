package com.amn.cash.network

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import java.util.concurrent.Executors
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

data class SmsLogItem(
    val id: String,
    val sender: String,
    val text: String,
    val timestamp: Long,
    val success: Boolean
)

object WindowsApiClient {
    private const val TAG = "WindowsApiClient"
    private const val PREFS_NAME = "amn_cash_prefs"
    private const val KEY_SERVER_URL = "server_url"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_DEVICE_SECRET = "device_secret"
    private const val KEY_TOTAL_SENT = "total_sent"
    private const val KEY_LOGS = "sms_logs_json"

    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())

    fun savePairing(context: Context, serverUrl: String, deviceId: String, deviceSecret: String) {
        val cleanUrl = if (serverUrl.startsWith("http://") || serverUrl.startsWith("https://")) {
            serverUrl
        } else {
            "http://$serverUrl"
        }
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_SERVER_URL, cleanUrl)
            .putString(KEY_DEVICE_ID, deviceId)
            .putString(KEY_DEVICE_SECRET, deviceSecret)
            .apply()
        Log.i(TAG, "Pairing saved: Server=$cleanUrl DeviceId=$deviceId")
    }

    fun getServerUrl(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_SERVER_URL, "") ?: ""
    }

    fun getDeviceId(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_DEVICE_ID, "dev_mobile_companion") ?: "dev_mobile_companion"
    }

    fun getDeviceSecret(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_DEVICE_SECRET, "sec_amn_companion_secret") ?: "sec_amn_companion_secret"
    }

    fun getTotalSent(context: Context): Int {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getInt(KEY_TOTAL_SENT, 0)
    }

    fun addLog(context: Context, sender: String, text: String, success: Boolean) {
        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val existing = prefs.getString(KEY_LOGS, "[]") ?: "[]"
            val array = JSONArray(existing)
            val obj = JSONObject().apply {
                put("id", UUID.randomUUID().toString())
                put("sender", sender)
                put("text", text)
                put("timestamp", System.currentTimeMillis())
                put("success", success)
            }
            val newArray = JSONArray()
            newArray.put(obj)
            // Keep at most 20 recent logs
            for (i in 0 until minOf(array.length(), 19)) {
                newArray.put(array.getJSONObject(i))
            }
            prefs.edit().putString(KEY_LOGS, newArray.toString()).apply()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save log: ${e.message}")
        }
    }

    fun getLogs(context: Context): List<SmsLogItem> {
        val list = mutableListOf<SmsLogItem>()
        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val json = prefs.getString(KEY_LOGS, "[]") ?: "[]"
            val array = JSONArray(json)
            for (i in 0 until array.length()) {
                val o = array.getJSONObject(i)
                list.add(
                    SmsLogItem(
                        id = o.optString("id"),
                        sender = o.optString("sender", "VF-Cash"),
                        text = o.optString("text", ""),
                        timestamp = o.optLong("timestamp", System.currentTimeMillis()),
                        success = o.optBoolean("success", true)
                    )
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse logs: ${e.message}")
        }
        return list
    }

    private fun hmacSha256(data: String, key: String): String {
        val algorithm = "HmacSHA256"
        val secretKeySpec = SecretKeySpec(key.toByteArray(Charsets.UTF_8), algorithm)
        val mac = Mac.getInstance(algorithm)
        mac.init(secretKeySpec)
        val bytes = mac.doFinal(data.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }

    fun pingServer(context: Context, onResult: (Boolean, String) -> Unit) {
        val serverUrl = getServerUrl(context)
        if (serverUrl.isBlank()) {
            mainHandler.post { onResult(false, "لم يتم حفظ عنوان الكمبيوتر بعد") }
            return
        }

        executor.execute {
            var connection: HttpURLConnection? = null
            try {
                // Ping settings endpoint
                val base = serverUrl.substringBefore("/api/")
                val url = URL("$base/api/settings")
                connection = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 4000
                    readTimeout = 4000
                }
                val code = connection.responseCode
                if (code in 200..299) {
                    mainHandler.post { onResult(true, "متصل بنجاح مع حاسوب الويندوز ($code)") }
                } else {
                    mainHandler.post { onResult(false, "استجاب السيرفر برمز خطأ ($code)") }
                }
            } catch (e: Exception) {
                mainHandler.post { onResult(false, "تعذر الوصول للسيرفر: ${e.localizedMessage ?: "تأكد من Wi-Fi"}") }
            } finally {
                connection?.disconnect()
            }
        }
    }

    fun pairWithServer(context: Context, rawServerUrl: String, onResult: (Boolean, String) -> Unit) {
        executor.execute {
            var connection: HttpURLConnection? = null
            try {
                val cleanBase = if (rawServerUrl.startsWith("http://") || rawServerUrl.startsWith("https://")) {
                    rawServerUrl.substringBefore("/api/")
                } else {
                    "http://${rawServerUrl.substringBefore("/api/")}"
                }

                val pairUrl = URL("$cleanBase/api/devices/pair")
                val deviceModel = android.os.Build.MODEL ?: "هاتف Android"
                val deviceId = "dev_${android.os.Build.SERIAL ?: UUID.randomUUID().toString().substring(0, 8)}"
                val deviceSecret = "sec_${UUID.randomUUID().toString().replace("-", "")}"

                val payload = JSONObject().apply {
                    put("deviceId", deviceId)
                    put("deviceName", deviceModel)
                    put("deviceSecret", deviceSecret)
                }

                connection = (pairUrl.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                    connectTimeout = 5000
                    readTimeout = 5000
                    doOutput = true
                }

                OutputStreamWriter(connection.outputStream, "UTF-8").use {
                    it.write(payload.toString())
                    it.flush()
                }

                val code = connection.responseCode
                if (code in 200..299) {
                    val fullInboxUrl = "$cleanBase/api/sms/inbox"
                    savePairing(context, fullInboxUrl, deviceId, deviceSecret)
                    mainHandler.post { onResult(true, "تم إقران الهاتف بالمنظومة بنجاح!") }
                } else {
                    mainHandler.post { onResult(false, "فشل الإقران (كود $code)") }
                }
            } catch (e: Exception) {
                mainHandler.post { onResult(false, "تعذر الاتصال بالسيرفر: ${e.message}") }
            } finally {
                connection?.disconnect()
            }
        }
    }

    fun sendSmsEvent(context: Context, smsText: String, sender: String = "VF-Cash", onResult: ((Boolean) -> Unit)? = null) {
        val serverUrl = getServerUrl(context)
        if (serverUrl.isBlank()) {
            Log.w(TAG, "Cannot send SMS: No Windows server paired yet.")
            addLog(context, sender, smsText, false)
            mainHandler.post { onResult?.invoke(false) }
            return
        }

        val deviceId = getDeviceId(context)
        val deviceSecret = getDeviceSecret(context)

        executor.execute {
            var connection: HttpURLConnection? = null
            var success = false
            try {
                val url = URL(serverUrl)
                val path = url.path.ifEmpty { "/api/sms/inbox" }
                val timestamp = System.currentTimeMillis()
                val nonce = UUID.randomUUID().toString()

                val payload = JSONObject().apply {
                    put("smsText", smsText)
                    put("deviceId", deviceId)
                    put("eventId", "sms_$timestamp")
                }
                val rawBody = payload.toString()

                // Calculate HMAC-SHA256 signature
                val toSign = "POST" + path + timestamp + nonce + rawBody
                val signature = hmacSha256(toSign, deviceSecret)

                connection = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                    setRequestProperty("x-device-id", deviceId)
                    setRequestProperty("x-timestamp", timestamp.toString())
                    setRequestProperty("x-nonce", nonce)
                    setRequestProperty("x-signature", signature)
                    connectTimeout = 6000
                    readTimeout = 6000
                    doOutput = true
                }

                OutputStreamWriter(connection.outputStream, "UTF-8").use { writer ->
                    writer.write(rawBody)
                    writer.flush()
                }

                val responseCode = connection.responseCode
                if (responseCode in 200..299) {
                    Log.i(TAG, "SMS successfully synchronized with Windows app (Authenticated HMAC)!")
                    success = true
                    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                    val count = prefs.getInt(KEY_TOTAL_SENT, 0) + 1
                    prefs.edit().putInt(KEY_TOTAL_SENT, count).apply()
                } else {
                    Log.e(TAG, "Server returned error code: $responseCode")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Network sync failed: ${e.message}")
            } finally {
                connection?.disconnect()
                addLog(context, sender, smsText, success)
                // Always post back to Main UI thread safely
                mainHandler.post {
                    onResult?.invoke(success)
                }
            }
        }
    }
}
