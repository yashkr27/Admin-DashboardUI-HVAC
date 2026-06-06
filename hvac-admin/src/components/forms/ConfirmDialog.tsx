'use client'

import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmLabel?: string
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Delete Record',
  description = 'Are you sure you want to delete this record? This cannot be undone.',
  confirmLabel = 'Delete',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            id="confirm-delete-btn"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
              isLoading && 'opacity-60 cursor-not-allowed'
            )}
          >
            {isLoading ? 'Deleting…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
