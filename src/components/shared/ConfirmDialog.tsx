import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  variant?: 'danger' | 'warning'
}

export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = 'Confirmar', onConfirm, variant = 'danger'
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className={cn(
              'p-2.5 rounded-full flex-shrink-0',
              variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
            )}>
              <AlertTriangle size={20} className={variant === 'danger' ? 'text-red-600' : 'text-amber-600'} />
            </div>
            <div className="flex-1">
              <Dialog.Title className="font-semibold text-slate-900 dark:text-slate-100">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</Dialog.Description>
            </div>
            <Dialog.Close className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={16} />
            </Dialog.Close>
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <Dialog.Close asChild>
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Cancelar
              </button>
            </Dialog.Close>
            <button
              onClick={() => { onConfirm(); onOpenChange(false) }}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors',
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
