package com.effervescentia.boots.ui.page.auth

import android.util.Log
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.platform.LocalContext
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CreatePublicKeyCredentialResponse
import androidx.credentials.CredentialManager
import com.effervescentia.boots.client.Client
import kotlinx.coroutines.launch

@Composable
fun Signup() {
  val ctx = LocalContext.current
  val scope = rememberCoroutineScope()
  val credentialManager = remember { CredentialManager.create(ctx) }

  Button(onClick = {
    scope.launch {
      val res = Client.auth.negotiateSignup().execute()
      if (!res.isSuccessful || res.body() == null) throw Error("Failed to negotiate signup")

      val registration = res.body().toString()
      val credential = credentialManager.createCredential(
        ctx,
        CreatePublicKeyCredentialRequest(registration)
      )

      when (credential) {
        is CreatePublicKeyCredentialResponse -> {
          val res = Client.auth.verifySignup(credential.registrationResponseJson).execute()
          if (!res.isSuccessful || res.body() == null) throw Error("Failed to verify signup")

          Log.w("Signup", res.body()?.account?.username.orEmpty())
        }

        else -> throw Error("Unsupported credential type")
      }
    }
  }) {
    Text("Create Account")
  }
}
