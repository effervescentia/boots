package com.effervescentia.boots.ui.page.home

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.effervescentia.boots.ui.app.HeartbeatPermissionPage
import com.effervescentia.boots.ui.app.LocalNav
import com.effervescentia.boots.ui.page.home.component.AddHeartbeatButton

@Composable
fun Home() {
  val nav = LocalNav.current

  Text("Hello World")
  AddHeartbeatButton(onClick = {
    nav?.navigate(HeartbeatPermissionPage)
  })
}
