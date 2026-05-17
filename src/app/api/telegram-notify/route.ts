import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, ticket } = body

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    // Silent fallback if Telegram is not configured yet
    if (!botToken || !chatId) {
      console.warn('Telegram Bot Token or Chat ID is missing in environment variables. Skipping notification.')
      return NextResponse.json({ success: true, message: 'Telegram credentials not configured.' })
    }

    let messageHtml = ''

    if (type === 'new_ticket') {
      messageHtml = `
🛠️ <b>YÊU CẦU BẢO TRÌ MỚI CẦN DUYỆT</b>

📌 <b>Mã phiếu:</b> <code>${ticket.ma_phieu}</code>
🚛 <b>Biển số xe:</b> <code>${ticket.bien_so}</code>
🔧 <b>Loại phiếu:</b> <b>${ticket.loai_phieu}</b>
👨‍🔧 <b>Thợ máy thực hiện:</b> <b>${ticket.tho_may}</b>
📅 <b>Ngày tiếp nhận:</b> <i>${ticket.ngay_tiep_nhan}</i>
💵 <b>Chi phí dự kiến:</b> <code>${ticket.tong_chi_phi.toLocaleString('vi-VN')} VNĐ</code>

👉 <a href="https://he-thong-quan-ly-maintaince-trailer.vercel.app/admin/tickets">Xem chi tiết và phê duyệt tại đây</a>
      `.trim()
    } else if (type === 'status_change') {
      let icon = '🔄'
      if (ticket.new_status === 'Đang sửa') icon = '⚙️'
      if (ticket.new_status === 'Đã xong') icon = '✅'
      if (ticket.new_status === 'Báo giá') icon = '📝'

      messageHtml = `
${icon} <b>CẬP NHẬT TRẠNG THÁI PHIẾU BẢO TRÌ</b>

📌 <b>Mã phiếu:</b> <code>${ticket.ma_phieu}</code>
🚛 <b>Biển số xe:</b> <code>${ticket.bien_so}</code>
💵 <b>Tổng chi phí:</b> <code>${ticket.tong_chi_phi.toLocaleString('vi-VN')} VNĐ</code>
⚡ <b>Trạng thái:</b> <s>${ticket.old_status}</s> ➡️ <b>${ticket.new_status}</b>

👉 <a href="https://he-thong-quan-ly-maintaince-trailer.vercel.app/admin/tickets">Xem thông tin chi tiết</a>
      `.trim()
    }

    if (!messageHtml) {
      return NextResponse.json({ success: false, error: 'Invalid notification type' }, { status: 400 })
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    const responseData = await response.json()
    if (!response.ok || !responseData.ok) {
      console.error('Telegram API response error:', responseData)
      return NextResponse.json({ success: false, error: responseData.description || 'Failed to send Telegram message' })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error sending Telegram notification:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
