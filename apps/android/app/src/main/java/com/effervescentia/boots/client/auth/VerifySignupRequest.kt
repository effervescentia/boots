package com.effervescentia.boots.client.auth

import kotlinx.serialization.Serializable

@Serializable
data class PasskeyExtensionCredProps(
  val rk: Boolean?,
)

@Serializable
data class PasskeyExtensionLargeBlob(
  val blob: String?,
  val supported: Boolean?,
  val written: Boolean?,
)

@Serializable
data class PasskeyExtensionPrfResults(
  val first: String,
  val second: String?,
)

@Serializable
data class PasskeyExtensionPrf(
  val blob: String?,
  val results: PasskeyExtensionPrfResults?,
)

@Serializable
data class PasskeyExtensionResults(
  val appid: Boolean?,
  val hmacCreateSecret: Boolean?,
  val credProps: PasskeyExtensionCredProps?,
  val largeBlob: PasskeyExtensionLargeBlob?,
  val prf: PasskeyExtensionPrf?,
)

@Serializable
data class PasskeyRegistrationResponse(
  val attestationObject: String,
  val authenticatorData: String,
  val clientDataJSON: String,
  val publicKey: String,
  val publicKeyAlgorithm: Int,
  val transports: List<String>,
)

@Serializable
data class VerifySignupRegistrationUser(
  val id: String?,
  val name: String,
  val displayName: String?,
)

@Serializable
data class VerifySignupRegistration(
  val type: String,
  val id: String,
  val rawId: String,
  val authenticatorAttachment: String?,
  val clientExtensionResults: PasskeyExtensionResults,
  val response: PasskeyRegistrationResponse,
  val user: VerifySignupRegistrationUser,
)

@Serializable
data class VerifySignupRequest(val registration: VerifySignupRegistration)
