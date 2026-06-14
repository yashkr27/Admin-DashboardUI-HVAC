'use client'

import { supabase } from '@/lib/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

async function fetchTableData(tableName: string): Promise<AnyRecord[]> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export function useTableData(tableName: string) {
  const queryClient = useQueryClient()
  const queryKey = ['table', tableName]

  const query = useQuery({
    queryKey,
    queryFn: () => fetchTableData(tableName),
    enabled: !!tableName,
    // Always fetch fresh data on mount/focus — no stale cache
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  // ── Supabase Realtime subscription ──────────────────────────────────────
  // Automatically re-fetches when any INSERT / UPDATE / DELETE happens in
  // the table on the Supabase side — gives live updates with no page reload.
  useEffect(() => {
    if (!tableName) return

    const channel = supabase
      .channel(`realtime-${tableName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        () => {
          // Invalidate → React Query refetches immediately
          queryClient.invalidateQueries({ queryKey })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName])
  // ────────────────────────────────────────────────────────────────────────

  const insertMutation = useMutation({
    mutationFn: async (record: AnyRecord) => {
      const { error } = await supabase.from(tableName).insert([record])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Record created successfully')
    },
    onError: (error: Error) => {
      const msg = error.message.includes('row-level security')
        ? 'Permission denied. Check RLS policies.'
        : error.message
      toast.error(msg)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AnyRecord }) => {
      const { error } = await supabase.from(tableName).update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Record updated successfully')
    },
    onError: (error: Error) => {
      const msg = error.message.includes('row-level security')
        ? 'Permission denied. Check RLS policies.'
        : error.message
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Record deleted successfully')
    },
    onError: (error: Error) => {
      const msg = error.message.includes('row-level security')
        ? 'Permission denied. Check RLS policies.'
        : error.message
      toast.error(msg)
    },
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    insert: insertMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync as (id: string | number) => Promise<void>,
    isInserting: insertMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
