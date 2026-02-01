package com.effervescentia.boots.service

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class FirebaseService : FirebaseMessagingService() {

  override fun onNewToken(token: String) {
    Log.w("FirebaseService", "new token: $token")
  }

  override fun onMessageReceived(message: RemoteMessage) {
    val type = message.messageType
    Log.w("FirebaseService", "received $type message")
  }

}
