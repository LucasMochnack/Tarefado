import { NivelPrioridade } from '@/types'
import { cn } from '@/lib/utils'
import { Flame, TrendingUp, Minus, ChevronDown } from 'lucide-react'

const MAP: Record<NivelPrioridade, { label: string; className: string; Icon: React.ElementType }> = {
  critica: {
    label: 'Crítica',
    className: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    Icon: Flame,
  },
  alta: {
    label: 'Alta',
    className: 'bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    Icon: TrendingUp,
  },
  media: {
    label: 'Média',
    className: 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    Icon: Minus,
  },
  baixa: {
    label: 'Baixa',
    className: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    Icon: ChevronDown,
  },
}

export function PriorityBadge({ nivel, showIcon = true, size = 'sm' }: {
  nivel: NivelPrioridade
  showIcon?: boolean
  size?: 'xs' | 'sm'
}) {
  const cfg = MAP[nivel]
  const Icon = cfg.Icon
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium',
      size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs',
      cfg.className
    )}>
      {showIcon && <Icon size={10} />}
      {cfg.label}
    </span>
  )
}

export function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-red-600 dark:text-red-400' :
    score >= 60 ? 'text-orange-600 dark:text-orange-400' :
    score >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
    'text-slate-500 dark:text-slate-400'

  return (
    <span className={cn('font-bold tabular-nums text-sm', color)}>
      {score}
    </span>
  )
}
