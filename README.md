# 旅遊易 Travel Easy

🏝️ **您的專屬AI旅遊助理** - 智能旅遊規劃平台

## 功能特色

- 🤖 **AI智能推薦** - 運用人工智能分析，提供個性化旅遊方案
- ✈️ **航班比價** - 整合Amadeus API自動搜尋最優惠航班
- 🏨 **酒店精選** - 提供詳細酒店資訊和聯絡方式
- 🌤️ **天氣預報** - 即時天氣資訊，助您準備合適裝備
- 📧 **自動郵件** - 出發前3天自動發送完整旅遊攻略
- ⏰ **智能調度** - 定時任務系統確保及時處理

## 技術架構

- **後端**: Node.js + Express.js
- **數據庫**: SQLite
- **模板引擎**: EJS
- **API整合**: Amadeus, OpenWeather, OpenAI
- **郵件服務**: Nodemailer
- **任務調度**: node-cron

## 快速開始

### 方法一：自動設置（推薦）

```bash
# 一鍵設置並檢查配置
npm run setup

# 檢查配置狀態
npm run check

# 啟動應用
npm run dev
```

### 方法二：手動設置

#### 1. 安裝依賴

```bash
npm install
```

#### 2. 配置環境變數

複製並編輯 `.env` 文件：

```env
# 基本配置
NODE_ENV=development
PORT=3000
ENABLE_TUNNEL=true

# Amadeus API (必需)
AMADEUS_API_KEY=你的Amadeus_API_Key
AMADEUS_API_SECRET=你的Amadeus_API_Secret
AMADEUS_HOSTNAME=test

# 郵件服務配置 (必需)
EMAIL_SERVICE=gmail
EMAIL_USER=你的郵箱@gmail.com
EMAIL_PASS=你的應用密碼

# OpenAI API (可選，用於AI助理)
OPENAI_API_KEY=你的OpenAI_API_Key

# 天氣API (可選)
WEATHER_API_KEY=你的OpenWeather_API_Key

# 數據庫
DB_PATH=./data.sqlite
```

#### 3. 啟動應用

```bash
# 使用啟動腳本（推薦）
./start.sh

# 或直接使用npm
npm run dev

# 生產模式
npm start
```

#### 4. 訪問應用

打開瀏覽器訪問 `http://localhost:3000`

### 功能示範

```bash
# 運行完整功能示範
npm run demo

# 運行API測試
npm run test
```

## API配置說明

### Amadeus API

1. 註冊 [Amadeus for Developers](https://developers.amadeus.com/)
2. 創建應用獲取API Key和Secret
3. 將憑證添加到 `.env` 文件

### 郵件服務配置

使用Gmail發送郵件：

1. 開啟Gmail的兩步驟驗證
2. 生成應用專用密碼
3. 在 `.env` 中配置郵箱和密碼

### OpenAI API (可選)

1. 註冊 [OpenAI](https://openai.com/)
2. 獲取API Key
3. 添加到 `.env` 文件

### 天氣API (可選)

1. 註冊 [OpenWeatherMap](https://openweathermap.org/api)
2. 獲取免費API Key
3. 添加到 `.env` 文件

## 主要功能說明

### 1. 旅遊計劃提交

用戶可以通過網站表單提交旅遊計劃，包括：
- 姓名和郵箱
- 目的地
- 出發日期和旅行天數
- 旅行人數和預算
- 旅遊偏好

### 2. 自動調度系統

系統每天上午9點檢查需要處理的旅行計劃：
- 查找出發前3天的計劃
- 自動搜集航班、酒店、天氣信息
- 生成AI旅遊攻略
- 發送完整報告到用戶郵箱

### 3. 數據搜集與整合

- **航班搜索**: 使用Amadeus API搜索最優惠航班
- **酒店搜索**: 獲取酒店價格、評級和聯絡信息
- **天氣信息**: 提供目的地天氣預報和建議
- **AI攻略**: 生成個性化旅遊建議和行程安排

### 4. 智能報告生成

系統會生成包含以下內容的HTML郵件：
- 航班推薦和價格比較
- 酒店選擇和詳細信息
- 天氣預報和穿衣建議
- AI生成的旅遊攻略和景點推薦

## API接口

### 創建旅行計劃
```
POST /trips
```

### 查看計劃詳情
```
GET /trips/:id
```

### 手動觸發搜索
```
POST /trips/:id/search
```

### 獲取所有計劃
```
GET /api/trips
```

## 數據庫結構

### trips 表
存儲用戶旅遊計劃基本信息

### flight_searches 表
存儲航班搜索結果

### hotel_searches 表
存儲酒店搜索結果

### travel_reports 表
存儲AI生成的旅遊攻略

## 部署說明

### 本地部署

```bash
npm start
```

### Docker部署

```bash
# 構建鏡像
docker build -t travel-easy .

# 運行容器
docker run -p 3000:3000 -v $(pwd)/.env:/app/.env travel-easy
```

### 雲端部署

支持部署到各種雲端平台：
- Heroku
- Railway
- Render
- DigitalOcean

## 開發指南

### 項目結構

```
src/
├── db/                 # 數據庫初始化
├── routes/             # 路由處理
├── services/           # 核心服務
│   ├── amadeus.js     # Amadeus API整合
│   ├── weather.js     # 天氣API整合
│   ├── ai.js          # AI助理服務
│   ├── email.js       # 郵件服務
│   ├── travel-search.js # 旅遊搜索邏輯
│   └── scheduler.js   # 定時任務
└── views/              # EJS模板
```

### 添加新功能

1. 在 `services/` 目錄添加新服務
2. 在 `routes/` 目錄添加新路由
3. 創建對應的EJS模板
4. 更新數據庫結構

## 故障排除

### 常見問題

1. **Amadeus API錯誤**
   - 檢查API憑證是否正確
   - 確認使用test環境

2. **郵件發送失敗**
   - 檢查Gmail應用密碼
   - 確認郵箱設置

3. **定時任務不執行**
   - 檢查系統時間設置
   - 查看日誌輸出

### 日誌查看

應用會輸出詳細的操作日誌，包括：
- 數據庫操作
- API調用結果
- 郵件發送狀態
- 錯誤信息

## 貢獻指南

歡迎提交Issues和Pull Requests！

1. Fork本專案
2. 創建功能分支
3. 提交變更
4. 發起Pull Request

## 授權協議

MIT License

## 聯絡方式

如有問題或建議，歡迎通過以下方式聯絡：
- GitHub Issues
- Email: support@travel-easy.com

---

**旅遊易 Travel Easy** - 讓每一次旅行都成為美好回憶 ✈️🏖️