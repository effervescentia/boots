package com.effervescentia.boots.ui.app

import android.Manifest
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
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

val LocalNav = staticCompositionLocalOf<NavHostController?> { null }

@Composable
fun App() {
  val nav = rememberNavController()

  CompositionLocalProvider(LocalNav provides nav) {
    NavHost(nav, startDestination = HomePage) {
      composable<HomePage> { Home() }
      composable<HeartbeatPage> { Heartbeat() }
      composable<HeartbeatPermissionPage> {
        PermissionGate(
          permission = Manifest.permission.POST_NOTIFICATIONS,
          callback = { result ->
            result
              .onSuccess { nav.navigate(HeartbeatPage) }
              .onFailure {
                println("Failed to get permissions")
                nav.popBackStack()
              }
          }
        )
      }
    }
  }
}
