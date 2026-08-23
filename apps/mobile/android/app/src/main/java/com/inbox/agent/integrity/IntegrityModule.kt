package com.inbox.agent.integrity

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.play.core.integrity.StandardIntegrityManager
import com.google.android.play.core.integrity.StandardIntegrityManager.PrepareIntegrityTokenRequest
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityTokenProvider
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityTokenRequest
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.inbox.agent.BuildConfig

/**
 * React Native native module exposing Google Play Integrity API.
 *
 * Best-effort attestation: returns a token when Play Integrity can vouch for
 * the install. For sideloaded APKs the verdict will not be PLAY_RECOGNIZED;
 * callers should treat the token as a trust boost, not a hard gate.
 */
class IntegrityModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "InboxIntegrity"

    @Volatile
    private var tokenProvider: StandardIntegrityTokenProvider? = null

    @ReactMethod
    fun requestIntegrityToken(nonce: String, promise: Promise) {
        try {
            val projectNumber: Long = BuildConfig.GCP_PROJECT_NUMBER
            if (projectNumber <= 0L) {
                promise.reject(
                    "ERR_NO_PROJECT_NUMBER",
                    "GCP_PROJECT_NUMBER is not configured in BuildConfig"
                )
                return
            }

            val manager: StandardIntegrityManager =
                IntegrityManagerFactory.createStandard(reactContext)

            val cachedProvider = tokenProvider
            if (cachedProvider != null) {
                requestWithProvider(cachedProvider, nonce, promise)
                return
            }

            manager.prepareIntegrityToken(
                PrepareIntegrityTokenRequest.builder()
                    .setCloudProjectNumber(projectNumber)
                    .build()
            )
                .addOnSuccessListener { provider ->
                    tokenProvider = provider
                    requestWithProvider(provider, nonce, promise)
                }
                .addOnFailureListener { e ->
                    promise.reject("ERR_PREPARE_INTEGRITY", e.message, e)
                }
        } catch (t: Throwable) {
            promise.reject("ERR_INTEGRITY", t.message, t)
        }
    }

    private fun requestWithProvider(
        provider: StandardIntegrityTokenProvider,
        nonce: String,
        promise: Promise
    ) {
        try {
            provider.request(
                StandardIntegrityTokenRequest.builder()
                    .setRequestHash(nonce)
                    .build()
            )
                .addOnSuccessListener { response ->
                    promise.resolve(response.token())
                }
                .addOnFailureListener { e ->
                    promise.reject("ERR_REQUEST_TOKEN", e.message, e)
                }
        } catch (t: Throwable) {
            promise.reject("ERR_REQUEST_TOKEN", t.message, t)
        }
    }
}
