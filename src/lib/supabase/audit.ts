import { supabase } from './client'

export async function logAction(
  email: string | undefined, 
  action: string, 
  target: string, 
  description: string
) {
  try {
    const { error } = await supabase.from('audit_logs').insert([{
      user_email: email || 'Hệ thống',
      action,
      target,
      description
    }])
    if (error) console.error('Lỗi ghi nhật ký Supabase:', error)
  } catch (error) {
    console.error('Lỗi ngoại lệ ghi nhật ký:', error)
  }
}
