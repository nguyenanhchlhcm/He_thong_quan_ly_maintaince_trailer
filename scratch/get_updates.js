const fs = require('fs');
const path = require('path');

async function getUpdates() {
  console.log('--- ĐANG TRUY VẤN LỊCH SỬ SỰ KIỆN BOT TELEGRAM ---');

  let botToken = null;

  // Read .env.local manually
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const matchBot = line.match(/^TELEGRAM_BOT_TOKEN\s*=\s*(.+)$/);
      if (matchBot) botToken = matchBot[1].trim();
    });
  }

  if (!botToken) {
    console.error('❌ Không tìm thấy TELEGRAM_BOT_TOKEN trong .env.local');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.ok) {
      console.log('✅ TRUY VẤN THÀNH CÔNG!');
      if (data.result.length === 0) {
        console.log('Cảnh báo: Bot chưa ghi nhận sự kiện nào gần đây.');
        console.log('Mẹo: Anh hãy gõ một tin nhắn bất kỳ (ví dụ: "alo") vào nhóm RepairCHL có chứa Bot để kích hoạt sự kiện mới, rồi chạy lại nhé!');
        return;
      }

      console.log(`Tìm thấy ${data.result.length} sự kiện:`);
      data.result.forEach((update, index) => {
        console.log(`\n[Sự kiện ${index + 1}]`);
        
        // Check message
        if (update.message) {
          const chat = update.message.chat;
          console.log(`• Kiểu: Tin nhắn (${chat.type})`);
          console.log(`• Tên nhóm/Người gửi: ${chat.title || chat.first_name || 'N/A'}`);
          console.log(`• ID CHÍNH XÁC: ${chat.id}`);
          if (update.message.text) {
            console.log(`• Nội dung: "${update.message.text}"`);
          }
        } 
        // Check my_chat_member
        else if (update.my_chat_member) {
          const chat = update.my_chat_member.chat;
          console.log(`• Kiểu: Trạng thái thành viên bot (${chat.type})`);
          console.log(`• Tên nhóm: ${chat.title || 'N/A'}`);
          console.log(`• ID CHÍNH XÁC: ${chat.id}`);
        }
        // Check channel_post
        else if (update.channel_post) {
          const chat = update.channel_post.chat;
          console.log(`• Kiểu: Bài đăng kênh (${chat.type})`);
          console.log(`• Tên kênh: ${chat.title || 'N/A'}`);
          console.log(`• ID CHÍNH XÁC: ${chat.id}`);
        }
      });
    } else {
      console.error('❌ Lỗi Telegram API:', data.description);
    }
  } catch (err) {
    console.error('❌ Lỗi mạng:', err.message);
  }
}

getUpdates();
