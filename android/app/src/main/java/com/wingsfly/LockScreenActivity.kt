package com.wingsfly

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import android.content.SharedPreferences
import android.content.Intent
import android.view.WindowManager
import android.os.Build
import android.view.WindowInsets
import androidx.activity.OnBackPressedCallback

class LockScreenActivity : AppCompatActivity() {
    private lateinit var prefs: SharedPreferences
    private val PIN = "1234" // Replace with your actual PIN management system

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Set window flags to show over lock screen and other apps
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }

        // Add these flags for MIUI and other custom ROMs
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
            WindowManager.LayoutParams.FLAG_LAYOUT_INSET_DECOR or
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
            WindowManager.LayoutParams.FLAG_LOCAL_FOCUS_MODE
        )

        // Set window type for overlay
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            window.attributes.type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            window.attributes.type = WindowManager.LayoutParams.TYPE_SYSTEM_ERROR
        }

        // Fix the back press callback implementation
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // Go to home screen instead of previous app
                val homeIntent = Intent(Intent.ACTION_MAIN)
                homeIntent.addCategory(Intent.CATEGORY_HOME)
                homeIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                startActivity(homeIntent)
            }
        })

        setContentView(R.layout.activity_lock_screen)
        
        prefs = getSharedPreferences("AppLock", MODE_PRIVATE)
        val packageName = intent.getStringExtra("package_name") ?: ""
        
        val pinInput = findViewById<EditText>(R.id.pinInput)
        val unlockButton = findViewById<Button>(R.id.unlockButton)
        
        pinInput.requestFocus()
        
        unlockButton.setOnClickListener {
            val enteredPin = pinInput.text.toString()
            if (enteredPin == PIN) {
                if (packageName.isNotEmpty()) {
                    try {
                        // Add to temporarily unlocked apps
                        (applicationContext as MainApplication)
                            .monitorService
                            ?.addTemporarilyUnlockedApp(packageName)

                        // Launch the app
                        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                        launchIntent?.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        startActivity(launchIntent)
                    } catch (e: Exception) {
                        Toast.makeText(this, "Error launching app", Toast.LENGTH_SHORT).show()
                    }
                }
                finish()
            } else {
                Toast.makeText(this, "Incorrect PIN", Toast.LENGTH_SHORT).show()
                pinInput.text.clear()
                pinInput.requestFocus()
            }
        }
    }

    override fun onStart() {
        super.onStart()
        // Ensure activity shows on top
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
        }
    }

    override fun onResume() {
        super.onResume()
        // Force activity to front on MIUI devices
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.show(WindowInsets.Type.statusBars())
        }
    }
}
