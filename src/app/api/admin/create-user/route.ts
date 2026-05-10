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

    // 1. Create or Identify User in Supabase Auth
    let userId: string | undefined
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: role }
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        // Try to get existing user ID from profiles table or Auth
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single()
        
        if (existingProfile) {
          userId = existingProfile.id
        } else {
          // If not in profiles, we must find them in Auth list to get ID
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers()
          const found = userList?.users.find(u => u.email === email)
          if (found) userId = found.id
        }
      }
      
      // If we still don't have a userId, it's a real error we can't bypass
      if (!userId) throw authError
    } else {
      userId = authUser.user.id
    }

    // 2. Ensure Profile exists and is updated
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        role: role
      })

    if (profileError) throw profileError

    return NextResponse.json({ 
      message: 'Xử lý tài khoản thành công',
      userId: userId 
    })

  } catch (error: any) {
    console.error('Create User API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
