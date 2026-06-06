'use client'

import { supabase } from '@/lib/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  })

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
    mutationFn: async (id: string) => {
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
    remove: deleteMutation.mutateAsync,
    isInserting: insertMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
