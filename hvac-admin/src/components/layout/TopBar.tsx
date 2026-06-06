'use client'

import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/lib/utils'
import { LogOut, Wind } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function TopBar() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/admin/login')
  }

  const displayName = user?.user_metadata?.name ?? user?.email ?? 'Admin'
  const initials = getInitials(displayName)

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      {/* Left: Breadcrumb / title */}
      <div className="flex items-center gap-2">
        <Wind size={18} className="text-blue-500" />
        <span className="text-sm font-semibold text-slate-700">HVAC Admin</span>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-500">Management Console</span>
      </div>

      {/* Right: User info + logout */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex items-center gap-2.5">
          {user?.user_metadata?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.user_metadata.avatar_url}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/30"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white ring-2 ring-blue-500/30">
              {initials}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-slate-700 leading-none">{displayName}</p>
            {user?.email && (
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">{user.email}</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          title="Sign out"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
