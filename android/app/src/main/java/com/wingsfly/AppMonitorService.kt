package com.wingsfly

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.content.SharedPreferences

class AppMonitorService : AccessibilityService() {
    private lateinit var prefs: SharedPreferences
    private val TAG = "AppMonitorService"
    private var temporarilyUnlockedApps = mutableSetOf<String>()
    private var currentApp: String? = null
    private var lastLockTime: Long = 0
    private val LOCK_TIMEOUT = 3000L

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
            
            if (packageName != null && 
                packageName != "com.wingsfly" && 
                className != "com.wingsfly.LockScreenActivity") {
                
                // App switch detected
                if (currentApp != packageName) {
                    // Previous app is being closed
                    currentApp?.let { removeTemporarilyUnlockedApp(it) }
                    currentApp = packageName
                    
                    // Check if new app needs to be locked
                    if (!temporarilyUnlockedApps.contains(packageName)) {
                        val lockedApps = prefs.getStringSet("lockedApps", setOf()) ?: setOf()
                        val currentTime = System.currentTimeMillis()
                        
                        if (lockedApps.contains(packageName) && 
                            currentTime - lastLockTime > LOCK_TIMEOUT) {
                            Log.d(TAG, "Attempting to lock: $packageName")
                            try {
                                val intent = Intent(this, LockScreenActivity::class.java)
                                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                intent.putExtra("package_name", packageName)
                                startActivity(intent)
                                lastLockTime = currentTime
                                Log.d(TAG, "Lock screen launched for: $packageName")
                            } catch (e: Exception) {
                                Log.e(TAG, "Error launching lock screen: ${e.message}")
                            }
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
        Log.d(TAG, "Service Interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        (application as MainApplication).monitorService = null
    }
}

