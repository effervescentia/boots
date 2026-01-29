package com.effervescentia.boots.ui.page.heartbeat

import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import com.effervescentia.boots.service.NotificationChannel
import com.effervescentia.boots.service.NotificationService

@Composable
fun Heartbeat() {
  val ctx = LocalContext.current
  val notification = remember { NotificationService(ctx) }

  Text("Heartbeat!")
  Button(onClick = { notification.send(NotificationChannel.General) }) {
    Text("Send Notification")
  }
}
