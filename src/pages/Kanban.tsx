import { useState } from 'react'
import { Filter, X, RefreshCw, Plus } from 'lucide-react'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { FiltrosTarefa, StatusTarefa, NivelPrioridade, Time } from '@/types'
import { useStore } from '@/store/useStore'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { VoiceInputButton } from '@/components/shared/VoiceInputButton'
import { RESPONSAVEIS } from '@/data/mockData'
import { cn } from '@/lib/utils'

const TODOS_TIMES: { value: Time; label: string }[] = [
  { value: 'alta-renda', label: 'Alta Renda' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'on-demand', label: 'On Demand' },
  { value: 'b2c', label: 'B2C' },
  { value: 'campinas', label: 'Campinas' },
  { value: 'produtos', label: 'Produtos' },
  { value: 'performance', label: 'Performance' },
  { value: 'geral', label: 'Geral' },
]

export function Kanban() {
  const { projetos, recalcularPrioridades } = useStore()
  const [taskOpen, setTaskOpen] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosTarefa>({})
  const [showFilters, setShowFilters] = useState(false)

  const hasFilters = Object.values(filtros).some(v => v !== undefined && v !== '' && v !== false)

  const clearFilters = () => setFiltros({})

  const selectClass = 'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30'

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Kanban</h1>

        <div className="flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={filtros.busca || ''}
            onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <button
          onClick={() => setShowFilters(f => !f)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors',
            showFilters || hasFilters
              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Filter size={13} />
          Filtros {hasFilters && `(${Object.values(filtros).filter(v => v !== undefined && v !== '' && v !== false).length})`}
        </button>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors">
            <X size={13} /> Limpar
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={recalcularPrioridades}
            title="Recalcular prioridades"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
          <VoiceInputButton size="sm" />
          <button
            onClick={() => setTaskOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
          >
            <Plus size={13} /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* Filtro de time — sempre visível */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2 px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <button
          onClick={() => setFiltros(f => ({ ...f, time: undefined }))}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            !filtros.time
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600'
          )}
        >
          Todos
        </button>
        {TODOS_TIMES.map(t => (
          <button
            key={t.value}
            onClick={() => setFiltros(f => ({ ...f, time: f.time === t.value ? undefined : t.value as Time }))}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              filtros.time === t.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters avançados */}
      {showFilters && (
        <div className="flex-shrink-0 flex flex-wrap gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <select value={filtros.time || ''} onChange={e => setFiltros(f => ({ ...f, time: e.target.value as Time || undefined }))} className={selectClass}>
            <option value="">Todos os times</option>
            {TODOS_TIMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={filtros.projeto || ''} onChange={e => setFiltros(f => ({ ...f, projeto: e.target.value || undefined }))} className={selectClass}>
            <option value="">Todos os projetos</option>
            {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <select value={filtros.prioridade || ''} onChange={e => setFiltros(f => ({ ...f, prioridade: e.target.value as NivelPrioridade || undefined }))} className={selectClass}>
            <option value="">Todas as prioridades</option>
            <option value="critica">🔴 Crítica</option>
            <option value="alta">🟠 Alta</option>
            <option value="media">🟡 Média</option>
            <option value="baixa">⚪ Baixa</option>
          </select>
          <select value={filtros.responsavel || ''} onChange={e => setFiltros(f => ({ ...f, responsavel: e.target.value || undefined }))} className={selectClass}>
            <option value="">Todos os responsáveis</option>
            {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={!!filtros.somenteAtrasadas} onChange={e => setFiltros(f => ({ ...f, somenteAtrasadas: e.target.checked || undefined }))} className="accent-indigo-600" />
            Apenas atrasadas
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={!!filtros.somenteParadas} onChange={e => setFiltros(f => ({ ...f, somenteParadas: e.target.checked || undefined }))} className="accent-indigo-600" />
            Apenas paradas
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={!!filtros.semResponsavel} onChange={e => setFiltros(f => ({ ...f, semResponsavel: e.target.checked || undefined }))} className="accent-indigo-600" />
            Sem responsável
          </label>
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6 min-h-0">
        <KanbanBoard filtros={filtros} />
      </div>

      <TaskFormModal open={taskOpen} onOpenChange={setTaskOpen} />
    </div>
  )
}
