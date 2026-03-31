import { StatusTarefa } from '@/types'
import { cn } from '@/lib/utils'

const MAP: Record<StatusTarefa, { label: string; className: string }> = {
  'a-fazer': { label: 'A Fazer', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  'em-andamento': { label: 'Em Andamento', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  'aguardando': { label: 'Aguardando', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  'concluido': { label: 'Concluído', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
}

export function StatusBadge({ status, size = 'sm' }: { status: StatusTarefa; size?: 'xs' | 'sm' }) {
  const cfg = MAP[status]
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs',
      cfg.className
    )}>
      {cfg.label}
    </span>
  )
}
