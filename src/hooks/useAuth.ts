'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Profile } from '@/types/database'

export function useAuth() {
  const { setUser, setProfile, setIsLoading, user, profile, isLoading } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUser(session.user)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData as Profile)
        }
      }
      setIsLoading(false)
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user)
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profileData) {
            setProfile(profileData as Profile)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setIsLoading, supabase])

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return { user, profile, isLoading, logout }
}
