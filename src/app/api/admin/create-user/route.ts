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
          persistSession: false
        }
      }
    )

    // 1. Create user in Supabase Auth
    let userId: string | undefined
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        full_name: fullName,
        role: role 
      }
    })

    if (authError) {
      // If user already exists, try to get their existing ID
      if (authError.message.includes('already been registered')) {
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users.find(u => u.email === email)
        if (existingUser) {
          userId = existingUser.id
        } else {
          throw authError // Should not happen if registered, but safety check
        }
      } else {
        throw authError
      }
    } else {
      userId = authUser.user.id
    }

    // 2. The user profile is usually created via a database trigger in our schema.
    // We manually upsert here to ensure profile is in sync even if it existed before.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
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
      userId: userId 
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
