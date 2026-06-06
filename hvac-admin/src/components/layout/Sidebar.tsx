'use client'

import { cn } from '@/lib/utils'
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image,
  MessageSquare,
  Star,
  User,
  Wind,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
  { href: '/admin/chatbot_leads', label: 'Leads', icon: MessageSquare },
  { href: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { href: '/admin/estimates', label: 'Estimates', icon: FileText },
  { href: '/admin/gallery', label: 'Gallery', icon: Image },
  { href: '/admin/gemini_usage_log', label: 'Gemini Logs', icon: Zap },
  { href: '/admin/profiles', label: 'Profiles', icon: User },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r border-white/10 bg-[#0f172a] text-white transition-all duration-300 ease-in-out',
        collapsed ? 'w-[70px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
          <Wind size={20} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide text-white">HVAC Admin</p>
            <p className="truncate text-[10px] text-slate-400">Management Console</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon
                    size={18}
                    className={cn('shrink-0', active ? 'text-white' : 'text-slate-400 group-hover:text-white')}
                  />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {active && !collapsed && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  )
}
