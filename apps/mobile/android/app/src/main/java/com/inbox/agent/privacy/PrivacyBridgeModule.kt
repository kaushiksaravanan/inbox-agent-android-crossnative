package com.inbox.agent.privacy

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PrivacyBridgeModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "InboxPrivacyBridge"

  @ReactMethod
  fun startSyncIndicator(promise: Promise) {
    try {
      val intent = Intent(reactApplicationContext, SyncForegroundService::class.java)
      intent.action = SyncForegroundService.ACTION_START
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        reactApplicationContext.startForegroundService(intent)
      } else {
        reactApplicationContext.startService(intent)
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("PRIVACY", e.message, e)
    }
  }

  @ReactMethod
  fun stopSyncIndicator(promise: Promise) {
    try {
      val intent = Intent(reactApplicationContext, SyncForegroundService::class.java)
      intent.action = SyncForegroundService.ACTION_STOP
      reactApplicationContext.startService(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("PRIVACY", e.message, e)
    }
  }
}
