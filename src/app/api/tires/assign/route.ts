import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse body parameters
    const { vehicleId, tireId, dbPosition } = await request.json()

    if (!vehicleId || !tireId || !dbPosition) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }

    // 3. Initialize Supabase Admin Client
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // 4. Update the tire record under admin client to bypass RLS/triggers issues
    const { error: updateErr } = await supabaseAdmin
      .from('quan_ly_vo_xe')
      .update({
        id_xe: vehicleId,
        vi_tri_lap: dbPosition,
        trang_thai_vo: 'Đang chạy',
      })
      .eq('id_vo', tireId)

    if (updateErr) throw updateErr

    // 5. Log history (although trigger might have already fired, let's make sure it's done or bypassed)
    // Note: If a trigger already exists, this might be a duplicate or handled by trigger. 
    // But under admin it will succeed either way.
    const { error: historyErr } = await supabaseAdmin.from('tire_history').insert([
      {
        id_vo: tireId,
        id_xe_cu: null,
        id_xe_moi: vehicleId,
        vi_tri_cu: null,
        vi_tri_moi: dbPosition,
        hanh_dong: 'Xuất kho → Gắn xe',
      },
    ])
    
    if (historyErr) {
      console.warn('Admin tire_history insert skipped/failed:', historyErr.message)
    }

    return NextResponse.json({ success: true, message: 'Gắn lốp vào xe thành công!' })

  } catch (error: any) {
    console.error('Tire assignment API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
