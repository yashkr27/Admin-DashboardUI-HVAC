'use client'

import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  BarChart3,
  Calendar,
  FileText,
  MessageSquare,
  Star,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

interface SummaryData {
  totalLeads: number
  upcomingAppointments: number
  totalEstimateValue: number
  avgRating: number
  monthlyTokens: number
}

async function fetchSummary(): Promise<SummaryData> {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [leads, appointments, estimates, reviews, gemini] = await Promise.all([
    supabase.from('chatbot_leads').select('id', { count: 'exact', head: true }),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('date', today),
    supabase.from('estimates').select('amount'),
    supabase.from('reviews').select('rating'),
    supabase.from('gemini_usage_log').select('tokens_used').gte('created_at', monthStart),
  ])

  const totalEstimateValue = (estimates.data ?? []).reduce(
    (sum, r) => sum + (Number(r.amount) || 0), 0
  )
  const ratings = (reviews.data ?? []).map((r) => Number(r.rating)).filter(Boolean)
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
  const monthlyTokens = (gemini.data ?? []).reduce(
    (sum, r) => sum + (Number(r.tokens_used) || 0), 0
  )

  return {
    totalLeads: leads.count ?? 0,
    upcomingAppointments: appointments.count ?? 0,
    totalEstimateValue,
    avgRating,
    monthlyTokens,
  }
}

async function fetchRecentActivity() {
  const [leads, appointments] = await Promise.all([
    supabase.from('chatbot_leads').select('id, name, email, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('appointments').select('id, name, date, status, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  const leadsRows = (leads.data ?? []).map((r) => ({ ...r, _type: 'lead' as const }))
  const apptRows = (appointments.data ?? []).map((r) => ({ ...r, _type: 'appointment' as const }))

  return [...leadsRows, ...apptRows]
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 10)
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  href,
  color,
  delay,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  href: string
  color: string
  delay: number
}) {
  return (
    <Link
      href={href}
      className="animate-fade-up group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon size={20} />
        </div>
        <span className="text-xs font-medium text-blue-500 opacity-0 transition-opacity group-hover:opacity-100">
          View →
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="mt-0.5 text-sm text-slate-500">{label}</p>
      </div>
    </Link>
  )
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const fraction = rating - full
  return (
    <span className="flex items-center gap-0.5 text-lg">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={
            i < full
              ? 'text-amber-400'
              : i === full && fraction >= 0.5
              ? 'text-amber-300'
              : 'text-slate-200'
          }
        >
          ★
        </span>
      ))}
    </span>
  )
}

export default function AdminDashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchSummary,
  })

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: fetchRecentActivity,
  })

  const cards = [
    {
      icon: MessageSquare,
      label: 'Total Leads',
      value: summaryLoading ? '…' : (summary?.totalLeads ?? 0).toLocaleString(),
      href: '/admin/chatbot_leads',
      color: 'bg-blue-50 text-blue-600',
      delay: 0,
    },
    {
      icon: Calendar,
      label: 'Upcoming Appointments',
      value: summaryLoading ? '…' : (summary?.upcomingAppointments ?? 0).toLocaleString(),
      href: '/admin/appointments',
      color: 'bg-emerald-50 text-emerald-600',
      delay: 60,
    },
    {
      icon: FileText,
      label: 'Total Estimate Value',
      value: summaryLoading ? '…' : formatCurrency(summary?.totalEstimateValue ?? 0),
      href: '/admin/estimates',
      color: 'bg-violet-50 text-violet-600',
      delay: 120,
    },
    {
      icon: Star,
      label: 'Average Rating',
      value: summaryLoading ? '…' : (summary?.avgRating ?? 0).toFixed(1),
      href: '/admin/reviews',
      color: 'bg-amber-50 text-amber-600',
      delay: 180,
    },
    {
      icon: Zap,
      label: 'Gemini Tokens (This Month)',
      value: summaryLoading ? '…' : (summary?.monthlyTokens ?? 0).toLocaleString(),
      href: '/admin/gemini_usage_log',
      color: 'bg-rose-50 text-rose-600',
      delay: 240,
    },
    {
      icon: BarChart3,
      label: 'Tables Managed',
      value: '7',
      href: '/admin',
      color: 'bg-slate-100 text-slate-600',
      delay: 300,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back! Here&apos;s what&apos;s happening with your HVAC business.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
          <p className="text-sm text-slate-400">Latest leads and appointments</p>
        </div>
        <div className="divide-y divide-slate-50">
          {activityLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <div className="skeleton h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-1/3 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))
            : (activity ?? []).map((item, i) => (
                <div key={`${item._type}-${item.id}-${i}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      item._type === 'lead'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {item._type === 'lead' ? 'L' : 'A'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {item.name ?? 'Unknown'}
                      {item._type === 'appointment' && (item as { date?: string }).date
                        ? ` — ${(item as { date?: string }).date}`
                        : ''}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item._type === 'lead' ? 'New lead' : `Appointment · ${(item as { status?: string }).status ?? 'Scheduled'}`}
                      {item.created_at
                        ? ` · ${formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}`
                        : ''}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      item._type === 'lead'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {item._type === 'lead' ? 'Lead' : 'Appt'}
                  </span>
                </div>
              ))}
          {!activityLoading && (activity ?? []).length === 0 && (
            <p className="p-8 text-center text-sm text-slate-400">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  )
}
