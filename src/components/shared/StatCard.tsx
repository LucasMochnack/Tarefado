import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  color?: 'red' | 'blue' | 'green' | 'orange' | 'violet' | 'slate' | 'amber'
  trend?: string
  onClick?: () => void
}

const colorMap = {
  red: 'bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30',
  blue: 'bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30',
  green: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30',
  orange: 'bg-orange-50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30',
  violet: 'bg-violet-50 border-violet-100 dark:bg-violet-950/20 dark:border-violet-900/30',
  slate: 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700',
  amber: 'bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30',
}

const iconColorMap = {
  red: 'text-red-500 bg-red-100 dark:bg-red-900/40',
  blue: 'text-blue-500 bg-blue-100 dark:bg-blue-900/40',
  green: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40',
  orange: 'text-orange-500 bg-orange-100 dark:bg-orange-900/40',
  violet: 'text-violet-500 bg-violet-100 dark:bg-violet-900/40',
  slate: 'text-slate-500 bg-slate-100 dark:bg-slate-700',
  amber: 'text-amber-500 bg-amber-100 dark:bg-amber-900/40',
}

const valueColorMap = {
  red: 'text-red-600 dark:text-red-400',
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-emerald-600 dark:text-emerald-400',
  orange: 'text-orange-600 dark:text-orange-400',
  violet: 'text-violet-600 dark:text-violet-400',
  slate: 'text-slate-700 dark:text-slate-200',
  amber: 'text-amber-600 dark:text-amber-400',
}

export function StatCard({ label, value, icon: Icon, color = 'slate', trend, onClick }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all duration-200',
        colorMap[color],
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className={cn('p-2 rounded-lg', iconColorMap[color])}>
          <Icon size={18} />
        </div>
        {trend && (
          <span className="text-xs text-slate-500 dark:text-slate-400">{trend}</span>
        )}
      </div>
      <div className="mt-3">
        <div className={cn('text-2xl font-bold', valueColorMap[color])}>{value}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{label}</div>
      </div>
    </div>
  )
}
