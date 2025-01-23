package com.wingsfly

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import android.content.SharedPreferences
import android.content.Intent
import android.view.WindowManager

class LockScreenActivity : AppCompatActivity() {
    private lateinit var prefs: SharedPreferences
    private val PIN = "1234" // Replace with your actual PIN management system

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Set window flags
        window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                or WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                or WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
        
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

    override fun onBackPressed() {
        val homeIntent = Intent(Intent.ACTION_MAIN)
        homeIntent.addCategory(Intent.CATEGORY_HOME)
        homeIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        startActivity(homeIntent)
    }
}
