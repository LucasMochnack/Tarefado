import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ListTodo, Plus, Filter, X, Grid3X3, List, Table } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Tarefa, StatusTarefa, NivelPrioridade, Time, FiltrosTarefa } from '@/types'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { TaskDetailsDrawer } from '@/components/tasks/TaskDetailsDrawer'
import { VoiceInputButton } from '@/components/shared/VoiceInputButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge, ScoreBadge } from '@/components/shared/PriorityBadge'
import { TimeBadge } from '@/components/shared/TimeBadge'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { isOverdue, daysSinceUpdate, prazoLabel, formatDate } from '@/utils/dates'
import { RESPONSAVEIS } from '@/data/mockData'
import { cn } from '@/lib/utils'
import { usePermissoes } from '@/hooks/usePermissoes'
import toast from 'react-hot-toast'
import { Trash2, Edit2 } from 'lucide-react'

type ViewMode = 'lista' | 'cards' | 'tabela'

export function Tarefas() {
  const [searchParams] = useSearchParams()
  const { tarefas: todasTarefas, projetos, deleteTarefa } = useStore()
  const timesPermitidos = usePermissoes()
  const tarefas = timesPermitidos ? todasTarefas.filter(t => timesPermitidos.includes(t.time)) : todasTarefas
  const [taskOpen, setTaskOpen] = useState(false)
  const [editTarefa, setEditTarefa] = useState<Tarefa | null>(null)
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tarefa | null>(null)
  const [view, setView] = useState<ViewMode>('lista')
  const [showFilters, setShowFilters] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosTarefa>({
    busca: searchParams.get('busca') || '',
  })

  useEffect(() => {
    const busca = searchParams.get('busca')
    if (busca) setFiltros(f => ({ ...f, busca }))
  }, [searchParams])

  const filtered = tarefas.filter(t => {
    if (filtros.projeto && t.projetoId !== filtros.projeto) return false
    if (filtros.time && t.time !== filtros.time) return false
    if (filtros.status && t.status !== filtros.status) return false
    if (filtros.prioridade && t.nivelPrioridade !== filtros.prioridade) return false
    if (filtros.responsavel && t.responsavel !== filtros.responsavel) return false
    if (filtros.somenteAtrasadas && (!isOverdue(t.prazo) || t.status === 'concluido')) return false
    if (filtros.somenteParadas && daysSinceUpdate(t.ultimaAtualizacao) < 7) return false
    if (filtros.semResponsavel && !!t.responsavel) return false
    if (filtros.busca) {
      const q = filtros.busca.toLowerCase()
      if (!t.titulo.toLowerCase().includes(q) && !t.descricao.toLowerCase().includes(q)) return false
    }
    return true
  }).sort((a, b) => b.scorePrioridade - a.scorePrioridade)

  const hasFilters = Object.values(filtros).some(v => v !== undefined && v !== '' && v !== false)
  const clearFilters = () => setFiltros({})

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteTarefa(deleteTarget.id)
    toast.success('Tarefa excluída!')
    setDeleteTarget(null)
  }

  const selectClass = 'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30'

  return (
    <div className="p-6 space-y-5 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ListTodo size={22} className="text-indigo-500" />
            Todas as Tarefas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{filtered.length} tarefa{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <VoiceInputButton size="sm" />
          <button onClick={() => setTaskOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
            <Plus size={15} /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Buscar por nome ou descrição..."
          value={filtros.busca || ''}
          onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-64"
        />

        <button onClick={() => setShowFilters(f => !f)} className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors',
          showFilters || hasFilters
            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        )}>
          <Filter size={12} /> Filtros
        </button>

        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
            <X size={12} /> Limpar
          </button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button onClick={() => setView('lista')} className={cn('p-1.5 rounded-md transition-colors', view === 'lista' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200')}>
            <List size={14} />
          </button>
          <button onClick={() => setView('cards')} className={cn('p-1.5 rounded-md transition-colors', view === 'cards' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200')}>
            <Grid3X3 size={14} />
          </button>
          <button onClick={() => setView('tabela')} className={cn('p-1.5 rounded-md transition-colors', view === 'tabela' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200')}>
            <Table size={14} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <select value={filtros.time || ''} onChange={e => setFiltros(f => ({ ...f, time: e.target.value as Time || undefined }))} className={selectClass}>
            <option value="">Todos os times</option>
            <option value="b2c">B2C</option>
            <option value="campinas">Campinas</option>
            <option value="produtos">Produtos</option>
          </select>
          <select value={filtros.projeto || ''} onChange={e => setFiltros(f => ({ ...f, projeto: e.target.value || undefined }))} className={selectClass}>
            <option value="">Todos os projetos</option>
            {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <select value={filtros.status || ''} onChange={e => setFiltros(f => ({ ...f, status: e.target.value as StatusTarefa || undefined }))} className={selectClass}>
            <option value="">Todos os status</option>
            <option value="a-fazer">A Fazer</option>
            <option value="em-andamento">Em Andamento</option>
            <option value="aguardando">Aguardando</option>
            <option value="concluido">Concluído</option>
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

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <ListTodo size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Nenhuma tarefa encontrada</p>
          <button onClick={() => setTaskOpen(true)} className="mt-3 text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
            Criar primeira tarefa
          </button>
        </div>
      )}

      {/* Lista view */}
      {view === 'lista' && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(t => {
            const projeto = projetos.find(p => p.id === t.projetoId)
            const overdue = isOverdue(t.prazo) && t.status !== 'concluido'
            return (
              <div key={t.id} className={cn(
                'bg-white dark:bg-slate-900 rounded-xl border p-4 flex items-center gap-4 group hover:shadow-sm transition-all',
                overdue ? 'border-red-200 dark:border-red-900/40' : 'border-slate-200 dark:border-slate-700'
              )}>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={t.status} size="xs" />
                  <PriorityBadge nivel={t.nivelPrioridade} size="xs" />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTarefa(t)}>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t.titulo}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{projeto?.nome} · {t.motivoPrioridade}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <TimeBadge time={t.time} />
                  {t.responsavel
                    ? <UserAvatar nome={t.responsavel} size="xs" showName />
                    : <span className="text-xs text-slate-400">—</span>
                  }
                  <span className={cn('text-xs font-medium', overdue ? 'text-red-500' : 'text-slate-400 dark:text-slate-500')}>
                    {prazoLabel(t.prazo, t.status)}
                  </span>
                  <ScoreBadge score={t.scorePrioridade} />
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditTarefa(t)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Cards view */}
      {view === 'cards' && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => {
            const projeto = projetos.find(p => p.id === t.projetoId)
            const overdue = isOverdue(t.prazo) && t.status !== 'concluido'
            return (
              <div key={t.id} onClick={() => setSelectedTarefa(t)} className={cn(
                'bg-white dark:bg-slate-900 rounded-xl border p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all',
                overdue ? 'border-red-200 dark:border-red-900/40' : 'border-slate-200 dark:border-slate-700'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <PriorityBadge nivel={t.nivelPrioridade} size="xs" />
                  <StatusBadge status={t.status} size="xs" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1 line-clamp-2">{t.titulo}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{t.descricao}</p>
                <div className="flex items-center justify-between">
                  <TimeBadge time={t.time} />
                  <span className={cn('text-xs', overdue ? 'text-red-500 font-medium' : 'text-slate-400 dark:text-slate-500')}>{prazoLabel(t.prazo, t.status)}</span>
                </div>
                {projeto && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 truncate">{projeto.nome}</p>}
              </div>
            )
          })}
        </div>
      )}

      {/* Table view */}
      {view === 'tabela' && filtered.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tarefa</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Prioridade</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Time</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Responsável</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Prazo</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Score</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const overdue = isOverdue(t.prazo) && t.status !== 'concluido'
                return (
                  <tr key={t.id} className={cn(
                    'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group',
                    overdue && 'bg-red-50/30 dark:bg-red-950/10'
                  )} onClick={() => setSelectedTarefa(t)}>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{t.titulo}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} size="xs" /></td>
                    <td className="px-4 py-3"><PriorityBadge nivel={t.nivelPrioridade} size="xs" /></td>
                    <td className="px-4 py-3"><TimeBadge time={t.time} /></td>
                    <td className="px-4 py-3">
                      {t.responsavel ? <UserAvatar nome={t.responsavel} size="sm" showName /> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className={cn('px-4 py-3 font-medium', overdue ? 'text-red-500' : 'text-slate-500 dark:text-slate-400')}>
                      {formatDate(t.prazo)}
                    </td>
                    <td className="px-4 py-3"><ScoreBadge score={t.scorePrioridade} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEditTarefa(t)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition-colors">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => setDeleteTarget(t)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <TaskFormModal open={taskOpen} onOpenChange={setTaskOpen} />
      <TaskFormModal open={!!editTarefa} onOpenChange={v => !v && setEditTarefa(null)} tarefa={editTarefa || undefined} />
      <TaskDetailsDrawer tarefa={selectedTarefa} onClose={() => setSelectedTarefa(null)} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={v => !v && setDeleteTarget(null)}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir "${deleteTarget?.titulo}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
      />
    </div>
  )
}
