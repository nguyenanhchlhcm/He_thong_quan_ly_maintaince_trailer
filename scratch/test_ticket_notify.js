const fs = require('fs');
const path = require('path');

async function testTicketNotifications() {
  console.log('--- KHỞI CHẠY GỬI PHIẾU BẢO TRÌ MẪU ---');

  let botToken = null;
  let chatId = null;

  // Read env
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
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
    console.error('❌ Không cấu hình Telegram trong .env.local');
    return;
  }

  // 1. New Ticket Notice HTML
  const newTicketMessage = `
🛠️ <b>YÊU CẦU BẢO TRÌ XE MỚI ĐƯỢC LẬP!</b>

Hệ thống ghi nhận Thợ máy vừa gửi một phiếu bảo trì sửa chữa lên hệ thống.

• <b>Mã phiếu:</b> <code>20260517.001</code> (Mẫu)
• <b>Biển số xe:</b> <code>51C-999.99</code> (Đầu kéo CHL)
• <b>Thợ máy thực hiện:</b> <code>Nguyễn Văn Hùng</code>
• <b>Ngày tiếp nhận:</b> <code>17/05/2026</code>
• <b>Hình thức:</b> Bảo trì định kỳ tại Gara

📋 <b>Danh sách hạng mục sửa chữa:</b>
1. <b>Lốp Bridgestone R150</b> (Số lượng: 4)
   └ Đơn giá: 6.500.000 đ ➔ 26.000.000 đ
2. <b>Dầu động cơ Castrol 15W40</b> (Số lượng: 2)
   └ Đơn giá: 1.200.000 đ ➔ 2.400.000 đ
3. <b>Tiền công thợ máy:</b> ➔ 1.500.000 đ

💰 <b>TỔNG CHI PHÍ DỰ KIẾN:</b> <b><u>29.900.000 đ</u></b>

👉 <a href="https://he-thong-quan-ly-maintaince-trailer.vercel.app/admin/tickets">Xem chi tiết và phê duyệt tại đây</a>
  `;

  // 2. Status Update Notice HTML
  const statusChangeMessage = `
✅ <b>ĐÃ CẬP NHẬT TRẠNG THÁI PHIẾU!</b>

Admin vừa thay đổi trạng thái xử lý của phiếu bảo trì.

• <b>Mã phiếu:</b> <code>20260517.001</code> (Mẫu)
• <b>Biển số xe:</b> <code>51C-999.99</code> (Đầu kéo CHL)
• <b>Tổng chi phí:</b> <b>29.900.000 đ</b>

🔄 <b>Thay đổi trạng thái:</b>
<code>Chờ duyệt</code> ➔ 🟡 <b>ĐANG SỬA CHỮA</b>

👤 <b>Người phê duyệt:</b> <code>Admin C.H.L</code>
📅 <b>Thời gian duyệt:</b> <code>${new Date().toLocaleTimeString('vi-VN')} - 17/05/2026</code>

👉 <a href="https://he-thong-quan-ly-maintaince-trailer.vercel.app/admin/tickets">Xem thông tin chi tiết</a>
  `;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    // Send New Ticket Notice
    console.log('Đang gửi thông báo lập phiếu mới...');
    const res1 = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: newTicketMessage,
        parse_mode: 'HTML'
      })
    });
    const data1 = await res1.json();

    // Send Status Change Notice
    console.log('Đang gửi thông báo duyệt phiếu...');
    const res2 = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: statusChangeMessage,
        parse_mode: 'HTML'
      })
    });
    const data2 = await res2.json();

    if (data1.ok && data2.ok) {
      console.log('✅ THÀNH CÔNG! Đã gửi cả 2 mẫu thông báo (Lập phiếu & Phê duyệt) về nhóm Telegram.');
    } else {
      console.error('❌ Có lỗi xảy ra khi gửi tin nhắn mẫu.');
    }
  } catch (err) {
    console.error('❌ Lỗi kết nối:', err.message);
  }
}

testTicketNotifications();
