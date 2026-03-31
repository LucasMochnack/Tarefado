import { useState } from 'react'
import { Target, RefreshCw, Filter, X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Tarefa, Time, NivelPrioridade } from '@/types'
import { TaskDetailsDrawer } from '@/components/tasks/TaskDetailsDrawer'
import { PriorityBadge, ScoreBadge } from '@/components/shared/PriorityBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TimeBadge } from '@/components/shared/TimeBadge'
import { isOverdue, daysSinceUpdate, prazoLabel } from '@/utils/dates'
import { RESPONSAVEIS } from '@/data/mockData'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export function Prioridades() {
  const { tarefas, projetos, recalcularPrioridades } = useStore()
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null)
  const [timeFilter, setTimeFilter] = useState<Time | ''>('')
  const [projetoFilter, setProjetoFilter] = useState('')
  const [nivelFilter, setNivelFilter] = useState<NivelPrioridade | ''>('')
  const [somenteAtrasadas, setSomenteAtrasadas] = useState(false)
  const [somenteParadas, setSomenteParadas] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const activeTarefas = tarefas.filter(t => t.status !== 'concluido')

  const filtered = activeTarefas
    .filter(t => {
      if (timeFilter && t.time !== timeFilter) return false
      if (projetoFilter && t.projetoId !== projetoFilter) return false
      if (nivelFilter && t.nivelPrioridade !== nivelFilter) return false
      if (somenteAtrasadas && !isOverdue(t.prazo)) return false
      if (somenteParadas && daysSinceUpdate(t.ultimaAtualizacao) < 7) return false
      return true
    })
    .sort((a, b) => b.scorePrioridade - a.scorePrioridade)

  const hasFilters = !!(timeFilter || projetoFilter || nivelFilter || somenteAtrasadas || somenteParadas)
  const clearFilters = () => {
    setTimeFilter(''); setProjetoFilter(''); setNivelFilter('')
    setSomenteAtrasadas(false); setSomenteParadas(false)
  }

  const selectClass = 'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30'

  const nivelCounts = {
    critica: activeTarefas.filter(t => t.nivelPrioridade === 'critica').length,
    alta: activeTarefas.filter(t => t.nivelPrioridade === 'alta').length,
    media: activeTarefas.filter(t => t.nivelPrioridade === 'media').length,
    baixa: activeTarefas.filter(t => t.nivelPrioridade === 'baixa').length,
  }

  return (
    <div className="p-6 space-y-5 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target size={22} className="text-indigo-500" />
            Central de Prioridades
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Visão consolidada de todas as prioridades em ordem de urgência</p>
        </div>
        <button
          onClick={() => { recalcularPrioridades(); toast.success('Prioridades recalculadas!') }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
        >
          <RefreshCw size={13} /> Recalcular
        </button>
      </div>

      {/* Level summary */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.entries(nivelCounts) as [NivelPrioridade, number][]).map(([nivel, count]) => (
          <button
            key={nivel}
            onClick={() => setNivelFilter(n => n === nivel ? '' : nivel)}
            className={cn(
              'rounded-xl border p-4 text-center transition-all',
              nivelFilter === nivel ? 'ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-slate-900' : 'hover:shadow-sm',
              nivel === 'critica' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40' :
              nivel === 'alta' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40' :
              nivel === 'media' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/40' :
              'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'
            )}
          >
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{count}</div>
            <PriorityBadge nivel={nivel} />
          </button>
        ))}
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowFilters(f => !f)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors',
            showFilters || hasFilters
              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Filter size={13} /> Filtros {hasFilters && `(ativo)`}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
            <X size={12} /> Limpar filtros
          </button>
        )}
        <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
          {filtered.length} tarefa{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value as Time | '')} className={selectClass}>
            <option value="">Todos os times</option>
            <option value="b2c">B2C</option>
            <option value="campinas">Campinas</option>
            <option value="produtos">Produtos</option>
          </select>
          <select value={projetoFilter} onChange={e => setProjetoFilter(e.target.value)} className={selectClass}>
            <option value="">Todos os projetos</option>
            {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <select value={nivelFilter} onChange={e => setNivelFilter(e.target.value as NivelPrioridade | '')} className={selectClass}>
            <option value="">Todos os níveis</option>
            <option value="critica">🔴 Crítica</option>
            <option value="alta">🟠 Alta</option>
            <option value="media">🟡 Média</option>
            <option value="baixa">⚪ Baixa</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={somenteAtrasadas} onChange={e => setSomenteAtrasadas(e.target.checked)} className="accent-indigo-600" />
            Apenas atrasadas
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={somenteParadas} onChange={e => setSomenteParadas(e.target.checked)} className="accent-indigo-600" />
            Apenas paradas
          </label>
        </div>
      )}

      {/* Priority table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto] gap-0 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="w-12 text-center">#</div>
          <div className="w-16 text-center">Score</div>
          <div className="pl-2">Tarefa</div>
          <div className="w-20 text-center">Time</div>
          <div className="w-24 text-center">Status</div>
          <div className="w-24 text-center">Prazo</div>
          <div className="w-24 text-center">Responsável</div>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
            Nenhuma prioridade encontrada com os filtros selecionados
          </div>
        )}

        {filtered.map((t, i) => {
          const projeto = projetos.find(p => p.id === t.projetoId)
          const overdue = isOverdue(t.prazo) && t.status !== 'concluido'
          return (
            <div
              key={t.id}
              onClick={() => setSelectedTarefa(t)}
              className={cn(
                'grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto] gap-0 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors',
                'hover:bg-slate-50 dark:hover:bg-slate-800/60',
                overdue && 'bg-red-50/30 dark:bg-red-950/10'
              )}
            >
              <div className="w-12 flex items-center justify-center text-xs text-slate-400 font-mono">{i + 1}</div>
              <div className="w-16 flex items-center justify-center">
                <ScoreBadge score={t.scorePrioridade} />
              </div>
              <div className="pl-2 flex flex-col justify-center min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{t.titulo}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <PriorityBadge nivel={t.nivelPrioridade} size="xs" showIcon={false} />
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{t.motivoPrioridade} · {projeto?.nome}</p>
                </div>
              </div>
              <div className="w-20 flex items-center justify-center">
                <TimeBadge time={t.time} />
              </div>
              <div className="w-24 flex items-center justify-center">
                <StatusBadge status={t.status} size="xs" />
              </div>
              <div className={cn('w-24 flex items-center justify-center text-xs font-medium', overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400')}>
                {prazoLabel(t.prazo, t.status)}
              </div>
              <div className="w-24 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                {t.responsavel ? t.responsavel.split(' ')[0] : <span className="text-red-500">Sem resp.</span>}
              </div>
            </div>
          )
        })}
      </div>

      <TaskDetailsDrawer tarefa={selectedTarefa} onClose={() => setSelectedTarefa(null)} />
    </div>
  )
}
