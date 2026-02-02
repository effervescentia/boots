package com.effervescentia.boots.client

import com.effervescentia.boots.client.auth.AuthClient
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

private val jsonData = Json { ignoreUnknownKeys = true }
private val retrofit =
  Retrofit.Builder().baseUrl("https://api.boots.localhost").addConverterFactory(
    jsonData.asConverterFactory("application/json".toMediaType())
  ).build()

object Client {
  val auth = retrofit.create(AuthClient::class.java)
}
