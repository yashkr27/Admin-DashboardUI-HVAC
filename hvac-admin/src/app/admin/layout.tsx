'use client'

import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function AdminShell({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth()
  const router = useRouter()
  const redirected = useRef(false)

  useEffect(() => {
    if (!isLoading && !session && !redirected.current) {
      redirected.current = true
      router.replace('/admin/login')
    }
  }, [session, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminShell>{children}</AdminShell>
      </AuthProvider>
    </QueryClientProvider>
  )
}
