'use client'

import { AutoForm } from '@/components/forms/AutoForm'
import { DataTable } from '@/components/tables/DataTable'
import { useSupabaseSchema } from '@/hooks/useSupabaseSchema'
import { useTableData } from '@/hooks/useTableData'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Papa from 'papaparse'
import { useParams } from 'next/navigation'
import { useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Calendar as CalendarIcon,
  Copy,
  Download,
  Grid,
  List,
  Star,
  Upload,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

const TABLE_ENUM_OPTIONS: Record<string, Record<string, string[]>> = {
  chatbot_leads: {
    status: ['new', 'contacted', 'qualified', 'closed'],
    source: ['chatbot', 'web', 'phone', 'referral'],
    service: ['AC Repair', 'AC Installation', 'Heating Repair', 'Heating Installation', 'Maintenance', 'Duct Cleaning', 'Other'],
  },
  appointments: {
    status: ['Scheduled', 'Completed', 'Cancelled', 'No-Show'],
  },
  estimates: {
    status: ['Draft', 'Sent', 'Accepted', 'Rejected'],
    service_type: ['AC Repair', 'AC Installation', 'Heating Repair', 'Heating Installation', 'Maintenance', 'Duct Cleaning', 'Other'],
  },
  profiles: {
    role: ['admin', 'staff', 'viewer'],
  },
}

const STATUS_COLORS: Record<string, string> = {
  // Appointments
  Scheduled: 'bg-blue-100 text-blue-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
  'No-Show': 'bg-orange-100 text-orange-700',
  // Estimates
  Draft: 'bg-slate-100 text-slate-600',
  Sent: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
  // Profiles
  admin: 'bg-violet-100 text-violet-700',
  staff: 'bg-blue-100 text-blue-700',
  viewer: 'bg-slate-100 text-slate-500',
  // Chatbot leads status
  new: 'bg-sky-100 text-sky-700',
  contacted: 'bg-amber-100 text-amber-700',
  qualified: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
}

const SOURCE_COLORS: Record<string, string> = {
  chatbot: 'bg-violet-100 text-violet-700',
  web: 'bg-blue-100 text-blue-700',
  phone: 'bg-emerald-100 text-emerald-700',
  referral: 'bg-amber-100 text-amber-700',
}

function SourceBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_COLORS[value] ?? 'bg-slate-100 text-slate-600'}`}>
      {value}
    </span>
  )
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[value] ?? 'bg-slate-100 text-slate-600'}`}>
      {value}
    </span>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-amber-400' : 'text-slate-200'}>★</span>
      ))}
    </span>
  )
}

// --- chatbot_leads extras ---
function LeadsExtras({ data }: { data: AnyRecord[] }) {
  const handleCSVExport = () => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chatbot_leads_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }
  return (
    <button
      id="export-csv-btn"
      onClick={handleCSVExport}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
    >
      <Download size={15} /> Export CSV
    </button>
  )
}

