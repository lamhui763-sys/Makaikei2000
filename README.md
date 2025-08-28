# 旅遊易 - 智能旅遊規劃個人助理

🏖️ 讓AI為您規劃完美的旅行體驗

## 功能特色

### 🎯 核心功能
- **智能搜索**: 自動搜索最優惠的機票和酒店，為您節省時間和金錢
- **AI規劃師**: 智能AI為您生成個性化的旅遊攻略和行程安排
- **自動通知**: 自動發送詳細的旅遊報告到您的郵箱，隨時掌握最新信息
- **天氣預報**: 實時天氣信息，幫助您合理安排行程和準備衣物
- **景點推薦**: 推薦當地熱門景點，包含詳細信息和實用貼士
- **安全可靠**: 使用安全的API和加密技術，保護您的個人信息

### 🔄 自動化流程
1. **輸入旅行信息**: 告訴我們您的目的地、出發日期和旅行天數
2. **AI自動搜索**: 我們的AI會自動搜索最優惠的機票、酒店和景點信息
3. **接收完整報告**: 在旅行前三天，您會收到詳細的旅遊報告到郵箱

## 技術架構

### 後端技術
- **Node.js**: 運行時環境
- **Express.js**: Web框架
- **SQLite**: 數據庫
- **JWT**: 身份認證
- **Node-cron**: 任務調度
- **Nodemailer**: 郵件發送

### 前端技術
- **Bootstrap 5**: UI框架
- **Font Awesome**: 圖標庫
- **Vanilla JavaScript**: 前端邏輯

### 第三方API
- **Amadeus API**: 航班和酒店搜索
- **OpenAI API**: AI報告生成
- **OpenWeatherMap API**: 天氣信息（可選）

## 安裝和設置

### 1. 克隆項目
```bash
git clone <repository-url>
cd travel-easy
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 環境配置
複製 `.env.example` 到 `.env` 並填寫必要的配置：

```env
# 服務器配置
PORT=3000
NODE_ENV=development

# 數據庫配置
DATABASE_URL=./data/travel_easy.db

# Amadeus API 配置
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
AMADEUS_API_URL=https://test.api.amadeus.com/v1

# OpenAI API 配置
OPENAI_API_KEY=your_openai_api_key

# 郵件配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# JWT 密鑰
JWT_SECRET=your_jwt_secret_key

# 其他API配置
WEATHER_API_KEY=your_weather_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. 獲取API密鑰

#### Amadeus API
1. 訪問 [Amadeus for Developers](https://developers.amadeus.com/)
2. 註冊帳號並創建應用
3. 獲取 Client ID 和 Client Secret

#### OpenAI API
1. 訪問 [OpenAI Platform](https://platform.openai.com/)
2. 創建帳號並獲取API密鑰

#### 郵件配置
- 如果使用Gmail，需要開啟兩步驗證並生成應用密碼
- 或者使用其他SMTP服務

### 5. 啟動服務器
```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

訪問 http://localhost:3000 開始使用

## 使用指南

### 1. 註冊/登錄
- 訪問首頁，點擊"立即開始"
- 填寫註冊信息或登錄現有帳號

### 2. 創建旅行計劃
1. 在儀表板點擊"新建計劃"
2. 填寫目的地、出發日期、回程日期和旅行天數
3. 點擊"創建計劃"

### 3. 自動處理流程
- 系統會自動在旅行前3天開始搜索
- 搜索航班、酒店、景點和天氣信息
- 生成詳細的旅遊報告
- 自動發送到您的郵箱

### 4. 查看和管理
- 在儀表板查看所有旅行計劃
- 查看詳細的搜索結果和報告
- 可以手動觸發重新搜索或重新生成報告

## API文檔

### 認證端點
- `POST /auth/register` - 用戶註冊
- `POST /auth/login` - 用戶登錄
- `GET /auth/me` - 獲取當前用戶信息
- `PUT /auth/profile` - 更新個人資料

### 旅行計劃端點
- `POST /travel/plans` - 創建旅行計劃
- `GET /travel/plans` - 獲取所有旅行計劃
- `GET /travel/plans/:id` - 獲取特定計劃詳情
- `PUT /travel/plans/:id/status` - 更新計劃狀態
- `DELETE /travel/plans/:id` - 刪除旅行計劃

### API搜索端點
- `GET /api/flights` - 搜索航班
- `GET /api/hotels` - 搜索酒店
- `GET /api/cities` - 獲取城市代碼
- `GET /api/airports` - 獲取機場代碼

## 數據庫結構

### 主要表
- `users` - 用戶信息
- `travel_plans` - 旅行計劃
- `flight_info` - 航班信息
- `hotel_info` - 酒店信息
- `attractions` - 景點信息
- `weather_info` - 天氣信息
- `transportation_info` - 交通信息
- `reports` - 旅遊報告
- `tasks` - 任務隊列

## 部署

### 本地部署
```bash
npm install
npm start
```

### Docker部署
```bash
docker build -t travel-easy .
docker run -p 3000:3000 travel-easy
```

### 雲端部署
支持部署到：
- Heroku
- Railway
- Render
- Vercel
- 其他Node.js平台

## 開發指南

### 項目結構
```
src/
├── db/           # 數據庫相關
├── routes/       # 路由處理
├── services/     # 業務邏輯
├── views/        # 前端視圖
└── index.js      # 主應用文件
```

### 添加新功能
1. 在 `services/` 中添加業務邏輯
2. 在 `routes/` 中添加API端點
3. 在 `views/` 中添加前端頁面
4. 更新數據庫結構（如需要）

### 測試
```bash
npm test
```

## 故障排除

### 常見問題

1. **Amadeus API錯誤**
   - 檢查API密鑰是否正確
   - 確認API配額是否充足
   - 檢查網絡連接

2. **郵件發送失敗**
   - 檢查SMTP配置
   - 確認郵箱密碼正確
   - 檢查防火牆設置

3. **數據庫錯誤**
   - 檢查數據庫文件權限
   - 確認數據庫路徑正確
   - 重新初始化數據庫

### 日誌查看
```bash
# 查看應用日誌
tail -f logs/app.log

# 查看錯誤日誌
tail -f logs/error.log
```

## 貢獻指南

1. Fork 項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

本項目採用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解詳情

## 聯繫方式

- 項目維護者: [您的姓名]
- 郵箱: [您的郵箱]
- 項目鏈接: [GitHub鏈接]

## 更新日誌

### v1.0.0 (2024-01-01)
- 初始版本發布
- 基本旅遊規劃功能
- AI報告生成
- 自動郵件通知

---

**旅遊易** - 讓AI為您規劃完美的旅行體驗 ✈️
