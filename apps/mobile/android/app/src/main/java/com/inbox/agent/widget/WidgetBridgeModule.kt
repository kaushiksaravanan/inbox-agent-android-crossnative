package com.inbox.agent.widget

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "InboxWidgetBridge"

    @ReactMethod
    fun setTasks(json: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(
                "InboxAgentWidget",
                android.content.Context.MODE_PRIVATE
            )
            prefs.edit().putString("tasks_json", json).apply()
            val intent = android.content.Intent(TasksWidget.ACTION_WIDGET_REFRESH).apply {
                setPackage(reactApplicationContext.packageName)
            }
            reactApplicationContext.sendBroadcast(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WIDGET", e.message, e)
        }
    }
}
