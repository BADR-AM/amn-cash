package com.amn.cash.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.amn.cash.MainActivity
import com.amn.cash.network.WindowsApiClient

class CollectorForegroundService : Service() {

    companion object {
        private const val TAG = "CollectorService"
        private const val CHANNEL_ID = "amn_cash_channel"
        private const val NOTIFICATION_ID = 101

        fun startService(context: Context) {
            val intent = Intent(context, CollectorForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, CollectorForegroundService::class.java)
            context.stopService(intent)
        }
    }

    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false

    private val queueRunnable = object : Runnable {
        override fun run() {
            if (!isRunning) return
            try {
                val pendingCount = WindowsApiClient.getPendingCount(applicationContext)
                if (pendingCount > 0) {
                    Log.i(TAG, "Found $pendingCount pending messages in Outbox. Flushing now...")
                    WindowsApiClient.flushOutbox(applicationContext) { synced, failed ->
                        updateNotification(synced, failed)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Queue worker error: ${e.message}")
            }
            handler.postDelayed(this, 7000) // check every 7 seconds
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification(0, 0)
        startForeground(NOTIFICATION_ID, notification)

        isRunning = true
        handler.removeCallbacks(queueRunnable)
        handler.post(queueRunnable)

        return START_STICKY
    }

    override fun onDestroy() {
        isRunning = false
        handler.removeCallbacks(queueRunnable)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "AMN Cash Background Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "خدمة المزامنة الحية وطابور رسائل فودافون كاش"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun updateNotification(lastSynced: Int, lastFailed: Int) {
        val manager = getSystemService(NotificationManager::class.java) ?: return
        val notif = buildNotification(lastSynced, lastFailed)
        manager.notify(NOTIFICATION_ID, notif)
    }

    private fun buildNotification(synced: Int, failed: Int): Notification {
        val pendingCount = WindowsApiClient.getPendingCount(applicationContext)
        val totalSent = WindowsApiClient.getTotalSent(applicationContext)

        val subText = if (pendingCount > 0) {
            "⚠️ يوجد $pendingCount رسائل معلقة جاري محاولة إرسالها للكمبيوتر"
        } else {
            "✓ جميع الرسائل متزامنة مع الكمبيوتر ($totalSent عملية)"
        }

        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AMN Cash متصل ويعمل")
            .setContentText(subText)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setOngoing(true)
            .setContentIntent(pIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
