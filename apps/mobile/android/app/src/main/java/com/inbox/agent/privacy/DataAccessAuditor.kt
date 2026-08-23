package com.inbox.agent.privacy

import android.app.AppOpsManager
import android.app.AsyncNotedAppOp
import android.app.SyncNotedAppOp
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi

object DataAccessAuditor {
  @RequiresApi(Build.VERSION_CODES.R)
  fun install(context: Context) {
    val appOps = context.getSystemService(AppOpsManager::class.java)
    appOps.setOnOpNotedCallback(context.mainExecutor, object : AppOpsManager.OnOpNotedCallback() {
      override fun onNoted(op: SyncNotedAppOp) { log("synced", op.op) }
      override fun onSelfNoted(op: SyncNotedAppOp) { log("self", op.op) }
      override fun onAsyncNoted(op: AsyncNotedAppOp) { log("async", op.op) }
    })
  }

  private fun log(kind: String, op: String) {
    Log.i("InboxAgentPrivacy", "Data access: $kind / $op")
  }
}
