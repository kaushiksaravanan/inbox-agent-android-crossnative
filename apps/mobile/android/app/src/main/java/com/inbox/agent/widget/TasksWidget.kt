package com.inbox.agent.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import com.inbox.agent.R
import org.json.JSONArray

class TasksWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_WIDGET_REFRESH) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(ComponentName(context, TasksWidget::class.java))
            for (id in ids) {
                updateAppWidget(context, mgr, id)
            }
        }
    }

    companion object {
        const val ACTION_WIDGET_REFRESH = "com.inbox.agent.WIDGET_REFRESH"
        private const val PREFS_NAME = "InboxAgentWidget"
        private const val PREFS_KEY = "tasks_json"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.tasks_widget)

            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val json = prefs.getString(PREFS_KEY, "[]") ?: "[]"

            val rowContainers = intArrayOf(R.id.row0, R.id.row1, R.id.row2)
            val titleIds = intArrayOf(R.id.title0, R.id.title1, R.id.title2)
            val detailIds = intArrayOf(R.id.detail0, R.id.detail1, R.id.detail2)
            val timeIds = intArrayOf(R.id.time0, R.id.time1, R.id.time2)
            val dotIds = intArrayOf(R.id.dot0, R.id.dot1, R.id.dot2)

            try {
                val arr = JSONArray(json)
                val count = minOf(arr.length(), 3)
                for (i in 0 until 3) {
                    if (i < count) {
                        val obj = arr.getJSONObject(i)
                        views.setViewVisibility(rowContainers[i], View.VISIBLE)
                        views.setTextViewText(titleIds[i], obj.optString("title", ""))
                        views.setTextViewText(detailIds[i], obj.optString("detail", ""))
                        views.setTextViewText(timeIds[i], obj.optString("time", ""))
                        val priority = obj.optString("priority", "low").lowercase()
                        val dotColor = when (priority) {
                            "high", "urgent" -> 0xFFE53935.toInt()
                            "medium", "med" -> 0xFFFB8C00.toInt()
                            else -> 0xFF43A047.toInt()
                        }
                        views.setInt(dotIds[i], "setBackgroundColor", dotColor)
                    } else {
                        views.setViewVisibility(rowContainers[i], View.GONE)
                    }
                }
            } catch (e: Exception) {
                for (i in 0 until 3) {
                    views.setViewVisibility(rowContainers[i], View.GONE)
                }
            }

            val deepLink = Uri.parse("inbox-agent://tasks?focus=widget")
            val launchIntent = Intent(Intent.ACTION_VIEW, deepLink).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val flags = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId,
                launchIntent,
                flags
            )
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
