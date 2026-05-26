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
    const { vehicleId, tireA, tireB, posA, posB } = await request.json()

    if (!vehicleId || !tireA || !posA || !posB) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }

    // 3. Initialize Supabase Admin Client
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // 4. Perform Swapping / Relocation logic under service role bypassing RLS limits
    if (tireB) {
      // Swap positions
      const { error: errA } = await supabaseAdmin
        .from('quan_ly_vo_xe')
        .update({ vi_tri_lap: posB })
        .eq('id_vo', tireA.id_vo)
      if (errA) throw errA

      const { error: errB } = await supabaseAdmin
        .from('quan_ly_vo_xe')
        .update({ vi_tri_lap: posA })
        .eq('id_vo', tireB.id_vo)
      if (errB) throw errB
    } else {
      // Move A to empty B position
      const { error: errA } = await supabaseAdmin
        .from('quan_ly_vo_xe')
        .update({ vi_tri_lap: posB })
        .eq('id_vo', tireA.id_vo)
      if (errA) throw errA
    }

    return NextResponse.json({ success: true, message: 'Đảo vị trí lốp xe thành công!' })

  } catch (error: any) {
    console.error('Tire rotation API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
