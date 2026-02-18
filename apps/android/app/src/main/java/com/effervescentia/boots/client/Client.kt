package com.effervescentia.boots.client

import android.content.Context
import com.effervescentia.boots.client.auth.AuthClient
import com.franmontiel.persistentcookiejar.PersistentCookieJar
import com.franmontiel.persistentcookiejar.cache.SetCookieCache
import com.franmontiel.persistentcookiejar.persistence.SharedPrefsCookiePersistor
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

private val jsonData = Json { ignoreUnknownKeys = true }

val jsonContentType = "application/json; charset=utf-8".toMediaType()

class Client(ctx: Context) {
  private val retrofit =
    Retrofit
      .Builder()
      .baseUrl("https://api.boots.effervescentia.com")
      .addConverterFactory(jsonData.asConverterFactory(jsonContentType))
      .client(
        OkHttpClient
          .Builder()
          .cookieJar(PersistentCookieJar(SetCookieCache(), SharedPrefsCookiePersistor(ctx)))
          .build()
      )
      .build()

  val auth = retrofit.create(AuthClient::class.java)
}
