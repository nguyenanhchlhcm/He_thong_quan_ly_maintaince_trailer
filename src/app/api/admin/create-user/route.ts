import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, fullName, role } = await request.json()

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }

    // Initialize Supabase Admin Client with Service Role Key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // This key is SECRET and only used on server
      {
        auth: {
          autoConfirm: true,
          persistSession: false
        }
      }
    )

    // 1. Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        full_name: fullName,
        role: role 
      }
    })

    if (authError) throw authError

    // 2. The user profile is usually created via a database trigger in our schema.
    // If not, we can manually insert here. Let's manually insert to be sure.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        email,
        full_name: fullName,
        role: role
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // We don't fail the whole request because the Auth user is already created
    }

    return NextResponse.json({ 
      message: 'Tạo tài khoản thành công',
      userId: authUser.user.id 
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
