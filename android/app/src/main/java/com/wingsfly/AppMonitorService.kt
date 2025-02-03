package com.wingsfly

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.content.SharedPreferences
import java.util.*
import org.json.JSONArray
import android.content.Context

class AppMonitorService : AccessibilityService() {
    private lateinit var prefs: SharedPreferences
    private val TAG = "AppMonitorService"
    private var temporarilyUnlockedApps = mutableSetOf<String>()
    private var currentApp: String? = null
    private var lastLockTime: Long = 0
    private val LOCK_TIMEOUT = 3000L
    private var isTaskActive = false
    private var appLockTypes = mutableMapOf<String, String>()

    override fun onServiceConnected() {
        super.onServiceConnected()
        prefs = applicationContext.getSharedPreferences("AppLock", MODE_PRIVATE)
        Log.d(TAG, "Service Connected")
        (application as MainApplication).monitorService = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString()
            val className = event.className?.toString()
            
            Log.d(TAG, "Package detected: $packageName")
            Log.d(TAG, "Class detected: $className")
            Log.d(TAG, "Current locked apps: ${prefs.getStringSet("lockedApps", setOf())}")
            Log.d(TAG, "Current app lock types: $appLockTypes")
            
            if (packageName != null && 
                packageName != "com.wingsfly" && 
                className != "com.wingsfly.LockScreenActivity") {
                
                // App switch detected
                if (currentApp != packageName) {
                    Log.d(TAG, "App switch detected: $currentApp -> $packageName")
                    
                    // Only remove temporary unlock if switching to a different non-system app
                    if (!isSystemApp(packageName)) {
                        currentApp?.let { 
                            removeTemporarilyUnlockedApp(it)
                            Log.d(TAG, "Removed temp unlock for previous app: $it")
                        }
                    }
                    currentApp = packageName
                    
                    // Check if new app needs to be locked
                    val lockedApps = prefs.getStringSet("lockedApps", setOf()) ?: setOf()
                    val currentTime = System.currentTimeMillis()
                    
                    Log.d(TAG, "Checking app: $packageName")
                    Log.d(TAG, "Is in locked apps: ${lockedApps.contains(packageName)}")
                    Log.d(TAG, "Time since last lock: ${currentTime - lastLockTime}")
                    Log.d(TAG, "Should lock app: ${shouldLockApp(packageName)}")
                    Log.d(TAG, "Task active: $isTaskActive")
                    
                    if (shouldLockApp(packageName)) {
                        if (currentTime - lastLockTime > LOCK_TIMEOUT) {
                            Log.d(TAG, "Attempting to lock: $packageName")
                            try {
                                val intent = Intent(this, LockScreenActivity::class.java).apply {
                                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                    putExtra("package_name", packageName)
                                }
                                startActivity(intent)
                                lastLockTime = currentTime
                                Log.d(TAG, "Lock screen launched for: $packageName")
                            } catch (e: Exception) {
                                Log.e(TAG, "Error launching lock screen: ${e.message}")
                            }
                        } else {
                            Log.d(TAG, "Not locking app because: " +
                                "timeout passed: ${currentTime - lastLockTime > LOCK_TIMEOUT}, " +
                                "should lock: ${shouldLockApp(packageName)}, " +
                                "task active: $isTaskActive")
                        }
                    }
                }
            }
        }
    }

    fun addTemporarilyUnlockedApp(packageName: String) {
        temporarilyUnlockedApps.add(packageName)
        Log.d(TAG, "Added to temporarily unlocked apps: $packageName")
    }

    fun removeTemporarilyUnlockedApp(packageName: String) {
        temporarilyUnlockedApps.remove(packageName)
        Log.d(TAG, "Removed from temporarily unlocked apps: $packageName")
    }

    override fun onInterrupt() {
        Log.w(TAG, "Service interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        (application as MainApplication).monitorService = null
    }

    fun setTaskActive(active: Boolean) {
        isTaskActive = active
        Log.d(TAG, "Task active state changed to: $active")
        if (!active) {
            temporarilyUnlockedApps.clear()
        }
    }

    private fun isInScheduledLockTime(packageName: String, hour: Int, minute: Int): Boolean {
        val startHour = prefs.getInt("${packageName}_lockStartHour", -1)
        val startMinute = prefs.getInt("${packageName}_lockStartMinute", 0)
        val endHour = prefs.getInt("${packageName}_lockEndHour", -1)
        val endMinute = prefs.getInt("${packageName}_lockEndMinute", 0)

        // If schedule is not set, don't lock
        if (startHour == -1 || endHour == -1) {
            Log.d(TAG, "Lock schedule not set for $packageName")
            return false
        }

        val currentTime = hour * 60 + minute
        val startTime = startHour * 60 + startMinute
        val endTime = endHour * 60 + endMinute

        Log.d(TAG, "Lock Schedule for $packageName - Start: ${startHour}:${startMinute}, End: ${endHour}:${endMinute}, Current: ${hour}:${minute}")

        val isInSchedule = if (startTime <= endTime) {
            // Normal schedule (e.g., 9:00 to 17:00)
            currentTime in startTime..endTime
        } else {
            // Overnight schedule (e.g., 22:00 to 06:00)
            currentTime >= startTime || currentTime <= endTime
        }

        Log.d(TAG, "Is in lock schedule for $packageName: $isInSchedule")
        return isInSchedule
    }

    private fun isInScheduledUnlockTime(packageName: String, hour: Int, minute: Int): Boolean {
        val startHour = prefs.getInt("${packageName}_unlockStartHour", -1)
        val startMinute = prefs.getInt("${packageName}_unlockStartMinute", 0)
        val endHour = prefs.getInt("${packageName}_unlockEndHour", -1)
        val endMinute = prefs.getInt("${packageName}_unlockEndMinute", 0)

        // If schedule is not set, keep locked
        if (startHour == -1 || endHour == -1) {
            Log.d(TAG, "Unlock schedule not set for $packageName")
            return false
        }

        val currentTime = hour * 60 + minute
        val startTime = startHour * 60 + startMinute
        val endTime = endHour * 60 + endMinute

        Log.d(TAG, "Unlock Schedule for $packageName - Start: ${startHour}:${startMinute}, End: ${endHour}:${endMinute}, Current: ${hour}:${minute}")

        val isInSchedule = if (startTime <= endTime) {
            currentTime in startTime..endTime
        } else {
            currentTime >= startTime || currentTime <= endTime
        }

        Log.d(TAG, "Is in unlock schedule for $packageName: $isInSchedule")
        return isInSchedule
    }

    private fun isInGlobalLockTime(hour: Int, minute: Int): Boolean {
        val startHour = prefs.getInt("globalLockStartHour", -1)
        val startMinute = prefs.getInt("globalLockStartMinute", 0)
        val endHour = prefs.getInt("globalLockEndHour", -1)
        val endMinute = prefs.getInt("globalLockEndMinute", 0)

        // If schedule is not set, don't lock
        if (startHour == -1 || endHour == -1) {
            Log.d(TAG, "Global lock schedule not set")
            return false
        }

        val currentTime = hour * 60 + minute
        val startTime = startHour * 60 + startMinute
        val endTime = endHour * 60 + endMinute

        Log.d(TAG, "Global Lock Schedule - Start: ${startHour}:${startMinute}, End: ${endHour}:${endMinute}, Current: ${hour}:${minute}")

        val isInSchedule = if (startTime <= endTime) {
            // Normal schedule (e.g., 9:00 to 17:00)
            currentTime in startTime..endTime
        } else {
            // Overnight schedule (e.g., 22:00 to 06:00)
            currentTime >= startTime || currentTime <= endTime
        }

        Log.d(TAG, "Is in global lock schedule: $isInSchedule")
        return isInSchedule
    }

    private fun shouldLockApp(packageName: String): Boolean {
        // If app is not in locked apps list, don't lock it
        val lockedApps = prefs.getStringSet("lockedApps", setOf()) ?: setOf()
        if (!lockedApps.contains(packageName)) {
            Log.d(TAG, "App not in locked apps list")
            return false
        }

        // If app is temporarily unlocked, don't lock it
        if (temporarilyUnlockedApps.contains(packageName)) {
            Log.d(TAG, "App is temporarily unlocked")
            return false
        }

        // Get the lock type for this app
        val lockType = appLockTypes[packageName]
        Log.d(TAG, "Checking lock for $packageName with type $lockType")

        when (lockType) {
            "scheduled_lock" -> {
                // Use the new isInLockTime method that checks all schedules
                val shouldLock = isInLockTime(packageName)
                Log.d(TAG, "Is in lock time: $shouldLock")
                return shouldLock
            }
            "scheduled_unlock" -> {
                // Use the new isInUnlockTime method that checks all schedules
                val shouldUnlock = isInUnlockTime(packageName)
                Log.d(TAG, "Is in unlock time: $shouldUnlock")
                return !shouldUnlock // Lock if NOT in unlock time
            }
            else -> {
                // For other lock types or no type specified, always lock
                return true
            }
        }
    }

    // Add helper function to check if unlock schedule exists
    private fun hasUnlockSchedule(packageName: String): Boolean {
        val startHour = prefs.getInt("${packageName}_unlockStartHour", -1)
        val endHour = prefs.getInt("${packageName}_unlockEndHour", -1)
        return startHour != -1 && endHour != -1
    }

    fun updateAppLockTypes(types: Map<String, String>) {
        // Merge new types with existing ones instead of replacing
        val currentTypes = appLockTypes.toMutableMap()
        currentTypes.putAll(types)
        appLockTypes = currentTypes
        
        Log.d(TAG, "Updated app lock types: $appLockTypes")
        
        // Update locked apps set by combining existing and new apps
        val currentLockedApps = prefs.getStringSet("lockedApps", setOf()) ?: setOf()
        val newLockedApps = (currentLockedApps + types.keys).toSet()
        
        prefs.edit()
            .putStringSet("lockedApps", newLockedApps)
            .apply()
        Log.d(TAG, "Updated locked apps in prefs: $newLockedApps")
    }

    // Add a function to remove lock type
    fun removeAppLockType(packageName: String) {
        appLockTypes.remove(packageName)
        
        // Also remove from locked apps
        val currentLockedApps = prefs.getStringSet("lockedApps", setOf()) ?: setOf()
        val newLockedApps = currentLockedApps.filter { it != packageName }.toSet()
        
        prefs.edit()
            .putStringSet("lockedApps", newLockedApps)
            .apply()
        
        Log.d(TAG, "Removed lock for app: $packageName")
        Log.d(TAG, "Current app lock types: $appLockTypes")
        Log.d(TAG, "Current locked apps: $newLockedApps")
    }

    // Add function to update lock schedule
    fun updateAppLockSchedule(
        packageName: String,
        startHour: Int,
        startMinute: Int,
        endHour: Int,
        endMinute: Int
    ) {
        prefs.edit().apply {
            putInt("${packageName}_lockStartHour", startHour)
            putInt("${packageName}_lockStartMinute", startMinute)
            putInt("${packageName}_lockEndHour", endHour)
            putInt("${packageName}_lockEndMinute", endMinute)
        }.apply()
        
        Log.d(TAG, "Updated lock schedule for $packageName: $startHour:$startMinute - $endHour:$endMinute")
    }

    private fun isSystemApp(packageName: String): Boolean {
        return packageName.startsWith("com.google.android.inputmethod") ||
               packageName.startsWith("com.google.android.apps.nexuslauncher") ||
               packageName.startsWith("com.google.android.googlequicksearchbox")
    }

    private fun isInAnyUnlockSchedule(hour: Int, minute: Int): Boolean {
        val schedulesJson = prefs.getString("unlockSchedules", "[]")
        
        try {
            val schedulesArray = JSONArray(schedulesJson)
            val currentTime = hour * 60 + minute

            for (i in 0 until schedulesArray.length()) {
                val schedule = schedulesArray.getJSONObject(i)
                val startTime = schedule.getInt("startHour") * 60 + schedule.getInt("startMinute")
                val endTime = schedule.getInt("endHour") * 60 + schedule.getInt("endMinute")

                val isInSchedule = if (startTime <= endTime) {
                    currentTime in startTime..endTime
                } else {
                    currentTime >= startTime || currentTime <= endTime
                }

                if (isInSchedule) return true
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error checking unlock schedules: ${e.message}")
        }
        
        return false
    }

    // Add function to update global lock schedule
    fun updateGlobalLockSchedule(
        startHour: Int,
        startMinute: Int,
        endHour: Int,
        endMinute: Int
    ) {
        prefs.edit().apply {
            putInt("scheduledLockStartHour", startHour)
            putInt("scheduledLockStartMinute", startMinute)
            putInt("scheduledLockEndHour", endHour)
            putInt("scheduledLockEndMinute", endMinute)
        }.apply()
        
        Log.d(TAG, "Updated global lock schedule: $startHour:$startMinute - $endHour:$endMinute")
    }

    // Add function to update global unlock schedule
    fun updateGlobalUnlockSchedule(
        startHour: Int,
        startMinute: Int,
        endHour: Int,
        endMinute: Int
    ) {
        prefs.edit().apply {
            putInt("scheduledUnlockStartHour", startHour)
            putInt("scheduledUnlockStartMinute", startMinute)
            putInt("scheduledUnlockEndHour", endHour)
            putInt("scheduledUnlockEndMinute", endMinute)
        }.apply()
        
        Log.d(TAG, "Updated global unlock schedule: $startHour:$startMinute - $endHour:$endMinute")
    }

    private fun isInLockTime(packageName: String): Boolean {
        try {
            val prefs = applicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
            
            // Get all lock schedules
            val schedulesJson = prefs.getString("lockSchedules", "[]")
            val schedulesArray = JSONArray(schedulesJson)
            
            // Get current time
            val calendar = Calendar.getInstance()
            val currentHour = calendar.get(Calendar.HOUR_OF_DAY)
            val currentMinute = calendar.get(Calendar.MINUTE)
            val currentTimeInMinutes = currentHour * 60 + currentMinute

            // Check each schedule
            for (i in 0 until schedulesArray.length()) {
                val schedule = schedulesArray.getJSONObject(i)
                val startHour = schedule.getInt("startHour")
                val startMinute = schedule.getInt("startMinute")
                val endHour = schedule.getInt("endHour")
                val endMinute = schedule.getInt("endMinute")

                val startTimeInMinutes = startHour * 60 + startMinute
                val endTimeInMinutes = endHour * 60 + endMinute

                Log.d(TAG, "Checking lock schedule: $startHour:$startMinute - $endHour:$endMinute")
                Log.d(TAG, "Current time: $currentHour:$currentMinute")

                // Check if current time falls within this schedule
                if (isTimeInRange(currentTimeInMinutes, startTimeInMinutes, endTimeInMinutes)) {
                    Log.d(TAG, "Found matching lock schedule")
                    return true
                }
            }
            
            Log.d(TAG, "No matching lock schedule found")
            return false
        } catch (e: Exception) {
            Log.e(TAG, "Error checking lock time: ${e.message}")
            return false
        }
    }

    private fun isTimeInRange(current: Int, start: Int, end: Int): Boolean {
        // Handle cases where schedule crosses midnight
        return if (end >= start) {
            current in start..end
        } else {
            current >= start || current <= end
        }
    }

    private fun isInUnlockTime(packageName: String): Boolean {
        try {
            val prefs = applicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
            
            // Get all unlock schedules
            val schedulesJson = prefs.getString("unlockSchedules", "[]")
            val schedulesArray = JSONArray(schedulesJson)
            
            val calendar = Calendar.getInstance()
            val currentHour = calendar.get(Calendar.HOUR_OF_DAY)
            val currentMinute = calendar.get(Calendar.MINUTE)
            val currentTimeInMinutes = currentHour * 60 + currentMinute

            for (i in 0 until schedulesArray.length()) {
                val schedule = schedulesArray.getJSONObject(i)
                val startHour = schedule.getInt("startHour")
                val startMinute = schedule.getInt("startMinute")
                val endHour = schedule.getInt("endHour")
                val endMinute = schedule.getInt("endMinute")

                val startTimeInMinutes = startHour * 60 + startMinute
                val endTimeInMinutes = endHour * 60 + endMinute

                Log.d(TAG, "Checking unlock schedule: $startHour:$startMinute - $endHour:$endMinute")
                Log.d(TAG, "Current time: $currentHour:$currentMinute")

                if (isTimeInRange(currentTimeInMinutes, startTimeInMinutes, endTimeInMinutes)) {
                    Log.d(TAG, "Found matching unlock schedule")
                    return true
                }
            }
            
            Log.d(TAG, "No matching unlock schedule found")
            return false
        } catch (e: Exception) {
            Log.e(TAG, "Error checking unlock time: ${e.message}")
            return false
        }
    }
}

