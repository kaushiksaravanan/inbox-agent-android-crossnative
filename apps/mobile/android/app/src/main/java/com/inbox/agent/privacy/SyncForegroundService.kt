package com.inbox.agent.privacy

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.inbox.agent.R

class SyncForegroundService : Service() {
  companion object {
    const val CHANNEL_ID = "inbox-agent-sync"
    const val NOTIF_ID = 9101
    const val ACTION_START = "com.inbox.agent.SYNC_START"
    const val ACTION_STOP = "com.inbox.agent.SYNC_STOP"
  }

  override fun onBind(intent: Intent?) = null

  override fun onCreate() {
    super.onCreate()
    ensureChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopForeground(STOP_FOREGROUND_REMOVE)
      stopSelf()
      return START_NOT_STICKY
    }
    val notif = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_inbox_sync)
      .setContentTitle("Inbox Agent")
      .setContentText("Checking for new emails…")
      .setPriority(NotificationCompat.PRIORITY_MIN)
      .setOngoing(true)
      .setShowWhen(false)
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_DEFERRED)
      .build()
    // Use special foreground service type so the system shows the privacy indicator
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(NOTIF_ID, notif, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
    } else {
      startForeground(NOTIF_ID, notif)
    }
    return START_NOT_STICKY
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val mgr = getSystemService(NotificationManager::class.java)
      if (mgr.getNotificationChannel(CHANNEL_ID) == null) {
        val ch = NotificationChannel(
          CHANNEL_ID,
          "Sync activity",
          NotificationManager.IMPORTANCE_MIN
        ).apply {
          description = "Shows when Inbox Agent is checking your email in the background"
          setShowBadge(false)
        }
        mgr.createNotificationChannel(ch)
      }
    }
  }
}
