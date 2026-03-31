import { useNavigate } from 'react-router-dom'
import { TrendingUp, ShoppingCart, Zap, ArrowRight, AlertTriangle, Flame, Clock } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Time } from '@/types'
import { isOverdue } from '@/utils/dates'
import { cn } from '@/lib/utils'

const TIMES = [
  {
    slug: 'alta-renda',
    label: 'Alta Renda',
    icon: TrendingUp,
    color: '#009974',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-900/40',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    desc: 'Atendimento e relacionamento com clientes de alta renda e patrimônio elevado',
  },
  {
    slug: 'varejo',
    label: 'Varejo',
    icon: ShoppingCart,
    color: '#3b82f6',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-900/40',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
    desc: 'Operações, campanhas e atendimento ao segmento de varejo',
  },
  {
    slug: 'on-demand',
    label: 'On Demand',
    icon: Zap,
    color: '#f59e0b',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-900/40',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    desc: 'Demandas avulsas, tarefas pontuais e atividades não recorrentes',
  },
]

export function Times() {
  const { tarefas } = useStore()
  const navigate = useNavigate()

  const getStats = (time: Time) => {
    const tt = tarefas.filter(t => t.time === time)
    const total = tt.length
    const concluidas = tt.filter(t => t.status === 'concluido').length
    return {
      pendentes: tt.filter(t => t.status === 'a-fazer').length,
      andamento: tt.filter(t => t.status === 'em-andamento').length,
      atrasadas: tt.filter(t => isOverdue(t.prazo) && t.status !== 'concluido').length,
      criticas: tt.filter(t => t.nivelPrioridade === 'critica' && t.status !== 'concluido').length,
      pct: total > 0 ? Math.round((concluidas / total) * 100) : 0,
    }
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Times Comerciais</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Gerencie as operações de cada time e acompanhe suas prioridades</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIMES.map(time => {
          const stats = getStats(time.slug as Time)
          const Icon = time.icon
          return (
            <div
              key={time.slug}
              onClick={() => navigate(`/times/${time.slug}`)}
              className={cn(
                'rounded-2xl border p-6 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200',
                time.bg, time.border
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn('p-3 rounded-xl', time.iconBg)}>
                  <Icon size={22} className={time.iconColor} />
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-500" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{time.label}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">{time.desc}</p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <StatMini label="Pendentes" value={stats.pendentes} icon={Clock} />
                <StatMini label="Em Andamento" value={stats.andamento} icon={Clock} color="blue" />
                <StatMini label="Atrasadas" value={stats.atrasadas} icon={AlertTriangle} color={stats.atrasadas > 0 ? 'red' : 'slate'} />
                <StatMini label="Críticas" value={stats.criticas} icon={Flame} color={stats.criticas > 0 ? 'orange' : 'slate'} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Concluído na semana</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{stats.pct}%</span>
                </div>
                <div className="h-2 bg-white/60 dark:bg-slate-800/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.pct}%`, backgroundColor: time.color }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatMini({ label, value, icon: Icon, color = 'slate' }: { label: string; value: number; icon: React.ElementType; color?: string }) {
  const colors: Record<string, string> = {
    red: 'text-red-600 dark:text-red-400',
    orange: 'text-orange-600 dark:text-orange-400',
    blue: 'text-blue-600 dark:text-blue-400',
    slate: 'text-slate-600 dark:text-slate-400',
  }
  return (
    <div className="bg-white/70 dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-2.5">
      <Icon size={14} className={colors[color] || colors.slate} />
      <div>
        <div className={cn('text-lg font-bold', colors[color] || colors.slate)}>{value}</div>
        <div className="text-xs text-slate-400 dark:text-slate-500">{label}</div>
      </div>
    </div>
  )
}
