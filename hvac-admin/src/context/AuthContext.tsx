'use client'

import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextValue {
  session: Session | null
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Enable auto-login in development to bypass email confirmation blocks
    if (process.env.NODE_ENV === 'development') {
      setSession({
        access_token: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        token_type: 'bearer',
        expires_in: 36000,
        refresh_token: 'mock-refresh',
        user: {
          id: 'aa9d4fa0-dde6-46a7-98c6-2aeb9b34a123',
          email: 'admin@bluebeaks.com',
          role: 'authenticated',
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: { name: 'HVAC Admin User' },
          created_at: new Date().toISOString(),
        },
      } as any)
      setIsLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsLoading(false)
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
