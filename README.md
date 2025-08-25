# 旅遊易 TravelEase

一個簡單的個人旅遊助理網站：用戶輸入行程（例如 9/15 東京 7 天），系統會於出發前 3 天自動聚合（示例數據 + 真實天氣 API）航班、酒店、景點、交通及天氣資訊，並電郵到用戶信箱。

## 快速開始

1. 複製 `.env.example` 為 `.env` 並填寫 SMTP 設定（用於寄送電郵）。
2. 安裝依賴：
```bash
npm install
```
3. 啟動開發：
```bash
npm run dev
```
開啟 `http://localhost:3000`，提交你的旅遊計劃。

> 天氣資料使用 Open-Meteo API；航班與酒店目前為示例數據，可在 `src/adapters/aggregate.js` 接入真實 API。

## 功能
- 表單提交：姓名、電郵、目的地、城市、出發日期、天數
- 出發前三天自動聚合並寄送電郵（`node-cron`）
- `/trips/:id/preview` 預覽聚合內容

## 目錄結構
- `src/index.js`：應用入口
- `src/routes/ui.js`：表單與路由
- `src/views/*.ejs`：頁面
- `src/services/db.js`、`src/db/init.js`：SQLite 資料庫
- `src/services/scheduler.js`：每日 09:00 檢查 T-3
- `src/adapters/aggregate.js`：資料聚合（天氣使用 Open-Meteo）
- `src/services/sendEmail.js`：電郵寄送

## 環境變數
- `PORT`、`DB_FILE`
- `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`、`MAIL_FROM`
