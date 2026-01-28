package com.effervescentia.boots.ui.page.home.component

import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun AddHeartbeatButton(onClick: () -> Unit) {
    Button(onClick = onClick) {
        Text("Add Heartbeat")
    }
}
