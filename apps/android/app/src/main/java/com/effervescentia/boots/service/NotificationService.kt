package com.effervescentia.boots.service

import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.effervescentia.boots.R
import android.app.NotificationChannel as AndroidChannel

enum class NotificationChannel(val id: String, val key: String, val priority: Int) {
  General("general", "General", NotificationManager.IMPORTANCE_DEFAULT)
}

class NotificationService(val ctx: Context) {
  private var nextID = 0

  fun createChannel(channel: NotificationChannel) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    (ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
      .createNotificationChannel(AndroidChannel(channel.id, channel.key, channel.priority))
  }

  fun send(channel: NotificationChannel) {
    createChannel(channel)

    val notification = NotificationCompat.Builder(ctx, channel.id)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle("This is a notification")
      .setContentText("Look at my beautiful details")
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)

    with(NotificationManagerCompat.from(ctx)) {
      if (ActivityCompat.checkSelfPermission(
          ctx,
          Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED
      ) {
        notify(nextID++, notification.build())
      }
    }
  }

}
