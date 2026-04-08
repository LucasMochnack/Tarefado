import { useState } from 'react'
import { Target, RefreshCw, Filter, X, GripVertical, Zap, Clock, Trash2, Calendar, Plus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Tarefa, Time, NivelPrioridade, QuadranteEisenhower } from '@/types'
import { TaskDetailsDrawer } from '@/components/tasks/TaskDetailsDrawer'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TimeBadge } from '@/components/shared/TimeBadge'
import { UserAvatarPicker } from '@/components/shared/UserAvatarPicker'
import { isOverdue, daysSinceUpdate, prazoLabel } from '@/utils/dates'
import { cn } from '@/lib/utils'
import { usePermissoes } from '@/hooks/usePermissoes'
import toast from 'react-hot-toast'

const TODOS_TIMES: { value: Time; label: string }[] = [
  { value: 'alta-renda',  label: 'Alta Renda' },
  { value: 'varejo',      label: 'Varejo' },
  { value: 'on-demand',   label: 'On Demand' },
  { value: 'b2c',         label: 'B2C' },
  { value: 'campinas',    label: 'Campinas' },
  { value: 'produtos',    label: 'Produtos' },
  { value: 'performance', label: 'Performance' },
]

const QUADRANTES: {
  id: QuadranteEisenhower
  label: string
  sub: string
  icon: React.ElementType
  border: string
  bg: string
  labelColor: string
  urgente: boolean
  importante: boolean
}[] = [
  {
    id: 'importante-urgente',
    label: 'FAZER AGORA',
    sub: 'Importante + Urgente',
    icon: Zap,
    border: 'border-red-200 dark:border-red-900/40',
    bg: 'bg-red-50/60 dark:bg-red-950/10',
    labelColor: 'text-red-600 dark:text-red-400',
    urgente: true,
    importante: true,
  },
  {
    id: 'importante-nao-urgente',
    label: 'AGENDAR',
    sub: 'Importante + Não Urgente',
    icon: Calendar,
    border: 'border-blue-200 dark:border-blue-900/40',
    bg: 'bg-blue-50/60 dark:bg-blue-950/10',
    labelColor: 'text-blue-600 dark:text-blue-400',
    urgente: false,
    importante: true,
  },
  {
    id: 'nao-importante-urgente',
    label: 'DELEGAR',
    sub: 'Não Importante + Urgente',
    icon: Clock,
    border: 'border-yellow-200 dark:border-yellow-900/40',
    bg: 'bg-yellow-50/60 dark:bg-yellow-950/10',
    labelColor: 'text-yellow-600 dark:text-yellow-400',
    urgente: true,
    importante: false,
  },
  {
    id: 'nao-importante-nao-urgente',
    label: 'IDEIA DE LONGO PRAZO',
    sub: 'Não Importante + Não Urgente',
    icon: Trash2,
    border: 'border-slate-200 dark:border-slate-700',
    bg: 'bg-slate-50/60 dark:bg-slate-800/20',
    labelColor: 'text-slate-500 dark:text-slate-400',
    urgente: false,
    importante: false,
  },
]

