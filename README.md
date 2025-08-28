# 旅遊易 - 智能旅遊個人助理

一個智能化的旅遊規劃網站，幫助用戶自動搜索航班、酒店、景點等信息，並在旅行前三天自動發送完整的旅遊報告到用戶郵箱。

## 🌟 主要功能

### ✈️ 智能搜索
- 自動搜索最優惠的航班信息
- 推薦合適的酒店和住宿
- 搜索當地必去景點和活動

### 🤖 AI 助手
- 智能生成個性化旅遊攻略
- 提供詳細的交通信息
- 包含天氣預報和注意事項

### 📧 自動提醒
- 旅行前三天自動發送完整報告
- 包含所有預訂鏈接和實用信息
- 支持重新發送功能

## 🚀 快速開始

### 環境要求
- Node.js >= 20.0.0
- npm 或 yarn

### 安裝步驟

1. **克隆項目**
```bash
git clone <repository-url>
cd travel-easy
```

2. **安裝依賴**
```bash
npm install
```

3. **配置環境變量**
複製 `.env.example` 到 `.env` 並填寫配置：
```bash
cp .env.example .env
```

編輯 `.env` 文件：
```env
# 服務器配置
PORT=3000
ENABLE_TUNNEL=true

# Amadeus API 配置
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret

# OpenAI API 配置 (可選，用於生成旅遊攻略)
OPENAI_API_KEY=your_openai_api_key

# 郵件配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# 數據庫配置
DATABASE_URL=./data/travel_easy.db

# 其他配置
NODE_ENV=development
```

4. **啟動服務器**
```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

5. **訪問網站**
打開瀏覽器訪問 `http://localhost:3000`

## 📋 使用流程

1. **創建旅遊計劃**
   - 填寫姓名、郵箱、目的地、出發日期和旅行天數
   - 系統會自動開始收集旅遊信息

2. **等待處理完成**
   - 系統會自動搜索航班、酒店、景點等信息
   - 生成個性化旅遊攻略

3. **接收郵件報告**
   - 旅行前三天會自動發送完整報告到您的郵箱
   - 包含所有預訂鏈接和實用信息

## 🔧 API 端點

### 旅遊計劃管理
- `POST /api/travel-plans` - 創建旅遊計劃
- `GET /api/travel-plans` - 獲取所有旅遊計劃
- `GET /api/travel-plans/:id` - 獲取特定旅遊計劃
- `POST /api/travel-plans/:id/send-report` - 手動發送旅遊報告

### 頁面路由
- `GET /` - 首頁
- `GET /create` - 創建旅遊計劃頁面
- `GET /plans` - 旅遊計劃列表頁面
- `GET /plan/:id` - 旅遊計劃詳情頁面

## 🏗️ 項目結構

```
src/
├── db/
│   └── init.js              # 數據庫初始化
├── routes/
│   └── ui.js                # UI 路由
├── services/
│   ├── amadeus.js           # Amadeus API 服務
│   ├── travelInfo.js        # 旅遊信息搜索服務
│   ├── travelPlan.js        # 旅遊計劃管理服務
│   ├── email.js             # 郵件發送服務
│   └── scheduler.js         # 定時任務服務
├── views/
│   ├── index.ejs            # 首頁
│   ├── create.ejs           # 創建頁面
│   ├── plans.ejs            # 列表頁面
│   └── plan-detail.ejs      # 詳情頁面
└── index.js                 # 主入口文件
```

## 🔑 API 配置

### Amadeus API
用於搜索航班和酒店信息：
1. 註冊 [Amadeus for Developers](https://developers.amadeus.com/)
2. 創建應用獲取 API Key 和 Secret
3. 在 `.env` 文件中配置

### OpenAI API (可選)
用於生成智能旅遊攻略：
1. 註冊 [OpenAI](https://openai.com/)
2. 獲取 API Key
3. 在 `.env` 文件中配置

### 郵件配置
支持 Gmail、Outlook 等 SMTP 服務：
1. 開啟兩步驗證
2. 生成應用密碼
3. 在 `.env` 文件中配置

## 🎨 技術棧

- **後端**: Node.js, Express.js
- **數據庫**: SQLite (better-sqlite3)
- **前端**: EJS 模板引擎, Bootstrap 5
- **API**: Amadeus API, OpenAI API
- **郵件**: Nodemailer
- **定時任務**: node-cron
- **網頁爬蟲**: Puppeteer

## 📝 數據庫結構

- `users` - 用戶信息
- `travel_plans` - 旅遊計劃
- `flight_info` - 航班信息
- `hotel_info` - 酒店信息
- `attraction_info` - 景點信息
- `report_logs` - 報告發送記錄

## 🔄 定時任務

- **每天早上 9 點**: 檢查需要發送報告的旅遊計劃
- **每小時**: 檢查待處理的旅遊計劃狀態

## 🚀 部署

### 本地部署
```bash
npm install
npm start
```

### Docker 部署
```bash
docker build -t travel-easy .
docker run -p 3000:3000 travel-easy
```

### 雲端部署
支持部署到 Heroku、Vercel、Railway 等平台。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 許可證

MIT License

## 📞 聯繫方式

如有問題或建議，請通過以下方式聯繫：
- 提交 GitHub Issue
- 發送郵件至項目維護者

---

**旅遊易** - 讓旅行規劃變得簡單輕鬆！ ✈️🏖️
