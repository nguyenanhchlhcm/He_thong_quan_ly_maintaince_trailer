const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function listUsers() {
  console.log('--- ĐANG TRUY VẤN DANH SÁCH UIDS CHÍNH XÁC ---');

  let supabaseUrl = null;
  let serviceRoleKey = null;

  // Load env.local
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

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Lỗi:', error.message);
      return;
    }

    console.log('Tìm thấy các người dùng sau:');
    users.forEach(u => {
      console.log(`• Email: ${u.email} ➔ UID: ${u.id}`);
    });
  } catch (err) {
    console.error('❌ Lỗi ngoại lệ:', err.message);
  }
}

listUsers();
