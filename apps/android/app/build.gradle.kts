plugins {
  alias(libs.plugins.android.application)
  alias(libs.plugins.compose.compiler)
  alias(libs.plugins.google.services)
  kotlin("plugin.serialization") version "2.3.0"
}

android {
  namespace = "com.effervescentia.boots"
  compileSdk {
    version = release(36)
  }

  defaultConfig {
    applicationId = "com.effervescentia.boots"
    minSdk = 24
    targetSdk = 36
    versionCode = 1
    versionName = "1.0"

    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
  }

  buildFeatures {
    compose = true
  }
  buildTypes {
    release {
      isMinifyEnabled = false
      proguardFiles(
        getDefaultProguardFile("proguard-android-optimize.txt"),
        "proguard-rules.pro"
      )
    }
  }
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
  }
}

dependencies {
  val composeBom = platform(libs.androidx.compose.bom)
  implementation(composeBom)
  androidTestImplementation(composeBom)

  implementation(libs.kotlinx.serialization.json)

  implementation(platform(libs.firebase.bom))
  implementation(libs.firebase.messaging)

  implementation(libs.retrofit)
  implementation(libs.retrofit.converter.kotlinx.serialization)

  implementation(libs.androidx.activity)
  implementation(libs.androidx.activity.compose)
  implementation(libs.androidx.appcompat)
  implementation(libs.androidx.compose.navigation)
  implementation(libs.androidx.constraintlayout)
  implementation(libs.androidx.core.ktx)
  implementation(libs.androidx.material3)
  implementation(libs.androidx.ui.tooling.preview)
  implementation(libs.androidx.credentials)
  implementation(libs.androidx.credentials.auth)
  debugImplementation(libs.androidx.ui.tooling)
  androidTestImplementation(libs.androidx.junit)
  androidTestImplementation(libs.androidx.espresso.core)

  implementation(libs.material)
  testImplementation(libs.junit)

}
