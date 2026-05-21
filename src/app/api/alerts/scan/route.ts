import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Allow if authenticated with ADMIN/MANAGER role OR check x-cron-secret
    let isAuthorized = false
    
    if (user) {
      const role = (user.user_metadata?.role as string) || 'MECHANIC'
      if (role === 'ADMIN' || role === 'MANAGER') {
        isAuthorized = true
      }
    }
    
    const authHeader = request.headers.get('Authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Initialize Supabase Admin Client
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // 3. Call generate_maintenance_alerts DB function
    const { error: rpcError } = await supabaseAdmin.rpc('generate_maintenance_alerts')
    if (rpcError) throw rpcError

    // 4. Query unresolved alerts that have NOT been notified to Telegram yet
    const { data: pendingAlerts, error: fetchError } = await supabaseAdmin
      .from('system_alerts')
      .select('*')
      .eq('is_resolved', false)
      .eq('notified_telegram', false)

    if (fetchError) throw fetchError

    let telegramNotificationsSent = 0

    // 5. Send Telegram notifications for CRITICAL alerts
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (botToken && chatId && pendingAlerts && pendingAlerts.length > 0) {
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`

      for (const alert of pendingAlerts) {
        // Send alert if it is CRITICAL
        if (alert.severity === 'CRITICAL') {
          let emoji = alert.type === 'GIAN LẬN' ? '🚨' : '⚠️'
          let title = alert.type === 'GIAN LẬN' ? 'PHÁT HIỆN GIAN LẬN GPS' : 'CẢNH BÁO BẢO TRÌ QUÁ HẠN'
          
          let messageHtml = `
${emoji} <b>${title}</b>

📢 <b>Nội dung:</b> ${alert.message}
⏰ <b>Thời gian:</b> <i>${new Date(alert.created_at).toLocaleString('vi-VN')}</i>

👉 <a href="https://he-thong-quan-ly-maintaince-trailer.vercel.app/admin/alerts">Xem chi tiết tại đây</a>
          `.trim()

          try {
            const telResponse = await fetch(telegramUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: messageHtml,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
              }),
            })

            if (telResponse.ok) {
              // Update notified_telegram = true in DB
              await supabaseAdmin
                .from('system_alerts')
                .update({ notified_telegram: true })
                .eq('id', alert.id)
              
              telegramNotificationsSent++
            } else {
              const errData = await telResponse.json()
              console.error('Telegram notification failed for alert:', alert.id, errData)
            }
          } catch (telErr) {
            console.error('Error calling Telegram API:', telErr)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đã quét và cập nhật cảnh báo thành công.',
      newAlertsCount: pendingAlerts?.length || 0,
      telegramNotificationsSent
    })

  } catch (error: any) {
    console.error('Error in scan alerts API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
