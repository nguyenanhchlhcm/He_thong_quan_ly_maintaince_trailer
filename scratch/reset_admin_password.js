const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function resetAdminPassword() {
  console.log('--- ĐANG THỰC HIỆN ĐẶT LẠI MẬT KHẨU ADMIN TỐI CAO ---');

  let supabaseUrl = null;
  let serviceRoleKey = null;

  // Load env.local manually
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const matchUrl = line.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)$/);
      const matchKey = line.match(/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)$/);
      if (matchUrl) supabaseUrl = matchUrl[1].trim();
      if (matchKey) serviceRoleKey = matchKey[1].trim();
    });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Lỗi: Không tìm thấy Supabase URL hoặc Service Role Key trong env.local!');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const adminUserId = '58344f17-38a2-42ca-bdf1-f46167803652'; // UID chính xác của nguyenanhchl.hcm@gmail.com từ API
  const newPassword = 'CHLadmin@2026';

  console.log(`Đang kết nối tới Supabase Admin API cho User ID: ${adminUserId}...`);

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      adminUserId,
      { password: newPassword }
    );

    if (error) {
      console.error('❌ Lỗi từ Supabase Admin API:', error.message);
      return;
    }

    console.log('===================================================');
    console.log('✅ ĐẶT LẠI MẬT KHẨU THÀNH CÔNG MỸ MÃN!');
    console.log(`• Tài khoản Admin: nguyenanhchl.hcm@gmail.com`);
    console.log(`• Mật khẩu mới: ${newPassword}`);
    console.log('===================================================');
    console.log('Bây giờ anh đã có thể đăng nhập ngay lập tức với mật khẩu trên!');
  } catch (err) {
    console.error('❌ Lỗi hệ thống khi thực thi:', err.message);
  }
}

resetAdminPassword();
