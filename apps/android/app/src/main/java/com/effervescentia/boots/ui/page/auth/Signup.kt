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
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PublicKeyCredential
import androidx.credentials.SignalCurrentUserDetailsRequest
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.effervescentia.boots.client.Client
import com.effervescentia.boots.client.jsonContentType
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.RequestBody.Companion.toRequestBody

class SignupState : ViewModel() {
  fun signup(ctx: Context) {
    val client = Client(ctx)

    viewModelScope.launch {
      try {
        val registration = client.auth.negotiateSignup().string()
        Log.w("Signup", "registration $registration")

        val credentialManager = CredentialManager.create(ctx)
        val credential = credentialManager.createCredential(
          ctx,
          CreatePublicKeyCredentialRequest(registration)
        )

        when (credential) {
          is CreatePublicKeyCredentialResponse -> {
            Log.w(
              "Signup",
              "CreatePublicKeyCredentialResponse: ${credential.registrationResponseJson}"
            )
            Log.w("Signup", "Bundle: ${credential.data}")
            val verification = credential.registrationResponseJson.toRequestBody(jsonContentType)
            val result = client.auth.verifySignup(verification)

            Log.w("Signup", "Username ${result.account.username}")

            val credentialUserDetails = Json.encodeToString(
              buildJsonObject {
                put("rpId", "effervescentia.com")
                put("name", result.account.username)
                put("displayName", result.account.username)
                put(
                  "userId",
                  Json.parseToJsonElement(registration).jsonObject
                    ["user"]?.jsonObject
                    ["id"]?.jsonPrimitive
                    ?.content
                )
              }
            )
            credentialManager.signalCredentialState(
              SignalCurrentUserDetailsRequest(credentialUserDetails)
            )

            Log.w("Signup", "Updated user details $credentialUserDetails")
          }

          else -> throw Error("Unsupported credential type")
        }
      } catch (e: Exception) {
        Log.w("Signup", "error caught")
        Log.w("Signup", e)
      }
    }
  }

  fun login(ctx: Context) {
    val client = Client(ctx)

    viewModelScope.launch {
      try {
        val authentication = client.auth.negotiateLogin().string()
        Log.w("Login", "authentication $authentication")

        val credential = CredentialManager.create(ctx)
          .getCredential(
            ctx,
            GetCredentialRequest(
              listOf(
                GetPublicKeyCredentialOption(authentication)
              )
            )
          ).credential

        when (credential) {
          is PublicKeyCredential -> {
            Log.w(
              "Login",
              "PublicKeyCredential: ${credential.authenticationResponseJson}"
            )
            val verification = credential.authenticationResponseJson.toRequestBody(jsonContentType)
            val result = client.auth.verifyLogin(verification)

            Log.w("Login", "Username ${result.account.username}")
          }

          else -> throw Error("Unsupported credential type")
        }
      } catch (e: Exception) {
        Log.w("Login", "error caught")
        Log.w("Login", e)
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
    Button(onClick = { state.login(ctx) }) {
      Text("Login")
    }
  }
}
