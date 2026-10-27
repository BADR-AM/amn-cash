package com.amn.cash.network

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

object WindowsApiClient {
    private const val TAG = "WindowsApiClient"
    private const val PREFS_NAME = "amn_cash_prefs"
    private const val KEY_SERVER_URL = "server_url"
    private const val KEY_AUTH_TOKEN = "auth_token"
    private const val KEY_TOTAL_SENT = "total_sent"

    private val executor = Executors.newSingleThreadExecutor()

    fun savePairing(context: Context, serverUrl: String, authToken: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_SERVER_URL, serverUrl)
            .putString(KEY_AUTH_TOKEN, authToken)
            .apply()
        Log.i(TAG, "Pairing saved: Server=$serverUrl")
    }

    fun getServerUrl(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_SERVER_URL, "") ?: ""
    }

    fun getTotalSent(context: Context): Int {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getInt(KEY_TOTAL_SENT, 0)
    }

    fun sendSmsEvent(context: Context, smsText: String, onResult: ((Boolean) -> Unit)? = null) {
        val serverUrl = getServerUrl(context)
        if (serverUrl.isBlank()) {
            Log.w(TAG, "Cannot send SMS: No Windows server paired yet.")
            onResult?.invoke(false)
            return
        }

        executor.execute {
            var connection: HttpURLConnection? = null
            var success = false
            try {
                val url = URL(serverUrl)
                connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                connection.connectTimeout = 5000
                connection.readTimeout = 5000
                connection.doOutput = true

                val payload = JSONObject().apply {
                    put("smsText", smsText)
                    put("deviceId", android.os.Build.MODEL ?: "Android_Phone")
                    put("eventId", "sms_" + System.currentTimeMillis())
                }

                OutputStreamWriter(connection.outputStream, "UTF-8").use { writer ->
                    writer.write(payload.toString())
                    writer.flush()
                }

                val responseCode = connection.responseCode
                if (responseCode in 200..299) {
                    Log.i(TAG, "SMS successfully synchronized with Windows app!")
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
