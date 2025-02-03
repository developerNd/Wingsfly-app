package com.wingsfly

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = TimerModule.NAME)
class TimerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "TimerModule"
    }

    private val CHANNEL_ID = "timer_channel"
    private val NOTIFICATION_ID = 1

    override fun getName(): String = NAME

    @ReactMethod
    fun startForegroundService(taskId: String, title: String, description: String, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, TimerService::class.java).apply {
                action = TimerService.ACTION_START
                putExtra("taskId", taskId)
                putExtra("title", title)
                putExtra("description", description)
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to start timer service: ${e.message}")
        }
    }

    @ReactMethod
    fun stopForegroundService(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, TimerService::class.java)
            reactApplicationContext.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun isTaskRunning(taskId: String, promise: Promise) {
        try {
            val isRunning = TimerService.isTaskRunning(taskId)
            promise.resolve(isRunning)
        } catch (e: Exception) {
            promise.reject("ERROR", "Error checking task status: ${e.message}")
        }
    }

    @ReactMethod
    fun getRunningTaskInfo(promise: Promise) {
        try {
            val taskInfo = TimerService.getRunningTaskInfo()
            if (taskInfo != null) {
                val map = Arguments.createMap().apply {
                    putString("taskId", taskInfo.taskId)
                    putString("title", taskInfo.title)
                    putString("description", taskInfo.description)
                    putString("status", taskInfo.status)
                    putString("priority", taskInfo.priority)
                    putString("category", taskInfo.category)
                    putString("type", taskInfo.type)
                    putString("parentTitle", taskInfo.parentTitle)
                    putString("scheduledTime", taskInfo.scheduledTime)
                    putInt("duration", taskInfo.duration)
                    putDouble("timeElapsed", taskInfo.timeElapsed.toDouble())
                }
                promise.resolve(map)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
} 