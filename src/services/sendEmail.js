import nodemailer from 'nodemailer';

function buildHtml(trip, report) {
  const { flights, hotels, attractions, transport, weather } = report;
  const lines = [];
  lines.push(`<h2>你的旅遊資訊 - 旅遊易</h2>`);
  lines.push(`<p>${trip.name} 你好，以下是 ${trip.country} ${trip.city} 行程的最新資訊：</p>`);

  lines.push('<h3>航班</h3><ul>');
  for (const f of flights) {
    lines.push(`<li>${f.provider} - HKD ${f.priceHKD} | 去程 ${f.depart} 回程 ${f.return} | <a href="${f.url}">連結</a></li>`);
  }
  lines.push('</ul>');

  lines.push('<h3>酒店</h3><ul>');
  for (const h of hotels) {
    lines.push(`<li>${h.name} - 每晚 HKD ${h.pricePerNightHKD} - ${h.availability} | 電話 ${h.phone} | <a href="${h.url}">連結</a></li>`);
  }
  lines.push('</ul>');

  lines.push('<h3>景點</h3><ul>');
  for (const a of attractions) {
    lines.push(`<li>${a.name} (${a.area}) - <a href="${a.url}">官方網站</a></li>`);
  }
  lines.push('</ul>');

  lines.push('<h3>交通貼士</h3><ul>');
  for (const t of transport) {
    lines.push(`<li>${t.title} - <a href="${t.url}">連結</a></li>`);
  }
  lines.push('</ul>');

  lines.push('<h3>天氣預報</h3><ul>');
  for (const w of weather) {
    lines.push(`<li>${w.date}: ${w.summary}, ${w.tempMinC}-${w.tempMaxC}°C</li>`);
  }
  lines.push('</ul>');

  lines.push('<p>祝旅途愉快！</p>');
  return lines.join('\n');
}

export async function sendItineraryEmail(trip, report, logger) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || 'TravelEase <no-reply@travelease.local>';

  if (!host || !user || !pass) {
    logger.warn('SMTP is not configured; skipping email send.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const html = buildHtml(trip, report);

  await transporter.sendMail({
    from,
    to: trip.email,
    subject: `你的旅遊資訊：${trip.country} ${trip.city}（出發日 ${trip.start_date}）`,
    html,
  });

  logger.info({ to: trip.email }, 'Email sent');
}

