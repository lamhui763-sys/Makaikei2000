import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

// 初始化郵件傳輸器
function initTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured');
    return null;
  }

  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

/**
 * 發送旅遊報告郵件
 */
export async function sendTravelReport(userEmail, userName, destination, travelReport, flightInfo, hotelInfo, weatherInfo) {
  try {
    if (!transporter) {
      transporter = initTransporter();
    }

    if (!transporter) {
      console.error('Email service not configured');
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    const htmlContent = generateEmailHTML(userName, destination, travelReport, flightInfo, hotelInfo, weatherInfo);

    const mailOptions = {
      from: `"旅遊易 Travel Easy" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🏝️ ${destination} 旅遊攻略報告 - 旅遊易為您精心準備`,
      html: htmlContent,
      attachments: []
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 生成郵件HTML內容
 */
function generateEmailHTML(userName, destination, travelReport, flightInfo, hotelInfo, weatherInfo) {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${destination} 旅遊攻略</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .flight-info, .hotel-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .flight-item, .hotel-item {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #667eea;
        }
        .weather-info {
            background: linear-gradient(45deg, #FEB692 0%, #EA5455 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            background: white;
            border-radius: 10px;
            margin-top: 20px;
        }
        .logo {
            font-size: 1.5em;
            font-weight: bold;
            color: #667eea;
        }
        .price {
            color: #e74c3c;
            font-weight: bold;
            font-size: 1.1em;
        }
        .rating {
            color: #f39c12;
            font-weight: bold;
        }
        .ai-content {
            white-space: pre-line;
            line-height: 1.8;
        }
        .highlight {
            background: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #ffc107;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏝️ ${destination} 旅遊攻略</h1>
        <p>親愛的 ${userName}，您的專屬旅遊報告已準備好！</p>
    </div>

    <div class="content">
        <div class="highlight">
            <strong>🎉 旅遊易小提醒：</strong>
            我們已為您搜集了最新的航班、酒店和天氣資訊，祝您旅途愉快！
        </div>

        ${flightInfo && flightInfo.length > 0 ? `
        <div class="section">
            <h2>✈️ 航班資訊</h2>
            <div class="flight-info">
                ${flightInfo.map(flight => `
                <div class="flight-item">
                    <h3>${flight.airline} ${flight.flightNumber}</h3>
                    <p><strong>出發：</strong>${flight.departure.airport} ${new Date(flight.departure.time).toLocaleString('zh-TW')}</p>
                    <p><strong>抵達：</strong>${flight.arrival.airport} ${new Date(flight.arrival.time).toLocaleString('zh-TW')}</p>
                    <p><strong>航行時間：</strong>${flight.duration}</p>
                    <p class="price">價格：${flight.currency} ${flight.price}</p>
                    ${flight.deepLink ? `<p><a href="${flight.deepLink}" style="color: #667eea;">點擊預訂</a></p>` : ''}
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${hotelInfo && hotelInfo.length > 0 ? `
        <div class="section">
            <h2>🏨 酒店資訊</h2>
            <div class="hotel-info">
                ${hotelInfo.map(hotel => `
                <div class="hotel-item">
                    <h3>${hotel.name}</h3>
                    ${hotel.rating ? `<p class="rating">評級：${'⭐'.repeat(hotel.rating)}</p>` : ''}
                    ${hotel.price ? `<p class="price">價格：${hotel.currency} ${hotel.price}/晚</p>` : ''}
                    ${hotel.contact && hotel.contact.phone ? `<p><strong>電話：</strong>${hotel.contact.phone}</p>` : ''}
                    ${hotel.address ? `<p><strong>地址：</strong>${hotel.address}</p>` : ''}
                    ${hotel.amenities && hotel.amenities.length > 0 ? `<p><strong>設施：</strong>${hotel.amenities.join(', ')}</p>` : ''}
                    ${hotel.bookingUrl ? `<p><a href="${hotel.bookingUrl}" style="color: #667eea;">查看詳情</a></p>` : ''}
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${weatherInfo ? `
        <div class="section">
            <h2>🌤️ 天氣資訊</h2>
            <div class="weather-info">
                <div class="ai-content">${weatherInfo}</div>
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2>🗺️ AI 旅遊攻略</h2>
            <div class="ai-content">${travelReport.content || '正在為您準備詳細的旅遊攻略...'}</div>
        </div>
    </div>

    <div class="footer">
        <div class="logo">旅遊易 Travel Easy</div>
        <p>專業的AI旅遊助理，為您規劃完美旅程</p>
        <p style="font-size: 0.9em; color: #999;">
            此郵件由旅遊易系統自動發送，請勿直接回覆
        </p>
    </div>
</body>
</html>
  `;
}

/**
 * 發送確認郵件
 */
export async function sendConfirmationEmail(userEmail, userName, destination, startDate, duration) {
  try {
    if (!transporter) {
      transporter = initTransporter();
    }

    if (!transporter) {
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    const mailOptions = {
      from: `"旅遊易 Travel Easy" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎯 旅遊計劃確認 - ${destination}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #667eea;">旅遊計劃確認</h2>
          <p>親愛的 ${userName}，</p>
          <p>感謝您使用旅遊易服務！我們已收到您的旅遊計劃：</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>目的地：</strong>${destination}</p>
            <p><strong>出發日期：</strong>${startDate}</p>
            <p><strong>旅行天數：</strong>${duration}天</p>
          </div>
          <p>我們將在出發前3天為您搜集最新的航班、酒店和旅遊資訊，並發送詳細的旅遊攻略到您的郵箱。</p>
          <p>祝您旅途愉快！</p>
          <div style="text-align: center; margin-top: 30px; color: #666;">
            <p><strong>旅遊易 Travel Easy</strong></p>
            <p>您的專屬AI旅遊助理</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Confirmation email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}