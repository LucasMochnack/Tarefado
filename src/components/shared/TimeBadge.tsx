import { Time } from '@/types'
import { cn } from '@/lib/utils'

const MAP: Record<Time, { label: string; className: string }> = {
  b2c: { label: 'B2C', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  campinas: { label: 'Campinas', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  produtos: { label: 'Produtos', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  geral: { label: 'Geral', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
}

export function TimeBadge({ time }: { time: Time }) {
  const cfg = MAP[time] || MAP.geral
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', cfg.className)}>
      {cfg.label}
    </span>
  )
}
