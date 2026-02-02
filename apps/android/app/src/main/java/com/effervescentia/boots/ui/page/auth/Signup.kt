package com.effervescentia.boots.ui.page.auth

import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.credentials.CredentialManager
import com.effervescentia.boots.client.Client

@Composable
fun Signup() {
  val ctx = LocalContext.current
  val credentialManager = remember { CredentialManager.create(ctx) }

  val signup = {
    val challenge = Client.auth.negotiateSignup()
  }

  Button(onClick = signup) {
    Text("Create Account")
  }
}
