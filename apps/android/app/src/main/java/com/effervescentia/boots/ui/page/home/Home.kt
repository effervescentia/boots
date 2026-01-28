package com.effervescentia.boots.ui.page.home

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.effervescentia.boots.ui.app.AppContext
import com.effervescentia.boots.ui.app.HeartbeatPermissionPage
import com.effervescentia.boots.ui.page.home.component.AddHeartbeatButton

@Composable
fun Home(ctx: AppContext) {
  Text("Hello World")
  AddHeartbeatButton(onClick = {
    ctx.navController.navigate(HeartbeatPermissionPage)
  })
}
