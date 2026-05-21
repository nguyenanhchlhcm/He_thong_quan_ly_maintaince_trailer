const fs = require('fs');
const path = require('path');

async function testTelegram() {
  console.log('--- KHỞI CHẠY KIỂM THỬ TELEGRAM ---');

  let botToken = process.env.TELEGRAM_BOT_TOKEN;
  let chatId = process.env.TELEGRAM_CHAT_ID;

  // Read .env.local manually if it exists
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('Phát hiện tệp .env.local, đang phân tích...');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const matchBot = line.match(/^TELEGRAM_BOT_TOKEN\s*=\s*(.+)$/);
      const matchChat = line.match(/^TELEGRAM_CHAT_ID\s*=\s*(.+)$/);
      if (matchBot) botToken = matchBot[1].trim();
      if (matchChat) chatId = matchChat[1].trim();
    });
  }

  if (!botToken || !chatId) {
    console.error('❌ LỖI: Không tìm thấy TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID!');
    console.error('Vui lòng kiểm tra lại xem anh đã ghi thông tin vào tệp .env.local và LƯU LẠI tệp chưa.');
    return;
  }

  console.log(`Tìm thấy Bot Token: ${botToken.slice(0, 10)}... (Đã ẩn)`);
  console.log(`Tìm thấy Chat ID: ${chatId}`);

  const testMessage = `
🔔 <b>THỬ NGHIỆM KẾT NỐI HỆ THỐNG THÀNH CÔNG!</b>

Hệ thống quản lý bảo trì xe <b>C.H.L Logistics</b> đã kết nối thành công tới Group Admin Telegram của anh!

🛠️ <b>Chi tiết Thử nghiệm:</b>
• Phân hệ: <code>Test Engine (Antigravity)</code>
• Trạng thái: <tg-spoiler><b>HOẠT ĐỘNG 100%</b></tg-spoiler>
• Thời gian: <code>${new Date().toLocaleString('vi-VN')}</code>

👉 <i>Đây là tin nhắn tự động từ hệ thống Next.js Server-side. Mọi hoạt động lập phiếu, duyệt phiếu tiếp theo sẽ được gửi trực tiếp về đây.</i>
  `;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    console.log('Đang gửi tin nhắn thử nghiệm tới Telegram...');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();
    if (data.ok) {
      console.log('✅ THÀNH CÔNG RỰC RỠ! Tin nhắn thử nghiệm đã được gửi về Group của anh.');
    } else {
      console.error('❌ LỖI TỪ TELEGRAM API:', data.description);
    }
  } catch (error) {
    console.error('❌ LỖI NGOẠI LỆ KHI GỬI:', error.message);
  }
}

testTelegram();
