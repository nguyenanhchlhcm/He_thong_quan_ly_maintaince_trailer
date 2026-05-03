import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Phân quyền điều hướng dựa trên role trong metadata
  const role = user.user_metadata?.role || 'mechanic'
  
  if (role === 'admin') {
    redirect('/admin')
  }
  
  redirect('/mechanic')
}
