import nodemailer from 'nodemailer';
import { getDatabase } from '../db/init.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendTravelReport(userEmail, userName, travelPlan, reportData) {
    try {
      const { flights, hotels, attractions, weather, transport, guide } = reportData;
      
      const htmlContent = this.generateReportHTML(userName, travelPlan, reportData);
      const textContent = this.generateReportText(userName, travelPlan, reportData);

      const mailOptions = {
        from: `"旅遊易" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `【旅遊易】${travelPlan.destination} ${travelPlan.duration}天旅遊報告`,
        text: textContent,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      // 記錄發送日誌
      const db = getDatabase();
      db.prepare(`
        INSERT INTO report_logs (travel_plan_id, report_type, status)
        VALUES (?, ?, ?)
      `).run(travelPlan.id, 'travel_report', 'sent');

      console.log('Travel report sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Failed to send travel report:', error);
      
      // 記錄發送失敗
      const db = getDatabase();
      db.prepare(`
        INSERT INTO report_logs (travel_plan_id, report_type, status)
        VALUES (?, ?, ?)
      `).run(travelPlan.id, 'travel_report', 'failed');
      
      throw error;
    }
  }

  generateReportHTML(userName, travelPlan, reportData) {
    const { flights, hotels, attractions, weather, transport, guide } = reportData;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>旅遊易 - ${travelPlan.destination} 旅遊報告</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .section { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .section h2 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .flight-item, .hotel-item, .attraction-item { 
            background: #f9f9f9; margin: 15px 0; padding: 15px; border-radius: 5px; 
            border-left: 4px solid #667eea;
        }
        .price { color: #e74c3c; font-weight: bold; font-size: 1.2em; }
        .rating { color: #f39c12; }
        .weather-box { background: #e3f2fd; padding: 15px; border-radius: 5px; }
        .guide-content { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .btn { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏖️ 旅遊易</h1>
            <h2>${travelPlan.destination} ${travelPlan.duration}天旅遊報告</h2>
            <p>親愛的 ${userName}，您的個人旅遊助理已為您準備好完整的旅遊資訊！</p>
        </div>

        <div class="section">
            <h2>✈️ 航班資訊</h2>
            ${flights.map(flight => `
                <div class="flight-item">
                    <h3>${flight.airline} ${flight.flightNumber}</h3>
                    <p><strong>出發：</strong>${flight.departureAirport} → ${flight.arrivalAirport}</p>
                    <p><strong>時間：</strong>${new Date(flight.departureTime).toLocaleString()} - ${new Date(flight.arrivalTime).toLocaleString()}</p>
                    <p class="price">價格：${flight.price} ${flight.currency}</p>
                    <a href="${flight.bookingUrl}" class="btn">立即預訂</a>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>🏨 酒店推薦</h2>
            ${hotels.map(hotel => `
                <div class="hotel-item">
                    <h3>${hotel.name}</h3>
                    <p><strong>地址：</strong>${hotel.address}</p>
                    <p><strong>評分：</strong><span class="rating">${hotel.rating} ⭐</span></p>
                    <p class="price">每晚：${hotel.price} ${hotel.currency}</p>
                    <a href="${hotel.bookingUrl}" class="btn">查看詳情</a>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>🎯 必去景點</h2>
            ${attractions.map(attraction => `
                <div class="attraction-item">
                    <h3>${attraction.name}</h3>
                    <p>${attraction.description}</p>
                    <p><strong>評分：</strong><span class="rating">${attraction.rating} ⭐</span></p>
                    <p><strong>門票：</strong>${attraction.ticketPrice} HKD</p>
                    <p><strong>開放時間：</strong>${attraction.openingHours}</p>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>🌤️ 天氣預報</h2>
            <div class="weather-box">
                <p><strong>溫度：</strong>${weather.temperature}°C</p>
                <p><strong>天氣：</strong>${weather.description}</p>
                <p><strong>濕度：</strong>${weather.humidity}%</p>
                <p><strong>風速：</strong>${weather.windSpeed} km/h</p>
            </div>
        </div>

        <div class="section">
            <h2>🚇 交通資訊</h2>
            <div class="weather-box">
                <p><strong>機場：</strong>${transport.airport}</p>
                <p><strong>公共交通：</strong>${transport.publicTransport}</p>
                <p><strong>機場接送：</strong>${transport.airportTransfer}</p>
                <p><strong>當地交通：</strong>${transport.localTransport}</p>
                <p><strong>交通卡：</strong>${transport.transportCard}</p>
            </div>
        </div>

        <div class="section">
            <h2>📖 旅遊攻略</h2>
            <div class="guide-content">
                ${guide.replace(/\n/g, '<br>')}
            </div>
        </div>

        <div class="footer">
            <p>感謝您使用旅遊易！</p>
            <p>如有任何問題，請隨時聯繫我們。</p>
            <p>祝您旅途愉快！ 🌟</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  generateReportText(userName, travelPlan, reportData) {
    const { flights, hotels, attractions, weather, transport, guide } = reportData;
    
    return `
旅遊易 - ${travelPlan.destination} ${travelPlan.duration}天旅遊報告

親愛的 ${userName}，

您的個人旅遊助理已為您準備好完整的旅遊資訊！

=== 航班資訊 ===
${flights.map(flight => `
${flight.airline} ${flight.flightNumber}
出發：${flight.departureAirport} → ${flight.arrivalAirport}
時間：${new Date(flight.departureTime).toLocaleString()} - ${new Date(flight.arrivalTime).toLocaleString()}
價格：${flight.price} ${flight.currency}
`).join('')}

=== 酒店推薦 ===
${hotels.map(hotel => `
${hotel.name}
地址：${hotel.address}
評分：${hotel.rating} ⭐
每晚：${hotel.price} ${hotel.currency}
`).join('')}

=== 必去景點 ===
${attractions.map(attraction => `
${attraction.name}
${attraction.description}
評分：${attraction.rating} ⭐
門票：${attraction.ticketPrice} HKD
開放時間：${attraction.openingHours}
`).join('')}

=== 天氣預報 ===
溫度：${weather.temperature}°C
天氣：${weather.description}
濕度：${weather.humidity}%
風速：${weather.windSpeed} km/h

=== 交通資訊 ===
機場：${transport.airport}
公共交通：${transport.publicTransport}
機場接送：${transport.airportTransfer}
當地交通：${transport.localTransport}
交通卡：${transport.transportCard}

=== 旅遊攻略 ===
${guide}

感謝您使用旅遊易！
如有任何問題，請隨時聯繫我們。
祝您旅途愉快！ 🌟
    `;
  }
}

export const emailService = new EmailService();