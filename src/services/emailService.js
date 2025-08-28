import nodemailer from 'nodemailer';
import { getDatabase } from '../db/database.js';

class EmailService {
  constructor() {
    this.transporter = null;
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
  }

  async sendTravelReport(userEmail, travelPlan, reportContent) {
    try {
      if (!this.transporter) {
        console.log('郵件服務未配置，跳過郵件發送');
        return { messageId: 'mock-email-id' };
      }

      const startDate = new Date(travelPlan.start_date).toLocaleDateString('zh-TW');
      const endDate = new Date(travelPlan.end_date).toLocaleDateString('zh-TW');

      const mailOptions = {
        from: `"旅遊易" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `【旅遊易】您的${travelPlan.destination}旅遊報告已準備完成`,
        html: this.generateEmailTemplate(travelPlan, reportContent, startDate, endDate)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      // 更新報告狀態
      const db = getDatabase();
      db.prepare(`
        UPDATE reports 
        SET sent_at = CURRENT_TIMESTAMP, status = 'sent' 
        WHERE travel_plan_id = ? AND report_type = 'travel_report'
      `).run(travelPlan.id);

      console.log('旅遊報告郵件發送成功:', result.messageId);
      return result;
    } catch (error) {
      console.error('發送旅遊報告郵件失敗:', error);
      throw new Error('無法發送郵件');
    }
  }

  generateEmailTemplate(travelPlan, reportContent, startDate, endDate) {
    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>旅遊易 - 您的旅遊報告</title>
    <style>
        body {
            font-family: 'Microsoft JhengHei', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4CAF50;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            color: #666;
            margin: 10px 0 0 0;
        }
        .trip-info {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .trip-info h2 {
            color: #4CAF50;
            margin-top: 0;
        }
        .trip-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .detail-item {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #4CAF50;
        }
        .detail-item strong {
            color: #4CAF50;
        }
        .report-content {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        .report-content h2 {
            color: #4CAF50;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
        }
        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .highlight {
            background-color: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
        }
        .highlight strong {
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏖️ 旅遊易</h1>
            <p>您的智能旅遊規劃個人助理</p>
        </div>

        <div class="trip-info">
            <h2>📋 旅行計劃概覽</h2>
            <div class="trip-details">
                <div class="detail-item">
                    <strong>目的地：</strong><br>
                    ${travelPlan.destination}
                </div>
                <div class="detail-item">
                    <strong>出發日期：</strong><br>
                    ${startDate}
                </div>
                <div class="detail-item">
                    <strong>回程日期：</strong><br>
                    ${endDate}
                </div>
                <div class="detail-item">
                    <strong>旅行天數：</strong><br>
                    ${travelPlan.duration} 天
                </div>
            </div>
        </div>

        <div class="highlight">
            <strong>🎯 重要提醒：</strong><br>
            您的旅遊報告已準備完成！請仔細閱讀以下內容，這將幫助您享受完美的旅行體驗。
        </div>

        <div class="report-content">
            <h2>📄 詳細旅遊報告</h2>
            ${reportContent.replace(/\n/g, '<br>')}
        </div>

        <div class="footer">
            <p>感謝您使用旅遊易服務！</p>
            <p>如有任何問題，請聯繫我們的客服團隊</p>
            <p>© 2024 旅遊易 - 讓AI為您規劃完美的旅行體驗</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  async sendItineraryReminder(userEmail, travelPlan) {
    try {
      const startDate = new Date(travelPlan.start_date).toLocaleDateString('zh-TW');
      const daysUntilTrip = Math.ceil((new Date(travelPlan.start_date) - new Date()) / (1000 * 60 * 60 * 24));

      const mailOptions = {
        from: `"旅遊易" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `【旅遊易】提醒：您的${travelPlan.destination}之旅即將開始`,
        html: this.generateReminderTemplate(travelPlan, startDate, daysUntilTrip)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('行程提醒郵件發送成功:', result.messageId);
      return result;
    } catch (error) {
      console.error('發送行程提醒郵件失敗:', error);
      throw new Error('無法發送提醒郵件');
    }
  }

  generateReminderTemplate(travelPlan, startDate, daysUntilTrip) {
    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>旅遊易 - 行程提醒</title>
    <style>
        body {
            font-family: 'Microsoft JhengHei', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #FF6B35;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #FF6B35;
            margin: 0;
        }
        .reminder-box {
            background-color: #fff3cd;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
        }
        .countdown {
            text-align: center;
            font-size: 24px;
            color: #FF6B35;
            font-weight: bold;
            margin: 20px 0;
        }
        .checklist {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .checklist h3 {
            color: #FF6B35;
            margin-top: 0;
        }
        .checklist ul {
            list-style-type: none;
            padding: 0;
        }
        .checklist li {
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .checklist li:before {
            content: "☐ ";
            color: #FF6B35;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎒 旅遊易 - 行程提醒</h1>
        </div>

        <div class="reminder-box">
            <h2>您的${travelPlan.destination}之旅即將開始！</h2>
            <p>出發日期：${startDate}</p>
            <p>旅行天數：${travelPlan.duration}天</p>
        </div>

        <div class="countdown">
            距離出發還有 ${daysUntilTrip} 天
        </div>

        <div class="checklist">
            <h3>📋 出發前檢查清單</h3>
            <ul>
                <li>確認機票和酒店預訂</li>
                <li>檢查護照和簽證有效期</li>
                <li>準備必要的旅行文件</li>
                <li>確認天氣預報並準備合適衣物</li>
                <li>下載離線地圖和翻譯應用</li>
                <li>準備充電器和轉換插頭</li>
                <li>購買旅行保險</li>
                <li>通知銀行您的旅行計劃</li>
                <li>準備緊急聯繫方式</li>
                <li>檢查行李重量限制</li>
            </ul>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <p>祝您旅途愉快！</p>
            <p>旅遊易團隊</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  async sendWeatherUpdate(userEmail, travelPlan, weatherInfo) {
    try {
      const mailOptions = {
        from: `"旅遊易" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `【旅遊易】${travelPlan.destination}天氣更新`,
        html: this.generateWeatherTemplate(travelPlan, weatherInfo)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('天氣更新郵件發送成功:', result.messageId);
      return result;
    } catch (error) {
      console.error('發送天氣更新郵件失敗:', error);
      throw new Error('無法發送天氣更新');
    }
  }

  generateWeatherTemplate(travelPlan, weatherInfo) {
    const weatherHtml = weatherInfo.map(weather => `
      <div style="background-color: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <strong>${new Date(weather.date).toLocaleDateString('zh-TW')}</strong><br>
        最高溫度：${weather.temperatureHigh}°C<br>
        最低溫度：${weather.temperatureLow}°C<br>
        天氣狀況：${weather.condition}<br>
        濕度：${weather.humidity}%<br>
        風速：${weather.windSpeed} km/h
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>旅遊易 - 天氣更新</title>
    <style>
        body {
            font-family: 'Microsoft JhengHei', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #87CEEB;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #87CEEB;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌤️ 旅遊易 - 天氣更新</h1>
        </div>

        <h2>${travelPlan.destination} 天氣預報</h2>
        <p>您的旅行期間天氣情況如下：</p>

        ${weatherHtml}

        <div style="text-align: center; margin-top: 30px;">
            <p>請根據天氣情況調整您的行程安排！</p>
            <p>旅遊易團隊</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

export default new EmailService();