export function Prioridades() {
  const { tarefas: todasTarefas, projetos, recalcularPrioridades, updateTarefa } = useStore()
  const timesPermitidos = usePermissoes()
  const tarefas = timesPermitidos ? todasTarefas.filter(t => timesPermitidos.includes(t.time)) : todasTarefas
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [timeFilter, setTimeFilter] = useState<Time | ''>('')
  const [nivelFilter, setNivelFilter] = useState<NivelPrioridade | ''>('')
  const [showFilters, setShowFilters] = useState(false)
  const [dragOverQuadrante, setDragOverQuadrante] = useState<QuadranteEisenhower | 'backlog' | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const activeTarefas = tarefas
    .filter(t => t.status !== 'concluido')
    .filter(t => !timeFilter || t.time === timeFilter)
    .filter(t => !nivelFilter || t.nivelPrioridade === nivelFilter)

  const backlog = activeTarefas.filter(t => !t.quadranteEisenhower)
  const hasFilters = !!(timeFilter || nivelFilter)

  const tarefasNoQuadrante = (q: QuadranteEisenhower) =>
    activeTarefas.filter(t => t.quadranteEisenhower === q)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverQuadrante(null)
  }

  const handleDrop = (e: React.DragEvent, destino: QuadranteEisenhower | 'backlog') => {
    e.preventDefault()
    if (!draggedId) return
    if (destino === 'backlog') {
      updateTarefa(draggedId, { quadranteEisenhower: undefined })
      toast.success('Tarefa movida para o backlog')
    } else {
      updateTarefa(draggedId, { quadranteEisenhower: destino })
      const q = QUADRANTES.find(q => q.id === destino)
      toast.success(`Tarefa movida para "${q?.label}"`)
    }
    setDraggedId(null)
    setDragOverQuadrante(null)
  }

  const selectClass = 'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30'

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target size={22} className="text-indigo-500" />
            Matriz de Eisenhower
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Priorize suas tarefas pela urgência e importância</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors',
              showFilters || hasFilters
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <Filter size={13} /> Filtros {hasFilters && '(ativo)'}
          </button>
          {hasFilters && (
            <button onClick={() => { setTimeFilter(''); setNivelFilter('') }} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
              <X size={12} /> Limpar
            </button>
          )}
          <button
            onClick={() => { recalcularPrioridades(); toast.success('Prioridades recalculadas!') }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            <RefreshCw size={13} /> Recalcular
          </button>
        </div>
      </div>

      {/* Filtro de time — sempre visível */}
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        <button
          onClick={() => setTimeFilter('')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            timeFilter === ''
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600'
          )}
        >
          Todos
        </button>
        {TODOS_TIMES.map(t => (
          <button
            key={t.value}
            onClick={() => setTimeFilter(prev => prev === t.value ? '' : t.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              timeFilter === t.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600'
            )}
          >
            {t.label}
          </button>
        ))}
        {nivelFilter && (
          <button onClick={() => setNivelFilter('')} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors ml-1">
            <X size={12} /> Limpar nível
          </button>
        )}
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex-shrink-0">
          <select value={nivelFilter} onChange={e => setNivelFilter(e.target.value as NivelPrioridade | '')} className={selectClass}>
            <option value="">Todos os níveis</option>
            <option value="critica">🔴 Crítica</option>
            <option value="alta">🟠 Alta</option>
            <option value="media">🟡 Média</option>
            <option value="baixa">⚪ Baixa</option>
          </select>
        </div>
      )}

      {/* Colunas urgente / não urgente */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Matriz 2x2 */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Header urgente */}
          <div className="grid grid-cols-2 gap-4 mb-1">
            <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-100/60 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
              <Zap size={13} className="text-red-500" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Urgente</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <Clock size={13} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Não Urgente</span>
            </div>
          </div>

          {/* Linhas: Importante / Não Importante */}
          <div className="flex-1 min-h-0 grid grid-rows-2 gap-4">
            {/* Linha 1: Importante */}
            <div className="grid grid-cols-2 gap-4">
              {QUADRANTES.filter(q => q.importante).map(q => (
                <QuadranteBox
                  key={q.id}
                  quadrante={q}
                  tarefas={tarefasNoQuadrante(q.id)}
                  dragOver={dragOverQuadrante === q.id}
                  draggedId={draggedId}
                  onDragOver={e => { e.preventDefault(); setDragOverQuadrante(q.id) }}
                  onDragLeave={() => setDragOverQuadrante(null)}
                  onDrop={e => handleDrop(e, q.id)}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onCardClick={setSelectedTarefa}
                />
              ))}
            </div>
            {/* Linha 2: Não Importante */}
            <div className="grid grid-cols-2 gap-4">
              {QUADRANTES.filter(q => !q.importante).map(q => (
                <QuadranteBox
                  key={q.id}
                  quadrante={q}
                  tarefas={tarefasNoQuadrante(q.id)}
                  dragOver={dragOverQuadrante === q.id}
                  draggedId={draggedId}
                  onDragOver={e => { e.preventDefault(); setDragOverQuadrante(q.id) }}
                  onDragLeave={() => setDragOverQuadrante(null)}
                  onDrop={e => handleDrop(e, q.id)}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onCardClick={setSelectedTarefa}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Indicador importante */}
        <div className="flex flex-col items-center justify-center w-6 flex-shrink-0 gap-1 select-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Importante</span>
          <div className="flex-1 w-px bg-gradient-to-b from-indigo-300 via-slate-300 to-slate-200 dark:from-indigo-700 dark:via-slate-600 dark:to-slate-700 rounded-full" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Não Importante</span>
        </div>

        {/* Backlog de tarefas */}
        <div
          className={cn(
            'w-72 flex-shrink-0 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed transition-colors flex flex-col',
            dragOverQuadrante === 'backlog'
              ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-slate-200 dark:border-slate-700'
          )}
          onDragOver={e => { e.preventDefault(); setDragOverQuadrante('backlog') }}
          onDragLeave={() => setDragOverQuadrante(null)}
          onDrop={e => handleDrop(e, 'backlog')}
        >
          <div className="px-4 pt-4 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Tarefas
              </h3>
              <button
                onClick={() => setTaskFormOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium transition-colors"
                title="Nova tarefa"
              >
                <Plus size={11} /> Nova
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Arraste para um quadrante</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5 min-h-0">
            {backlog.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8 italic">
                {activeTarefas.length === 0 ? 'Nenhuma tarefa' : 'Todas classificadas!'}
              </p>
            )}
            {backlog.map(t => (
              <BacklogCard
                key={t.id}
                tarefa={t}
                dragging={draggedId === t.id}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedTarefa(t)}
              />
            ))}
          </div>
        </div>
      </div>

      <TaskDetailsDrawer tarefa={selectedTarefa} onClose={() => setSelectedTarefa(null)} />
      <TaskFormModal open={taskFormOpen} onOpenChange={setTaskFormOpen} />
    </div>
  )
}

