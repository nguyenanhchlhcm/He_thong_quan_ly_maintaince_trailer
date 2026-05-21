const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkLatestTicket() {
  console.log('--- ĐANG TRUY VẤN PHIẾU BẢO TRÌ MỚI NHẤT TRÊN DATABASE ---');

  let supabaseUrl = null;
  let supabaseKey = null;

  // Load env.local manually
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const matchUrl = line.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)$/);
      const matchKey = line.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+)$/);
      if (matchUrl) supabaseUrl = matchUrl[1].trim();
      if (matchKey) supabaseKey = matchKey[1].trim();
    });
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Lỗi: Không tìm thấy Supabase credentials trong env!');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: tickets, error } = await supabase
      .from('phieu_bao_tri')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Lỗi khi truy vấn phiếu mới nhất:', error.message);
      return;
    }

    if (!tickets || tickets.length === 0) {
      console.log('Chưa có phiếu bảo trì nào được lưu trên database.');
      return;
    }

    const ticket = tickets[0];

    console.log('✅ ĐÃ TÌM THẤY PHIẾU MỚI NHẤT:');
    console.log(`• ID Phiếu: ${ticket.id}`);
    console.log(`• Mã phiếu: ${ticket.ma_phieu}`);
    console.log(`• ID Xe: ${ticket.id_xe}`);
    console.log(`• Trạng thái: ${ticket.trang_thai_phieu}`);
    console.log(`• Ngày tiếp nhận: ${ticket.ngay_tiep_nhan}`);
    console.log(`• Tiền công: ${ticket.tien_cong} đ`);
    console.log(`• Chi phí vật tư: ${ticket.tong_vat_tu} đ`);
    console.log(`• Tổng chi phí: ${ticket.tong_chi_phi} đ`);
    console.log(`• Thời điểm tạo: ${ticket.created_at}`);
  } catch (err) {
    console.error('❌ Lỗi hệ thống:', err.message);
  }
}

checkLatestTicket();
