package com.effervescentia.boots.ui.gate

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat

private val SUCCESS = Result.success(Unit)

private val MIN_VERSIONS = mapOf(
  Manifest.permission.POST_NOTIFICATIONS to Build.VERSION_CODES.TIRAMISU
)

typealias PermissionCallback = (result: Result<Unit>) -> Unit

class PermissionNotGrantedError(val permission: String) :
  Error("Permission $permission was not granted by user") {
}

private fun isGranted(ctx: Context, permission: String): Boolean {
  return ContextCompat.checkSelfPermission(ctx, permission) == PackageManager.PERMISSION_GRANTED
}

@Composable
fun PermissionGate(
  permission: String,
  callback: PermissionCallback
) {
  val ctx = LocalContext.current;
  val launcher = rememberLauncherForActivityResult(
    ActivityResultContracts.RequestPermission()
  ) { granted ->
    if (granted) callback(SUCCESS) else callback(
      Result.failure(
        PermissionNotGrantedError(permission)
      )
    )
  }

  LaunchedEffect(Unit) {
    val minVersion = MIN_VERSIONS.get(permission);

    if (minVersion != null && Build.VERSION.SDK_INT < minVersion) {
      callback(SUCCESS)
    } else if (isGranted(ctx, permission)) {
      callback(SUCCESS)
    } else {
      launcher.launch(permission)
    }
  }

  Text("We need permission for this feature")
}
