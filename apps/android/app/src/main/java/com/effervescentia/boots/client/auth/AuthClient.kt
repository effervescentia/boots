package com.effervescentia.boots.client.auth

import kotlinx.serialization.Serializable
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.http.Body
import retrofit2.http.POST
import kotlin.time.Instant


@Serializable
data class FamilyWithRole(
  val id: String,
  val name: String,
  val createdAt: Instant,
  val updatedAt: Instant,
  val role: String,
)

@Serializable
data class NetworkWithRole(
  val id: String,
  val name: String,
  val createdAt: Instant,
  val updatedAt: Instant,
  val role: String,
)

@Serializable
data class AccountDetails(
  val id: String,
  val username: String,
  val createdAt: Instant,
  val updatedAt: Instant,
  val deletedAt: Instant?,

  val families: List<FamilyWithRole>,
  val networks: List<NetworkWithRole>,
)

@Serializable
data class AuthenticatedResponse(val account: AccountDetails)

interface AuthClient {
  @POST("auth/android/signup/negotiate")
  suspend fun negotiateSignup(): ResponseBody

  @POST("auth/android/signup/verify")
  suspend fun verifySignup(@Body body: RequestBody): AuthenticatedResponse

  @POST("auth/android/login/negotiate")
  suspend fun negotiateLogin(): ResponseBody

  @POST("auth/android/login/verify")
  suspend fun verifyLogin(@Body body: RequestBody): AuthenticatedResponse
}
