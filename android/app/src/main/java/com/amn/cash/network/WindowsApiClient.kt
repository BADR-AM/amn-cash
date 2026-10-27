package com.amn.cash.network

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import java.util.concurrent.Executors
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

data class SmsMessageItem(
    val id: String,
    val sender: String,
    val text: String,
    val timestamp: Long,
    var status: String, // "SYNCED", "PENDING", "FAILED"
    var retryCount: Int = 0,
    var errorMessage: String? = null
)

object WindowsApiClient {
    private const val TAG = "WindowsApiClient"
    private const val PREFS_NAME = "amn_cash_prefs"
    private const val KEY_SERVER_URL = "server_url"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_DEVICE_SECRET = "device_secret"
    private const val KEY_TOTAL_SENT = "total_sent"
    private const val KEY_MESSAGES_QUEUE = "sms_queue_v2"

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
        val defaultId = "dev_" + android.os.Build.MODEL.replace(" ", "_").take(12)
        return prefs.getString(KEY_DEVICE_ID, defaultId) ?: defaultId
    }

    fun getDeviceSecret(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_DEVICE_SECRET, "sec_amn_companion_secret") ?: "sec_amn_companion_secret"
    }

    fun getTotalSent(context: Context): Int {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getInt(KEY_TOTAL_SENT, 0)
    }

    // --- Outbox Persistent Queue Storage ---

    @Synchronized
    fun enqueueMessage(context: Context, sender: String, text: String): SmsMessageItem {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val list = getAllMessages(context).toMutableList()
        val item = SmsMessageItem(
            id = "msg_" + UUID.randomUUID().toString().take(10),
            sender = sender,
            text = text,
            timestamp = System.currentTimeMillis(),
            status = "PENDING",
            retryCount = 0,
            errorMessage = "بانتظار التأكيد من الكمبيوتر"
        )
        list.add(0, item)
        // Keep at most 50 recent messages in memory/disk
        val trimmed = if (list.size > 50) list.take(50) else list
        saveMessagesList(prefs, trimmed)
        return item
    }

    @Synchronized
    fun updateMessageStatus(context: Context, id: String, status: String, error: String? = null) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val list = getAllMessages(context).map { item ->
            if (item.id == id) {
                item.copy(
                    status = status,
                    retryCount = item.retryCount + 1,
                    errorMessage = error
                )
            } else {
                item
            }
        }
        saveMessagesList(prefs, list)
    }

    fun getAllMessages(context: Context): List<SmsMessageItem> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(KEY_MESSAGES_QUEUE, "[]") ?: "[]"
        val list = mutableListOf<SmsMessageItem>()
        try {
            val arr = JSONArray(json)
            for (i in 0 until arr.length()) {
                val o = arr.getJSONObject(i)
                list.add(
                    SmsMessageItem(
                        id = o.optString("id"),
                        sender = o.optString("sender", "VF-Cash"),
                        text = o.optString("text", ""),
                        timestamp = o.optLong("timestamp", System.currentTimeMillis()),
                        status = o.optString("status", "PENDING"),
                        retryCount = o.optInt("retryCount", 0),
                        errorMessage = o.optString("errorMessage", null)
                    )
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing queue JSON: ${e.message}")
        }
        return list
    }

    fun getPendingCount(context: Context): Int {
        return getAllMessages(context).count { it.status != "SYNCED" }
    }

    private fun saveMessagesList(prefs: android.content.SharedPreferences, list: List<SmsMessageItem>) {
        val arr = JSONArray()
        for (item in list) {
            val o = JSONObject().apply {
                put("id", item.id)
                put("sender", item.sender)
                put("text", item.text)
                put("timestamp", item.timestamp)
                put("status", item.status)
                put("retryCount", item.retryCount)
                put("errorMessage", item.errorMessage ?: "")
            }
            arr.put(o)
        }
        prefs.edit().putString(KEY_MESSAGES_QUEUE, arr.toString()).apply()
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
            mainHandler.post { onResult(false, "لم يتم ضبط عنوان الكمبيوتر بعد") }
            return
        }

        executor.execute {
            var connection: HttpURLConnection? = null
            try {
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
                    mainHandler.post { onResult(false, "السيرفر استجاب برمز ($code)") }
                }
            } catch (e: Exception) {
                mainHandler.post { onResult(false, "تعذر الوصول للسيرفر: ${e.localizedMessage ?: "تحقق من اتصال Wi-Fi"}") }
            } finally {
                connection?.disconnect()
            }
        }
    }

    fun pairWithServer(context: Context, rawServerUrl: String, onResult: ((Boolean, String) -> Unit)? = null) {
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
                val deviceId = getDeviceId(context)
                val deviceSecret = getDeviceSecret(context)

                val payload = JSONObject().apply {
                    put("deviceId", deviceId)
                    put("deviceName", deviceModel)
                    put("deviceSecret", deviceSecret)
                }

                connection = (pairUrl.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                    connectTimeout = 6000
                    readTimeout = 6000
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
                    mainHandler.post { onResult?.invoke(true, "تم إقران الهاتف بالمنظومة بنجاح!") }
                } else {
                    mainHandler.post { onResult?.invoke(false, "فشل الإقران (كود $code)") }
                }
            } catch (e: Exception) {
                mainHandler.post { onResult?.invoke(false, "تعذر الاتصال بالسيرفر: ${e.message}") }
            } finally {
                connection?.disconnect()
            }
        }
    }

    // High Level: Enqueue Immediately + Attempt Instant Sync
    fun enqueueAndSyncMessage(context: Context, sender: String, text: String, onComplete: ((Boolean) -> Unit)? = null) {
        // Step 1: Write Ahead Log to disk
        val item = enqueueMessage(context, sender, text)

        // Step 2: Attempt immediate sync
        sendSingleMessage(context, item) { success ->
            if (!success) {
                // If immediate send fails, trigger background queue flusher
                triggerBackgroundQueueFlush(context)
            }
            mainHandler.post { onComplete?.invoke(success) }
        }
    }

    // Send a single message to Windows PC (returns true on 200 or duplicate)
    private fun sendSingleMessage(context: Context, item: SmsMessageItem, onComplete: (Boolean) -> Unit) {
        val serverUrl = getServerUrl(context)
        if (serverUrl.isBlank()) {
            updateMessageStatus(context, item.id, "FAILED", "لم يتم ربط الكمبيوتر بعد")
            onComplete(false)
            return
        }

        val deviceId = getDeviceId(context)
        val deviceSecret = getDeviceSecret(context)

        executor.execute {
            var connection: HttpURLConnection? = null
            var success = false
            var errStr: String? = null
            try {
                val url = URL(serverUrl)
                val path = url.path.ifEmpty { "/api/sms/inbox" }
                val timestamp = System.currentTimeMillis()
                val nonce = UUID.randomUUID().toString()

                val payload = JSONObject().apply {
                    put("smsText", item.text)
                    put("deviceId", deviceId)
                    put("eventId", "sms_${item.timestamp}_${item.id}")
                    put("deviceName", android.os.Build.MODEL ?: "هاتف محمول")
                }
                val rawBody = payload.toString()

                val toSign = "POST" + path + timestamp + nonce + rawBody
                val signature = hmacSha256(toSign, deviceSecret)

                connection = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                    setRequestProperty("x-device-id", deviceId)
                    setRequestProperty("x-timestamp", timestamp.toString())
                    setRequestProperty("x-nonce", nonce)
                    setRequestProperty("x-signature", signature)
                    setRequestProperty("x-device-secret", deviceSecret)
                    connectTimeout = 8000
                    readTimeout = 8000
                    doOutput = true
                }

                OutputStreamWriter(connection.outputStream, "UTF-8").use { writer ->
                    writer.write(rawBody)
                    writer.flush()
                }

                val responseCode = connection.responseCode
                if (responseCode in 200..299 || responseCode == 409) {
                    success = true
                    updateMessageStatus(context, item.id, "SYNCED", null)
                    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                    val count = prefs.getInt(KEY_TOTAL_SENT, 0) + 1
                    prefs.edit().putInt(KEY_TOTAL_SENT, count).apply()
                    Log.i(TAG, "Message ${item.id} synchronized successfully with Windows PC!")
                } else {
                    errStr = "استجاب السيرفر برمز $responseCode"
                    updateMessageStatus(context, item.id, "FAILED", errStr)
                }
            } catch (e: Exception) {
                errStr = e.message ?: "خطأ في الشبكة"
                updateMessageStatus(context, item.id, "FAILED", errStr)
            } finally {
                connection?.disconnect()
                onComplete(success)
            }
        }
    }

    // Flush all pending / failed messages from queue
    fun flushOutbox(context: Context, onComplete: ((syncedCount: Int, failedCount: Int) -> Unit)? = null) {
        executor.execute {
            val all = getAllMessages(context)
            val pendingList = all.filter { it.status != "SYNCED" }
            if (pendingList.isEmpty()) {
                mainHandler.post { onComplete?.invoke(0, 0) }
                return@execute
            }

            var synced = 0
            var failed = 0

            for (msg in pendingList) {
                val doneSignal = java.util.concurrent.CountDownLatch(1)
                sendSingleMessage(context, msg) { ok ->
                    if (ok) synced++ else failed++
                    doneSignal.countDown()
                }
                try {
                    doneSignal.await(9, java.util.concurrent.TimeUnit.SECONDS)
                } catch (e: Exception) {
                    failed++
                }
            }

            mainHandler.post {
                onComplete?.invoke(synced, failed)
            }
        }
    }

    fun triggerBackgroundQueueFlush(context: Context) {
        executor.execute {
            flushOutbox(context, null)
        }
    }

    // Helper: Parse any QR payload (JSON, amncash:// URL, http:// URL, or IP string)
    fun parseQrAndPair(context: Context, scannedText: String, onResult: (Boolean, String) -> Unit) {
        val trimmed = scannedText.trim()
        try {
            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                val json = JSONObject(trimmed)
                val serverUrl = json.optString("serverUrl")
                val deviceSecret = json.optString("deviceSecret", "sec_amn_companion_secret")
                val deviceId = json.optString("deviceId", getDeviceId(context))

                if (serverUrl.isNotBlank()) {
                    savePairing(context, serverUrl, deviceId, deviceSecret)
                    pairWithServer(context, serverUrl, onResult)
                    return
                }
            }

            if (trimmed.startsWith("amncash://pair")) {
                val uri = android.net.Uri.parse(trimmed)
                val server = uri.getQueryParameter("server")
                if (!server.isNullOrBlank()) {
                    pairWithServer(context, server, onResult)
                    return
                }
            }

            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                val base = trimmed.substringBefore("/api/").substringBefore("/connect")
                pairWithServer(context, base, onResult)
                return
            }

            // Plain IP string
            val host = if (trimmed.contains(":")) trimmed else "$trimmed:5500"
            pairWithServer(context, "http://$host", onResult)
        } catch (e: Exception) {
            onResult(false, "تعذر قراءة بيانات الكود: ${e.message}")
        }
    }
}
