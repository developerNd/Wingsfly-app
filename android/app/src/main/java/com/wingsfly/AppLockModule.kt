package com.wingsfly

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.os.Process
import android.content.pm.PackageManager
import com.facebook.react.bridge.*
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import android.net.Uri

class AppLockModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "AppLockModule"
    }

    override fun getName() = NAME

    override fun getConstants(): MutableMap<String, Any> {
        return hashMapOf()
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

    @ReactMethod
    fun setAppLockingEnabled(enabled: Boolean, promise: Promise) {
        try {
            val mainApplication = reactApplicationContext.applicationContext as MainApplication
            mainApplication.monitorService?.setTaskActive(enabled)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to set app locking state: ${e.message}")
        }
    }

    @ReactMethod
    fun updateScheduleTimes(
        scheduledLockStartHour: Int,
        scheduledLockStartMinute: Int,
        scheduledLockEndHour: Int,
        scheduledLockEndMinute: Int,
        scheduledUnlockStartHour: Int,
        scheduledUnlockStartMinute: Int,
        scheduledUnlockEndHour: Int,
        scheduledUnlockEndMinute: Int,
        promise: Promise
    ) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
            prefs.edit().apply {
                putInt("scheduledLockStartHour", scheduledLockStartHour)
                putInt("scheduledLockStartMinute", scheduledLockStartMinute)
                putInt("scheduledLockEndHour", scheduledLockEndHour)
                putInt("scheduledLockEndMinute", scheduledLockEndMinute)
                putInt("scheduledUnlockStartHour", scheduledUnlockStartHour)
                putInt("scheduledUnlockStartMinute", scheduledUnlockStartMinute)
                putInt("scheduledUnlockEndHour", scheduledUnlockEndHour)
                putInt("scheduledUnlockEndMinute", scheduledUnlockEndMinute)
            }.apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to update schedule times: ${e.message}")
        }
    }

    @ReactMethod
    fun getScheduleTimes(promise: Promise) {
        try {
            val map = Arguments.createMap()
            
            // Lock schedule
            map.putInt("scheduledLockStartHour", getLockStartHour())
            map.putInt("scheduledLockStartMinute", getLockStartMinute())
            map.putInt("scheduledLockEndHour", getLockEndHour())
            map.putInt("scheduledLockEndMinute", getLockEndMinute())
            
            // Unlock schedule
            map.putInt("scheduledUnlockStartHour", getUnlockStartHour())
            map.putInt("scheduledUnlockStartMinute", getUnlockStartMinute())
            map.putInt("scheduledUnlockEndHour", getUnlockEndHour())
            map.putInt("scheduledUnlockEndMinute", getUnlockEndMinute())
            
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun updateAppLockTypes(packageName: String, lockType: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
            val lockedApps = prefs.getStringSet("lockedApps", mutableSetOf()) ?: mutableSetOf()
            val updatedLockedApps = lockedApps.toMutableSet()

            if (lockType == "none") {
                updatedLockedApps.remove(packageName)
            } else {
                updatedLockedApps.add(packageName)
            }

            prefs.edit().apply {
                putStringSet("lockedApps", updatedLockedApps)
                putString("${packageName}_lockType", lockType)
            }.apply()

            // Update the service
            val mainApplication = reactApplicationContext.applicationContext as MainApplication
            mainApplication.monitorService?.updateAppLockTypes(mapOf(packageName to lockType))
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to update app lock type: ${e.message}")
        }
    }

    @ReactMethod
    fun updateGlobalLockSchedule(startHour: Int, startMinute: Int, endHour: Int, endMinute: Int, promise: Promise) {
        try {
            saveLockSchedule(startHour, startMinute, endHour, endMinute)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getAppUnlockSchedule(packageName: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
            val map = Arguments.createMap().apply {
                putInt("startHour", prefs.getInt("${packageName}_unlockStartHour", 0))
                putInt("startMinute", prefs.getInt("${packageName}_unlockStartMinute", 0))
                putInt("endHour", prefs.getInt("${packageName}_unlockEndHour", 0))
                putInt("endMinute", prefs.getInt("${packageName}_unlockEndMinute", 0))
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to get app unlock schedule: ${e.message}")
        }
    }

    @ReactMethod
    fun updateGlobalUnlockSchedule(startHour: Int, startMinute: Int, endHour: Int, endMinute: Int, promise: Promise) {
        try {
            saveUnlockSchedule(startHour, startMinute, endHour, endMinute)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun updateUnlockSchedules(schedules: ReadableArray, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
            val editor = prefs.edit()

            // Convert schedules to JSON string
            val schedulesJson = JSONArray()
            for (i in 0 until schedules.size()) {
                val schedule = schedules.getMap(i)
                val scheduleJson = JSONObject().apply {
                    put("id", schedule.getString("id"))
                    put("startHour", schedule.getInt("startHour"))
                    put("startMinute", schedule.getInt("startMinute"))
                    put("endHour", schedule.getInt("endHour"))
                    put("endMinute", schedule.getInt("endMinute"))
                }
                schedulesJson.put(scheduleJson)
            }

            editor.putString("unlockSchedules", schedulesJson.toString())
            editor.apply()

            Log.d("AppLockModule", "Saved unlock schedules: ${schedulesJson}")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("AppLockModule", "Failed to update unlock schedules: ${e.message}")
            promise.reject("ERROR", "Failed to update unlock schedules: ${e.message}")
        }
    }

    @ReactMethod
    fun getUnlockSchedules(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
            val schedulesJson = prefs.getString("unlockSchedules", "[]")
            val schedulesArray = JSONArray(schedulesJson)
            
            val result = WritableNativeArray()
            for (i in 0 until schedulesArray.length()) {
                val schedule = schedulesArray.getJSONObject(i)
                val scheduleMap = WritableNativeMap().apply {
                    putString("id", schedule.getString("id"))
                    putInt("startHour", schedule.getInt("startHour"))
                    putInt("startMinute", schedule.getInt("startMinute"))
                    putInt("endHour", schedule.getInt("endHour"))
                    putInt("endMinute", schedule.getInt("endMinute"))
                }
                result.pushMap(scheduleMap)
            }
            
            Log.d("AppLockModule", "Loaded unlock schedules: ${schedulesJson}")
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e("AppLockModule", "Failed to get unlock schedules: ${e.message}")
            promise.reject("ERROR", "Failed to get unlock schedules: ${e.message}")
        }
    }

    @ReactMethod
    fun canDrawOverlays(promise: Promise) {
        try {
            val canDraw = Settings.canDrawOverlays(reactApplicationContext)
            promise.resolve(canDraw)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to check overlay permission: ${e.message}")
        }
    }

    @ReactMethod
    fun openOverlaySettings(promise: Promise) {
        try {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactApplicationContext.packageName}")
            )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to open overlay settings: ${e.message}")
        }
    }

    @ReactMethod
    fun updateLockSchedules(schedules: ReadableArray, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
            val schedulesJson = JSONArray()
            
            for (i in 0 until schedules.size()) {
                val schedule = schedules.getMap(i)
                val scheduleJson = JSONObject().apply {
                    put("id", schedule.getString("id"))
                    put("startHour", schedule.getInt("startHour"))
                    put("startMinute", schedule.getInt("startMinute"))
                    put("endHour", schedule.getInt("endHour"))
                    put("endMinute", schedule.getInt("endMinute"))
                }
                schedulesJson.put(scheduleJson)
            }

            prefs.edit().putString("lockSchedules", schedulesJson.toString()).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to update lock schedules: ${e.message}")
        }
    }

    @ReactMethod
    fun getLockSchedules(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
            val schedulesJson = prefs.getString("lockSchedules", "[]")
            val schedulesArray = JSONArray(schedulesJson)
            
            val result = WritableNativeArray()
            for (i in 0 until schedulesArray.length()) {
                val schedule = schedulesArray.getJSONObject(i)
                val scheduleMap = WritableNativeMap().apply {
                    putString("id", schedule.getString("id"))
                    putInt("startHour", schedule.getInt("startHour"))
                    putInt("startMinute", schedule.getInt("startMinute"))
                    putInt("endHour", schedule.getInt("endHour"))
                    putInt("endMinute", schedule.getInt("endMinute"))
                }
                result.pushMap(scheduleMap)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to get lock schedules: ${e.message}")
        }
    }

    // Helper methods to save/get lock schedule
    private fun saveLockSchedule(startHour: Int, startMinute: Int, endHour: Int, endMinute: Int) {
        val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
        prefs.edit().apply {
            putInt("scheduledLockStartHour", startHour)
            putInt("scheduledLockStartMinute", startMinute)
            putInt("scheduledLockEndHour", endHour)
            putInt("scheduledLockEndMinute", endMinute)
        }.apply()
    }

    private fun saveUnlockSchedule(startHour: Int, startMinute: Int, endHour: Int, endMinute: Int) {
        val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
        prefs.edit().apply {
            putInt("scheduledUnlockStartHour", startHour)
            putInt("scheduledUnlockStartMinute", startMinute)
            putInt("scheduledUnlockEndHour", endHour)
            putInt("scheduledUnlockEndMinute", endMinute)
        }.apply()
    }

    // Helper methods to get lock schedule
    private fun getLockStartHour(): Int {
        val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
        return prefs.getInt("scheduledLockStartHour", 0)
    }

    private fun getLockStartMinute(): Int {
        val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
        return prefs.getInt("scheduledLockStartMinute", 0)
    }

    private fun getLockEndHour(): Int {
        val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
        return prefs.getInt("scheduledLockEndHour", 0)
    }

    private fun getLockEndMinute(): Int {
        val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
        return prefs.getInt("scheduledLockEndMinute", 0)
    }

    // Helper methods to get unlock schedule
    private fun getUnlockStartHour(): Int {
        val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
        return prefs.getInt("scheduledUnlockStartHour", 0)
    }

    private fun getUnlockStartMinute(): Int {
        val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
        return prefs.getInt("scheduledUnlockStartMinute", 0)
    }

    private fun getUnlockEndHour(): Int {
        val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
        return prefs.getInt("scheduledUnlockEndHour", 0)
    }

    private fun getUnlockEndMinute(): Int {
        val prefs = reactApplicationContext.getSharedPreferences("AppLock", Context.MODE_PRIVATE)
        return prefs.getInt("scheduledUnlockEndMinute", 0)
    }
}
