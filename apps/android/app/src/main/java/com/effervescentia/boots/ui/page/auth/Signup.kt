package com.effervescentia.boots.ui.page.auth

import android.content.Context
import android.util.Log
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CreatePublicKeyCredentialResponse
import androidx.credentials.CredentialManager
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.effervescentia.boots.client.Client
import com.effervescentia.boots.client.jsonContentType
import kotlinx.coroutines.launch
import okhttp3.RequestBody.Companion.toRequestBody

class SignupState : ViewModel() {
  fun signup(ctx: Context) {
    val client = Client(ctx)

    viewModelScope.launch {
      try {
        val registration = client.auth.negotiateSignup().string()
        Log.w("Signup", "registration $registration")

        val credential = CredentialManager.create(ctx)
          .createCredential(ctx, CreatePublicKeyCredentialRequest(registration))

        when (credential) {
          is CreatePublicKeyCredentialResponse -> {
            Log.w(
              "Signup",
              "CreatePublicKeyCredentialResponse: ${credential.registrationResponseJson}"
            )
            val verification = credential.registrationResponseJson.toRequestBody(jsonContentType)
            val result = client.auth.verifySignup(verification)

            Log.w("Signup", "Username ${result.account.username}")
          }

          else -> throw Error("Unsupported credential type")
        }
      } catch (e: Exception) {
        Log.w("Signup", "error caught")
        Log.w("Signup", e)
      }
    }
  }
}

@Composable
fun Signup(state: SignupState = SignupState()) {
  val ctx = LocalContext.current

  Column {
    Button(onClick = { state.signup(ctx) }) {
      Text("Create Account")
    }
  }
}
