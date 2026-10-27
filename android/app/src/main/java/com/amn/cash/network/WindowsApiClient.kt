package com.amn.cash.network

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import java.util.concurrent.Executors
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

object WindowsApiClient {
    private const val TAG = "WindowsApiClient"
    private const val PREFS_NAME = "amn_cash_prefs"
    private const val KEY_SERVER_URL = "server_url"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_DEVICE_SECRET = "device_secret"
    private const val KEY_TOTAL_SENT = "total_sent"

    private val executor = Executors.newSingleThreadExecutor()

    fun savePairing(context: Context, serverUrl: String, deviceId: String, deviceSecret: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_SERVER_URL, serverUrl)
            .putString(KEY_DEVICE_ID, deviceId)
            .putString(KEY_DEVICE_SECRET, deviceSecret)
            .apply()
        Log.i(TAG, "Pairing saved: Server=$serverUrl DeviceId=$deviceId")
    }

    fun getServerUrl(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_SERVER_URL, "") ?: ""
    }

    fun getDeviceId(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_DEVICE_ID, android.os.Build.MODEL ?: "Android_Phone") ?: "Android_Phone"
    }

    fun getDeviceSecret(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_DEVICE_SECRET, "sim_secret_amn_internal_2026") ?: "sim_secret_amn_internal_2026"
    }

    fun getTotalSent(context: Context): Int {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getInt(KEY_TOTAL_SENT, 0)
    }

    private fun hmacSha256(data: String, key: String): String {
        val algorithm = "HmacSHA256"
        val secretKeySpec = SecretKeySpec(key.toByteArray(Charsets.UTF_8), algorithm)
        val mac = Mac.getInstance(algorithm)
        mac.init(secretKeySpec)
        val bytes = mac.doFinal(data.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }

    fun sendSmsEvent(context: Context, smsText: String, onResult: ((Boolean) -> Unit)? = null) {
        val serverUrl = getServerUrl(context)
        if (serverUrl.isBlank()) {
            Log.w(TAG, "Cannot send SMS: No Windows server paired yet.")
            onResult?.invoke(false)
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

                // Calculate HMAC-SHA256 signature: method + path + timestamp + nonce + rawBody
                val toSign = "POST" + path + timestamp + nonce + rawBody
                val signature = hmacSha256(toSign, deviceSecret)

                connection = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                    setRequestProperty("x-device-id", deviceId)
                    setRequestProperty("x-timestamp", timestamp.toString())
                    setRequestProperty("x-nonce", nonce)
                    setRequestProperty("x-signature", signature)
                    connectTimeout = 5000
                    readTimeout = 5000
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
                onResult?.invoke(success)
            }
        }
    }
}
