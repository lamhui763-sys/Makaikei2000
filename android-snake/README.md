# Android Snake WebView App

此專案將 `/workspace/snake-game` 的網頁版貪吃蛇封裝成 Android App（WebView）。

## 開發與執行

1. 使用 Android Studio 打開 `/workspace/android-snake`
2. 等待 Gradle 同步完成（若提示安裝 SDK/Build-Tools，依指示安裝）
3. 連接 Android 裝置或啟動模擬器
4. 以 `app` 模組為目標，點擊 Run ▶️

App 會載入 `file:///android_asset/www/index.html`。

## 專案結構
- `app/src/main/assets/www/`：封裝的網頁資源（index.html、script.js、style.css）
- `MainActivity.kt`：設定 WebView 並載入本地資產
- `AndroidManifest.xml`：宣告 Activity 與權限