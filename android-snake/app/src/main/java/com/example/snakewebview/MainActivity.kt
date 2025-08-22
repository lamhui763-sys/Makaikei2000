package com.example.snakewebview

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity

class MainActivity : ComponentActivity() {
	private lateinit var webView: WebView

	@SuppressLint("SetJavaScriptEnabled")
	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)
		window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
		setContentView(R.layout.activity_main)

		webView = findViewById(R.id.webview)
		with(webView.settings) {
			javaScriptEnabled = true
			domStorageEnabled = true
			allowFileAccess = true
			allowContentAccess = true
			cacheMode = WebSettings.LOAD_DEFAULT
			mediaPlaybackRequiresUserGesture = false
		}
		webView.webViewClient = object : WebViewClient() {}
		webView.webChromeClient = WebChromeClient()

		webView.loadUrl("file:///android_asset/www/index.html")
	}

	override fun onBackPressed() {
		if (this::webView.isInitialized && webView.canGoBack()) {
			webView.goBack()
		} else {
			super.onBackPressed()
		}
	}
}