package com.effervescentia.boots.ui.page.auth

import android.content.Context
import android.util.Log
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CredentialManager
import androidx.credentials.exceptions.domerrors.SecurityError
import androidx.credentials.exceptions.publickeycredential.CreatePublicKeyCredentialDomException
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.effervescentia.boots.client.Client
import kotlinx.coroutines.launch

class SignupState : ViewModel() {
  fun signup(ctx: Context) {
    viewModelScope.launch {
      try {
        val registration = Client.auth.negotiateSignup().string()
        Log.w("Signup", "registration $registration")

        val credential = CredentialManager.create(ctx).createCredential(
          ctx,
          CreatePublicKeyCredentialRequest(registration)
        )

//        when (credential) {
//          is CreatePublicKeyCredentialResponse -> {
//            val res = Client.auth.verifySignup(credential.registrationResponseJson).execute()
//            if (!res.isSuccessful || res.body() == null) throw Error("Failed to verify signup")
//
//            Log.w("Signup", res.body()?.account?.username.orEmpty())
//          }
//
//          else -> throw Error("Unsupported credential type")
//        }
      } catch (e: Exception) {
        Log.w("Signup", "error caught")
        Log.w("Signup", e)

        when (e) {
          is CreatePublicKeyCredentialDomException -> {
            Log.w("Signup", "CreatePublicKeyCredentialDomException")
            Log.w("Signup", e.message.orEmpty())

            when (e.domError) {
              is SecurityError -> {
                Log.w("Signup", "SecurityError")
                Log.w("Signup", e.domError.type)
              }
            }
          }
        }
//        Log.w("Signup", e)
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