function QuadranteBox({
  quadrante, tarefas, dragOver, draggedId,
  onDragOver, onDragLeave, onDrop, onDragStart, onDragEnd, onCardClick
}: {
  quadrante: typeof QUADRANTES[0]
  tarefas: Tarefa[]
  dragOver: boolean
  draggedId: string | null
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  onCardClick: (t: Tarefa) => void
}) {
  const Icon = quadrante.icon
  return (
    <div
      className={cn(
        'rounded-xl border-2 p-3 flex flex-col min-h-0 transition-all',
        quadrante.border, quadrante.bg,
        dragOver && 'ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-slate-900 scale-[1.01]'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
        <Icon size={13} className={quadrante.labelColor} />
        <span className={cn('text-xs font-bold uppercase tracking-wide', quadrante.labelColor)}>{quadrante.label}</span>
        <span className="ml-auto text-[10px] text-slate-400 font-medium">{tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''}</span>
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 flex-shrink-0">{quadrante.sub}</p>
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[60px]">
        {tarefas.length === 0 && (
          <p className="text-[11px] text-slate-300 dark:text-slate-600 italic text-center pt-4">Nenhum projeto neste quadrante</p>
        )}
        {tarefas.map(t => (
          <QuadranteCard
            key={t.id}
            tarefa={t}
            dragging={draggedId === t.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={() => onCardClick(t)}
          />
        ))}
      </div>
    </div>
  )
}

function QuadranteCard({ tarefa: t, dragging, onDragStart, onDragEnd, onClick }: {
  tarefa: Tarefa
  dragging: boolean
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  onClick: () => void
}) {
  const overdue = isOverdue(t.prazo) && t.status !== 'concluido'
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, t.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all select-none',
        dragging && 'opacity-40 scale-95'
      )}
    >
      <GripVertical size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{t.titulo}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <PriorityBadge nivel={t.nivelPrioridade} size="xs" showIcon={false} />
          <span className={cn('text-[10px]', overdue ? 'text-red-400' : 'text-slate-400')}>
            {prazoLabel(t.prazo, t.status)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <TimeBadge time={t.time} />
        <UserAvatarPicker tarefaId={t.id} responsavel={t.responsavel} size="sm" />
      </div>
    </div>
  )
}

function BacklogCard({ tarefa: t, dragging, onDragStart, onDragEnd, onClick }: {
  tarefa: Tarefa
  dragging: boolean
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  onClick: () => void
}) {
  const overdue = isOverdue(t.prazo) && t.status !== 'concluido'
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, t.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        'flex items-start gap-2 px-2.5 py-2 rounded-lg border cursor-grab active:cursor-grabbing hover:shadow-sm transition-all select-none group',
        'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        overdue && 'border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/10',
        dragging && 'opacity-40 scale-95'
      )}
    >
      <GripVertical size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2">{t.titulo}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <PriorityBadge nivel={t.nivelPrioridade} size="xs" showIcon={false} />
          <StatusBadge status={t.status} size="xs" />
          <span className={cn('text-[10px]', overdue ? 'text-red-400' : 'text-slate-400')}>
            {prazoLabel(t.prazo, t.status)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <TimeBadge time={t.time} />
          <UserAvatarPicker tarefaId={t.id} responsavel={t.responsavel} size="sm" />
        </div>
      </div>
    </div>
  )
}
