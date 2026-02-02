package com.effervescentia.boots.client.auth

import kotlinx.serialization.Serializable

@Serializable
data class NegotiateSignupRegistrationPubKeyCredParam(
  val alg: Int,
  val type: String,
)

@Serializable
data class NegotiateSignupRegistrationExtension(
  val appid: String?,
  val credProps: Boolean?,
  val hmacCreateSecret: Boolean?,
  val minPinLength: Boolean?,
)

@Serializable
data class NegotiateSignupRegistrationCredentialExclude(
  val id: String,
  val type: String,
  val transports: List<String>?,
)

@Serializable
data class NegotiateSignupRegistrationAuthenticatorSelection(
  val authenticatorAttachment: String?,
  val requireResidentKey: Boolean?,
  val residentKey: String?,
  val userVerification: String?,
)

@Serializable
data class NegotiateSignupRegistrationRp(
  val id: String?,
  val name: String,
)

@Serializable
data class NegotiateSignupRegistrationUser(
  val id: String,
  val name: String,
  val displayName: String,
)

@Serializable
data class NegotiateSignupRegistration(
  val challenge: String,
  val attestation: String?,
  val attestationFormats: List<String>?,
  val hints: List<String>?,
  val timeout: Int?,
  val rp: NegotiateSignupRegistrationRp,
  val user: NegotiateSignupRegistrationUser,
  val authenticatorSelection: NegotiateSignupRegistrationAuthenticatorSelection?,
  val excludeCredentials: List<NegotiateSignupRegistrationCredentialExclude>?,
  val extensions: List<NegotiateSignupRegistrationExtension>?,
  val pubKeyCredParams: List<NegotiateSignupRegistrationPubKeyCredParam>,
)


@Serializable
data class SignupChallengeResponse(val registration: NegotiateSignupRegistration)
