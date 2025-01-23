package com.wingsfly

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.os.Process
import android.content.pm.PackageManager
import com.facebook.react.bridge.*
import android.util.Log

class AppLockModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "AppLockModule"
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to open accessibility settings: ${e.message}")
        }
    }

    @ReactMethod
    fun openUsageAccessSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to open usage access settings: ${e.message}")
        }
    }

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        try {
            val context = reactApplicationContext
            val accessibilityEnabled = Settings.Secure.getInt(
                context.contentResolver,
                Settings.Secure.ACCESSIBILITY_ENABLED
            )
            
            if (accessibilityEnabled == 1) {
                val service = "${context.packageName}/${AppMonitorService::class.java.canonicalName}"
                val serviceEnabled = Settings.Secure.getString(
                    context.contentResolver,
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
                )
                promise.resolve(serviceEnabled?.contains(service) == true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to check accessibility service status: ${e.message}")
        }
    }

    @ReactMethod
    fun isUsageStatsPermissionGranted(promise: Promise) {
        try {
            val context = reactApplicationContext
            val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to check usage stats permission: ${e.message}")
        }
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val packageManager = reactApplicationContext.packageManager
            val installedApps = packageManager.getInstalledApplications(PackageManager.GET_META_DATA)

            // Convert to WritableNativeArray
            val appsArray = WritableNativeArray()
            installedApps.forEach { appInfo ->
                appsArray.pushString(appInfo.packageName)
            }

            promise.resolve(appsArray) // Resolve the Promise with a WritableNativeArray
        } catch (e: Exception) {
            promise.reject("ERROR_FETCHING_APPS", "Failed to fetch installed apps: ${e.message}")
        }
    }

    @ReactMethod
    fun updateLockedApps(lockedApps: ReadableArray, promise: Promise) {
        try {
            val context = reactApplicationContext
            val prefs = context.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
            val lockedAppsSet = mutableSetOf<String>()
            
            for (i in 0 until lockedApps.size()) {
                lockedAppsSet.add(lockedApps.getString(i))
            }
            
            prefs.edit().putStringSet("lockedApps", lockedAppsSet).apply()
            Log.d("AppLockModule", "Updated locked apps: $lockedAppsSet")
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to update locked apps: ${e.message}")
        }
    }
}