// --- gallery extras ---
function GalleryUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fileName = `${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('gallery').upload(fileName, file)
      if (error) throw error
      const { data } = supabase.storage.from('gallery').getPublicUrl(fileName)
      onUpload(data.publicUrl)
      toast.success('Image uploaded')
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
      <Upload size={15} />
      {uploading ? 'Uploading…' : 'Upload Image'}
      <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
    </label>
  )
}

function GalleryGrid({ data, onEdit, onDelete }: { data: AnyRecord[]; onEdit: (r: AnyRecord) => void; onDelete: (r: AnyRecord) => void }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const slides = data.map((r) => ({ src: r.image_url ?? '' })).filter((s) => s.src)

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {data.map((item, i) => (
          <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url ?? ''}
              alt={item.title ?? ''}
              className="aspect-square w-full cursor-pointer object-cover transition-transform duration-200 group-hover:scale-105"
              onClick={() => { setLightboxIndex(i); setLightboxOpen(true) }}
            />
            <div className="p-2">
              <p className="truncate text-xs font-medium text-slate-700">{item.title ?? 'Untitled'}</p>
            </div>
            <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button onClick={() => onEdit(item)} className="rounded-lg bg-white/90 p-1.5 text-slate-600 shadow hover:text-blue-600">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={() => onDelete(item)} className="rounded-lg bg-white/90 p-1.5 text-slate-600 shadow hover:text-red-600">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={lightboxIndex}
      />
    </>
  )
}

// --- gemini_usage_log chart ---
function GeminiChart({ data }: { data: AnyRecord[] }) {
  const chartData = useMemo(() => {
    const byDay: Record<string, number> = {}
    for (const row of data) {
      if (!row.created_at) continue
      const day = format(parseISO(row.created_at), 'MMM d')
      byDay[day] = (byDay[day] ?? 0) + (Number(row.tokens_used) || 0)
    }
    return Object.entries(byDay)
      .map(([date, tokens]) => ({ date, tokens }))
      .slice(-14) // last 14 days
  }, [data])

  const totalTokens = data.reduce((sum, r) => sum + (Number(r.tokens_used) || 0), 0)

  return (
    <div className="mb-6 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Tokens Used</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{totalTokens.toLocaleString()}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-slate-700">Daily Token Usage (last 14 days)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Bar dataKey="tokens" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// --- reviews summary ---
function ReviewsSummary({ data }: { data: AnyRecord[] }) {
  const ratings = data.map((r) => Number(r.rating)).filter(Boolean)
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
  return (
    <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Average Rating</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{avg.toFixed(1)}</p>
      </div>
      <StarRating rating={Math.round(avg)} />
      <p className="text-sm text-slate-400">({ratings.length} reviews)</p>
    </div>
  )
}

// --- estimates summary ---
function EstimatesSummary({ data }: { data: AnyRecord[] }) {
  const total = data.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Estimate Value</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{formatCurrency(total)}</p>
    </div>
  )
}

// --- Main table page ---
const READONLY_TABLES = ['gemini_usage_log']

const TABLE_LABELS: Record<string, string> = {
  chatbot_leads: 'Chatbot Leads',
  appointments: 'Appointments',
  estimates: 'Estimates',
  gallery: 'Gallery',
  gemini_usage_log: 'Gemini Usage Log',
  profiles: 'Profiles',
  reviews: 'Reviews',
}

export default function TablePage() {
  const params = useParams()
  const tableName = Array.isArray(params.table) ? params.table[0] : (params.table as string)
  const { user } = useAuth()

  const { data: schema = [], isLoading: schemaLoading } = useSupabaseSchema(tableName)
  const { data, isLoading, insert, update, remove, isDeleting } = useTableData(tableName)

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AnyRecord | null>(null)
  const [galleryView, setGalleryView] = useState<'grid' | 'table'>('grid')

  const isReadOnly = READONLY_TABLES.includes(tableName)
  const enumOptions = TABLE_ENUM_OPTIONS[tableName] ?? {}
  const tableLabel = TABLE_LABELS[tableName] ?? tableName.replace(/_/g, ' ')

  const handleAdd = () => {
    setEditTarget(null)
    setFormOpen(true)
  }

  const handleEdit = useCallback((row: AnyRecord) => {
    setEditTarget(row)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback(async (row: AnyRecord) => {
    // profiles: prevent deleting own row
    if (tableName === 'profiles' && row.id === user?.id) {
      toast.error('You cannot delete your own profile.')
      return
    }
    await remove(row.id)
  }, [remove, tableName, user?.id])

  const handleSubmit = async (formData: AnyRecord) => {
    if (editTarget) {
      await update({ id: editTarget.id, data: formData })
    } else {
      await insert(formData)
    }
  }

  // Column renderers
  const columnRenderers = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderers: Record<string, (value: unknown, row: any) => React.ReactNode> = {}

    if (tableName === 'chatbot_leads') {
      renderers.email = (v) => v ? (
        <div className="flex items-center gap-1.5">
          <span className="truncate max-w-[160px]">{String(v)}</span>
          <button onClick={() => { navigator.clipboard.writeText(String(v)); toast.success('Email copied') }} className="text-slate-300 hover:text-blue-500" title="Copy email">
            <Copy size={12} />
          </button>
        </div>
      ) : <span className="text-slate-300">—</span>
      renderers.phone = (v) => v ? (
        <div className="flex items-center gap-1.5">
          <span>{String(v)}</span>
          <button onClick={() => { navigator.clipboard.writeText(String(v)); toast.success('Phone copied') }} className="text-slate-300 hover:text-blue-500" title="Copy phone">
            <Copy size={12} />
          </button>
        </div>
      ) : <span className="text-slate-300">—</span>
      renderers.status = (v) => v ? <StatusBadge value={String(v)} /> : <span className="text-slate-300">—</span>
      renderers.source = (v) => v ? <SourceBadge value={String(v)} /> : <span className="text-slate-300">—</span>
      renderers.service = (v) => v ? (
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
          {String(v)}
        </span>
      ) : <span className="text-slate-300">—</span>
    }

    if (tableName === 'appointments' || tableName === 'estimates') {
      renderers.status = (v) => v ? <StatusBadge value={String(v)} /> : <span className="text-slate-300">—</span>
    }

    if (tableName === 'estimates') {
      renderers.amount = (v) => <span className="font-medium text-slate-800">{formatCurrency(Number(v))}</span>
    }

    if (tableName === 'gallery') {
      renderers.image_url = (v) => v ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={String(v)} alt="" className="h-10 w-10 rounded-lg object-cover" />
      ) : <span className="text-slate-300">—</span>
    }

    if (tableName === 'profiles') {
      renderers.avatar_url = (v, row) => v ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={String(v)} alt={row.name} className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
          {(row.name ?? '?')[0]?.toUpperCase()}
        </div>
      )
      renderers.role = (v) => v ? <StatusBadge value={String(v)} /> : <span className="text-slate-300">—</span>
    }

    if (tableName === 'reviews') {
      renderers.rating = (v) => <StarRating rating={Number(v)} />
      renderers.visible = (v) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {v ? 'Visible' : 'Hidden'}
        </span>
      )
    }

    return renderers
  }, [tableName])

  // Disable delete for own profile row
  const handleDeleteWithGuard = tableName === 'profiles'
    ? (row: AnyRecord) => {
        if (row.id === user?.id) {
          toast.error('Cannot delete your own profile')
          return
        }
        handleDelete(row)
      }
    : handleDelete

  if (schemaLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize text-slate-900">{tableLabel}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {isReadOnly ? 'Read-only · View and analyze data' : 'Manage records · Add, edit, and delete entries'}
          </p>
        </div>

        {/* Gallery view toggle */}
        {tableName === 'gallery' && (
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
            <button
              id="gallery-grid-view"
              onClick={() => setGalleryView('grid')}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${galleryView === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Grid size={15} />
            </button>
            <button
              id="gallery-table-view"
              onClick={() => setGalleryView('table')}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${galleryView === 'table' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Table-specific summary blocks */}
      {tableName === 'gemini_usage_log' && <GeminiChart data={data} />}
      {tableName === 'reviews' && <ReviewsSummary data={data} />}
      {tableName === 'estimates' && <EstimatesSummary data={data} />}

      {/* Gallery grid view */}
      {tableName === 'gallery' && galleryView === 'grid' ? (
        <div className="space-y-4">
          <div className="flex gap-3">
            <GalleryUpload
              onUpload={(url) => {
                setEditTarget({ image_url: url })
                setFormOpen(true)
              }}
            />
            <button
              id="add-new-btn"
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Add New
            </button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton aspect-square rounded-2xl" />
              ))}
            </div>
          ) : (
            <GalleryGrid data={data} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </div>
      ) : (
        /* Standard DataTable */
        <DataTable
          data={data}
          isLoading={isLoading || isDeleting}
          onEdit={isReadOnly ? undefined : handleEdit}
          onDelete={isReadOnly ? undefined : handleDeleteWithGuard}
          onAdd={isReadOnly ? undefined : handleAdd}
          readOnly={isReadOnly}
          columnRenderers={columnRenderers}
          toolbarExtra={
            <>
              {tableName === 'chatbot_leads' && <LeadsExtras data={data} />}
              {tableName === 'gallery' && (
                <GalleryUpload
                  onUpload={(url) => {
                    setEditTarget({ image_url: url })
                    setFormOpen(true)
                  }}
                />
              )}
            </>
          }
        />
      )}

      {/* Add/Edit form */}
      {!isReadOnly && schema.length > 0 && (
        <AutoForm
          open={formOpen}
          onOpenChange={setFormOpen}
          schema={schema}
          defaultValues={editTarget ?? undefined}
          onSubmit={handleSubmit}
          mode={editTarget ? 'edit' : 'create'}
          tableName={tableName}
          enumOptions={enumOptions}
        />
      )}
    </div>
  )
}
