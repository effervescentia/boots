package com.effervescentia.boots.ui.app

import android.Manifest
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.effervescentia.boots.ui.gate.PermissionGate
import com.effervescentia.boots.ui.page.heartbeat.Heartbeat
import com.effervescentia.boots.ui.page.home.Home
import kotlinx.serialization.Serializable

@Serializable
object HomePage

@Serializable
object HeartbeatPage

@Serializable
object HeartbeatPermissionPage

data class AppContext(
  val navController: NavHostController,
)

@Composable
fun App() {
  val navController = rememberNavController()
  val ctx = AppContext(navController)

  NavHost(navController, startDestination = HomePage) {
    composable<HomePage> { Home(ctx) }
    composable<HeartbeatPage> { Heartbeat(ctx) }
    composable<HeartbeatPermissionPage> {
      PermissionGate(
        permission = Manifest.permission.POST_NOTIFICATIONS,
        callback = { result ->
          result
            .onSuccess { navController.navigate(HeartbeatPage) }
            .onFailure {
              println("Failed to get permissions")
              navController.popBackStack()
            }
        }
      )
    }
  }
}
