package com.effervescentia.boots.ui.page.home

import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.effervescentia.boots.ui.app.HeartbeatPermissionPage
import com.effervescentia.boots.ui.app.LocalNav
import com.effervescentia.boots.ui.app.SignupPage

@Composable
fun Home() {
  val nav = LocalNav.current

  Text("Hello World")
  Button(onClick = {
    nav?.navigate(HeartbeatPermissionPage)
  }) {
    Text("Add Heartbeat")
  }
  Button(onClick = {
    nav?.navigate(SignupPage)
  }) {
    Text("Signup")
  }
}
