package com.wingsfly

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Notification
import android.content.Context
import android.os.Build
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import android.util.Log
import java.util.*
import android.app.AlarmManager

class TimerService : Service() {
    companion object {
        const val ACTION_START = "com.wingsfly.START_TIMER"
        const val ACTION_STOP = "com.wingsfly.STOP_TIMER"
        private const val CHANNEL_ID = "timer_channel"
        private const val NOTIFICATION_ID = 1
        private const val WAKE_LOCK_TAG = "TimerService::WakeLock"
        private const val TAG = "WINGSFLY_TIMER"
        
        @Volatile
        private var runningTaskId: String? = null
        
        @Volatile
        private var runningTaskInfo: TaskInfo? = null

        fun isTaskRunning(taskId: String): Boolean {
            Log.d(TAG, "Checking if task is running: $taskId, current=$runningTaskId")
            return runningTaskId == taskId
        }

        fun getRunningTaskInfo(): TaskInfo? {
            Log.d(TAG, "Getting running task info: $runningTaskInfo")
            return runningTaskInfo
        }

        data class TaskInfo(
            val taskId: String,
            val title: String,
            val description: String = "",
            val status: String = "in_progress",
            val priority: String = "MEDIUM",
            val category: String = "task",
            val type: String = "task",
            val parentTitle: String = "",
            val scheduledDate: Date = Date(),
            val scheduledTime: String = "00:00",
            val duration: Int = 0,
            val timeElapsed: Long = 0L
        )
    }

    private var serviceScope: CoroutineScope? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var notificationManager: NotificationManager? = null
    private var isRunning = false
    private var job: Job? = null
    private var currentTaskId: String? = null
    private var elapsedTime = 0L
    private var taskTitle: String? = null

