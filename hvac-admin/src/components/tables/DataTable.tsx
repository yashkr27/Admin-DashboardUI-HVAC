'use client'

import { ConfirmDialog } from '@/components/forms/ConfirmDialog'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Eye, EyeOff, Pencil, PlusCircle, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

interface DataTableProps {
  data: AnyRecord[]
  isLoading?: boolean
  onEdit?: (row: AnyRecord) => void
  onDelete?: (row: AnyRecord) => void
  onAdd?: () => void
  readOnly?: boolean
  /** Extra toolbar elements (e.g. CSV export, view toggle) */
  toolbarExtra?: React.ReactNode
  /** Column renderers override — key = column name, value = render fn */
  columnRenderers?: Record<string, (value: unknown, row: AnyRecord) => React.ReactNode>
  /** Hidden columns by default */
  hiddenColumns?: string[]
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  )
}

function EmptyState({ onAdd, readOnly }: { onAdd?: () => void; readOnly?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Search size={28} className="text-slate-300" />
      </div>
      <p className="text-base font-semibold text-slate-700">No records found</p>
      <p className="mt-1 text-sm text-slate-400">
        {readOnly ? 'No data available.' : 'Get started by adding your first record.'}
      </p>
      {!readOnly && onAdd && (
        <button
          id="empty-add-btn"
          onClick={onAdd}
          className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
        >
          <PlusCircle size={16} />
          Add your first record
        </button>
      )}
    </div>
  )
}

function renderCellValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-slate-300">—</span>
  if (typeof value === 'boolean') return value ? '✓' : '✗'
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDate(value)
  }
  const str = String(value)
  if (str.length > 60) return str.slice(0, 60) + '…'
  return str
}

export function DataTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
  readOnly,
  toolbarExtra,
  columnRenderers = {},
  hiddenColumns = [],
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    Object.fromEntries(hiddenColumns.map((c) => [c, false]))
  )
  const [pageSize, setPageSize] = useState(25)
  const [showColMenu, setShowColMenu] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AnyRecord | null>(null)

  // Infer columns from first row
  const columns = useMemo<ColumnDef<AnyRecord>[]>(() => {
    if (!data.length) return []
    const keys = Object.keys(data[0])
    const dataCols: ColumnDef<AnyRecord>[] = keys.map((key) => ({
      id: key,
      accessorKey: key,
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {key.replace(/_/g, ' ')}
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp size={12} />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown size={12} />
          ) : (
            <ChevronsUpDown size={12} className="opacity-40" />
          )}
        </button>
      ),
      cell: ({ getValue, row }) => {
        const value = getValue()
        if (columnRenderers[key]) return columnRenderers[key](value, row.original)
        return renderCellValue(value)
      },
    }))

    if (!readOnly && (onEdit || onDelete)) {
      dataCols.push({
        id: '__actions',
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button
                id={`edit-row-${row.original.id ?? row.index}`}
                onClick={() => onEdit(row.original)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                id={`delete-row-${row.original.id ?? row.index}`}
                onClick={() => setDeleteTarget(row.original)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ),
        enableSorting: false,
        size: 80,
      })
    }
    return dataCols
  }, [data, onEdit, onDelete, readOnly, columnRenderers])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  // Update pageSize on table when it changes
  useMemo(() => {
    table.setPageSize(pageSize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize])

  const totalRows = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="table-search"
            type="text"
            placeholder="Search all columns…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Column visibility */}
        <div className="relative">
          <button
            id="col-visibility-btn"
            onClick={() => setShowColMenu(!showColMenu)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Eye size={15} />
            Columns
          </button>
          {showColMenu && (
            <div className="absolute right-0 top-full z-30 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              {table.getAllColumns()
                .filter((col) => col.id !== '__actions')
                .map((col) => (
                  <label
                    key={col.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                      className="rounded"
                    />
                    {col.id.replace(/_/g, ' ')}
                  </label>
                ))}
              <div className="mt-1 border-t border-slate-100 pt-1">
                <button
                  onClick={() => { setColumnVisibility({}); setShowColMenu(false) }}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50"
                >
                  <EyeOff size={12} /> Reset visibility
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Extra toolbar items */}
        {toolbarExtra}

        {/* Add new */}
        {!readOnly && onAdd && (
          <button
            id="add-new-btn"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
          >
            <PlusCircle size={15} />
            Add New
          </button>
        )}
      </div>

      {/* Row count */}
      <p className="text-xs text-slate-400">
        Showing <span className="font-medium text-slate-600">{totalRows}</span> of{' '}
        <span className="font-medium text-slate-600">{data.length}</span> records
      </p>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-slate-100 bg-slate-50">
                  {hg.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 text-left whitespace-nowrap">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} cols={columns.length} />
                  ))
                : table.getRowModel().rows.length === 0
                ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <EmptyState onAdd={onAdd} readOnly={readOnly} />
                    </td>
                  </tr>
                )
                : table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-slate-50 transition-colors hover:bg-slate-50/70',
                      row.index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Rows per page:</span>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="prev-page-btn"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 text-sm text-slate-600">
            Page {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
          </span>
          <button
            id="next-page-btn"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDelete?.(deleteTarget)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
