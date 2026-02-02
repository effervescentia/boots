package com.effervescentia.boots.client

import kotlinx.serialization.Serializable
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

@Serializable
data class SignupChallengeResponse(val challenge: String)

@Serializable
data class VerifySignupRequest(val challenge: String)

@Serializable
data class AuthenticatedResponse(val challenge: String)

interface AuthClient {
  @POST("auth/android/signup/negotiate")
  suspend fun negotiateSignup(): Call<SignupChallengeResponse>

  @POST("auth/android/signup/verify")
  suspend fun verifySignup(@Body body: VerifySignupRequest): Call<AuthenticatedResponse>
}