    override fun onCreate() {
        super.onCreate()
        try {
            serviceScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
            notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            createNotificationChannel()
            acquireWakeLock()
        } catch (e: Exception) {
            Log.e(TAG, "Error in onCreate: ${e.message}", e)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        try {
            when (intent?.action) {
                ACTION_START -> {
                    val taskId = intent.getStringExtra("taskId") ?: return START_NOT_STICKY
                    val title = intent.getStringExtra("title") ?: "Task in Progress"
                    val description = intent.getStringExtra("description") ?: ""

                    currentTaskId = taskId
                    runningTaskId = taskId
                    taskTitle = title
                    elapsedTime = 0 // Reset elapsed time

                    runningTaskInfo = TaskInfo(
                        taskId = taskId,
                        title = title,
                        description = description,
                        status = "running",
                        priority = "medium",
                        category = "task",
                        type = "timer",
                        parentTitle = "",
                        scheduledTime = "",
                        duration = 0,
                        timeElapsed = 0L
                    )

                    startForeground(NOTIFICATION_ID, createNotification(title, description))
                    
                    isRunning = true
                    startBackgroundWork()
                }
                ACTION_STOP -> {
                    currentTaskId = null
                    runningTaskId = null
                    runningTaskInfo = null
                    isRunning = false
                    job?.cancel()
                    job = null
                    elapsedTime = 0L
                    taskTitle = null
                }
                else -> {
                    if (intent?.action == "STOP_TIMER") {
                        stopSelf()
                        return START_NOT_STICKY
                    }

                    val taskId = intent?.getStringExtra("taskId")
                    val title = intent?.getStringExtra("title")
                    val message = intent?.getStringExtra("message")

                    currentTaskId = taskId
                    runningTaskId = taskId
                    taskTitle = title
                    elapsedTime = 0 // Reset elapsed time

                    runningTaskInfo = TaskInfo(
                        taskId = taskId ?: "",
                        title = title ?: "",
                        description = message ?: "",
                        category = "task",
                        type = "task",
                        priority = "MEDIUM",
                        scheduledTime = "00:00",
                        duration = 30,
                        timeElapsed = elapsedTime
                    )

                    startForeground(NOTIFICATION_ID, createNotification())
                    
                    isRunning = true
                    startBackgroundWork()
                }
            }
            return START_STICKY
        } catch (e: Exception) {
            Log.e(TAG, "[TimerService] Error in onStartCommand: ${e.message}", e)
            return START_NOT_STICKY
        }
    }

    private fun createNotification(): Notification {
        val mainIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("openTask", currentTaskId)
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, mainIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, TimerService::class.java).apply {
            action = "STOP_TIMER"
            putExtra("taskId", currentTaskId)
        }
        
        val stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val title = taskTitle ?: "Task in progress"
        val timeString = String.format("%02d:%02d", elapsedTime / 60, elapsedTime % 60)
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText("Time elapsed: $timeString")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .setAutoCancel(false)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopPendingIntent)
            .build()
    }

    private fun createNotification(title: String, description: String): android.app.Notification {
        val intent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(description)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()
    }

    private fun startBackgroundWork() {
        serviceScope?.launch(Dispatchers.Default) {
            try {
                while (isRunning) {
                    delay(1000)
                    elapsedTime++
                    Log.d(TAG, "[TimerService] Elapsed time: $elapsedTime")
                    runningTaskInfo = runningTaskInfo?.copy(timeElapsed = elapsedTime)
                    updateNotification()
                }
            } catch (e: Exception) {
                Log.e(TAG, "[TimerService] Error in background work: ${e.message}", e)
            }
        }
    }

    private fun updateNotification() {
        try {
            val notification = createNotification()
            notificationManager?.notify(NOTIFICATION_ID, notification)
        } catch (e: Exception) {
            Log.e(TAG, "[TimerService] Error updating notification: ${e.message}", e)
        }
    }

    private fun formatTime(seconds: Long): String {
        val minutes = seconds / 60
        val remainingSeconds = seconds % 60
        return String.format("%02d:%02d", minutes, remainingSeconds)
    }

    private fun acquireWakeLock() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                WAKE_LOCK_TAG
            ).apply {
                setReferenceCounted(false)
                acquire(10 * 60 * 1000L)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error acquiring wake lock: ${e.message}", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Timer Service",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Keeps track of ongoing tasks"
                    setShowBadge(false)
                    enableLights(false)
                    enableVibration(false)
                }
                notificationManager?.createNotificationChannel(channel)
            } catch (e: Exception) {
                Log.e(TAG, "Error creating notification channel: ${e.message}", e)
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onTaskRemoved(rootIntent: Intent?) {
        Log.d(TAG, "[TimerService] Task removed from recents, keeping service alive")
        // Create a restart intent
        val restartIntent = Intent(applicationContext, TimerService::class.java).apply {
            putExtra("taskId", currentTaskId)
            putExtra("title", taskTitle)
        }
        
        // Restart the service if it gets killed
        val pendingIntent = PendingIntent.getService(
            applicationContext, 
            1, 
            restartIntent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.set(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + 1000, pendingIntent)
        
        super.onTaskRemoved(rootIntent)
    }

    override fun onDestroy() {
        try {
            Log.d(TAG, "[TimerService] Service being destroyed, isRunning=$isRunning")
            if (isRunning) {
                // If still running, try to restart the service
                val restartIntent = Intent(applicationContext, TimerService::class.java).apply {
                    putExtra("taskId", currentTaskId)
                    putExtra("title", taskTitle)
                }
                startService(restartIntent)
            }
            
            isRunning = false
            runningTaskId = null
            currentTaskId = null
            runningTaskInfo = null
            job?.cancel()
            job = null
            serviceScope?.cancel()
            serviceScope = null
            
            wakeLock?.let {
                if (it.isHeld) {
                    try {
                        it.release()
                    } catch (e: Exception) {
                        Log.e(TAG, "[TimerService] Error releasing wake lock: ${e.message}", e)
                    }
                }
            }
            wakeLock = null
            
            stopForeground(true)
            super.onDestroy()
        } catch (e: Exception) {
            Log.e(TAG, "[TimerService] Error in onDestroy: ${e.message}", e)
            super.onDestroy()
        }
    }
} 