import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, RefreshCw, Filter, X, Flame, AlertTriangle, Clock, PauseCircle, CalendarDays, CheckCircle2, Circle, Timer, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Tag, Send, Maximize2, Minimize2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Time, Tarefa, FiltrosTarefa, NivelPrioridade, StatusTarefa } from '@/types'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { TaskDetailsDrawer } from '@/components/tasks/TaskDetailsDrawer'
import { VoiceInputButton } from '@/components/shared/VoiceInputButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge, ScoreBadge } from '@/components/shared/PriorityBadge'
import { StatCard } from '@/components/shared/StatCard'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { isOverdue, isDueToday, isDueTomorrow, daysSinceUpdate, prazoLabel, daysUntilDue } from '@/utils/dates'
import { RESPONSAVEIS } from '@/data/mockData'
import { cn } from '@/lib/utils'
import { usePermissoes } from '@/hooks/usePermissoes'
import toast from 'react-hot-toast'

const TIME_CONFIG: Record<string, {
  label: string; color: string; bg: string; desc: string
}> = {
  'alta-renda': { label: 'Alta Renda', color: '#009974', bg: 'from-emerald-600 to-teal-700', desc: 'Atendimento e relacionamento com clientes de alta renda' },
  varejo: { label: 'Varejo', color: '#3b82f6', bg: 'from-blue-600 to-sky-700', desc: 'Operações, campanhas e atendimento ao segmento de varejo' },
  'on-demand': { label: 'On Demand', color: '#f59e0b', bg: 'from-amber-500 to-orange-600', desc: 'Demandas avulsas e tarefas pontuais' },
  performance: { label: 'Performance', color: '#f43f5e', bg: 'from-rose-500 to-pink-600', desc: 'Métricas, resultados e acompanhamento de performance' },
  b2c: { label: 'B2C', color: '#8b5cf6', bg: 'from-violet-600 to-indigo-700', desc: 'Relacionamento com clientes e atividades de conversão' },
  campinas: { label: 'Campinas', color: '#3b82f6', bg: 'from-blue-600 to-sky-700', desc: 'Operação local e estratégia da unidade' },
  produtos: { label: 'Produtos', color: '#10b981', bg: 'from-emerald-600 to-teal-700', desc: 'Campanhas, materiais e lançamentos' },
}

type ViewMode = 'lista' | 'kanban' | 'prioridades' | 'agenda'

export function TimeDetalhe() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { tarefas: todasTarefas, projetos, recalcularPrioridades } = useStore()
  const timesPermitidos = usePermissoes()
  const tarefas = timesPermitidos ? todasTarefas.filter(t => timesPermitidos.includes(t.time)) : todasTarefas
  const [taskOpen, setTaskOpen] = useState(false)
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null)
  const [view, setView] = useState<ViewMode>('agenda')
  const [filtros, setFiltros] = useState<FiltrosTarefa>({})
  const [showFilters, setShowFilters] = useState(false)

  const time = slug as Time
  const config = TIME_CONFIG[time]

  if (!config) {
    navigate('/times')
    return null
  }

  const timeTarefas = tarefas.filter(t => t.time === time)
  const pendentes = timeTarefas.filter(t => t.status === 'a-fazer').length
  const andamento = timeTarefas.filter(t => t.status === 'em-andamento').length
  const concluidas = timeTarefas.filter(t => t.status === 'concluido').length
  const atrasadas = timeTarefas.filter(t => isOverdue(t.prazo) && t.status !== 'concluido').length
  const paradas = timeTarefas.filter(t => daysSinceUpdate(t.ultimaAtualizacao) > 7 && t.status !== 'concluido').length
  const criticas = timeTarefas.filter(t => t.nivelPrioridade === 'critica' && t.status !== 'concluido').length

  const filteredTarefas = timeTarefas.filter(t => {
    if (filtros.projeto && t.projetoId !== filtros.projeto) return false
    if (filtros.status && t.status !== filtros.status) return false
    if (filtros.prioridade && t.nivelPrioridade !== filtros.prioridade) return false
    if (filtros.responsavel && t.responsavel !== filtros.responsavel) return false
    if (filtros.somenteAtrasadas && (!isOverdue(t.prazo) || t.status === 'concluido')) return false
    if (filtros.somenteParadas && daysSinceUpdate(t.ultimaAtualizacao) < 7) return false
    if (filtros.semResponsavel && !!t.responsavel) return false
    if (filtros.busca) {
      const q = filtros.busca.toLowerCase()
      if (!t.titulo.toLowerCase().includes(q)) return false
    }
    return true
  }).sort((a, b) => b.scorePrioridade - a.scorePrioridade)

  const hasFilters = Object.values(filtros).some(v => v !== undefined && v !== '' && v !== false)

  const selectClass = 'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30'

  const timeProjects = projetos.filter(p => p.time === time)

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header compacto */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/times')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0">
            <ArrowLeft size={13} /> Times
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
          {/* Bolinha colorida com a cor do time */}
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">{config.label}</h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{config.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => { recalcularPrioridades(); toast.success('Prioridades recalculadas!') }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors">
            <RefreshCw size={12} /> Gerar prioridades
          </button>
          <VoiceInputButton defaultTime={time} size="sm" />
          <button onClick={() => setTaskOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors">
            <Plus size={12} /> Nova Tarefa
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Views + Filters toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {(['lista', 'kanban', 'prioridades', 'agenda'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)} className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize',
                view === v ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}>
                {v}
              </button>
            ))}
          </div>

          <button onClick={() => setShowFilters(f => !f)} className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors',
            showFilters || hasFilters
              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}>
            <Filter size={12} /> Filtros
          </button>

          {hasFilters && (
            <button onClick={() => setFiltros({})} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1">
              <X size={12} /> Limpar
            </button>
          )}

          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder={`Buscar no time ${config.label}...`}
              value={filtros.busca || ''}
              onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))}
              className="w-full max-w-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>

        {/* Filter row */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <select value={filtros.projeto || ''} onChange={e => setFiltros(f => ({ ...f, projeto: e.target.value || undefined }))} className={selectClass}>
              <option value="">Todos os projetos</option>
              {timeProjects.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
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

        {/* Content */}
        {view === 'kanban' ? (
          <div className="h-[600px]">
            <KanbanBoard filtros={{ ...filtros, time }} />
          </div>
        ) : view === 'prioridades' ? (
          <PrioridadesView tarefas={filteredTarefas} projetos={projetos} onCardClick={setSelectedTarefa} />
        ) : view === 'agenda' ? (
          <AgendaView tarefas={filteredTarefas} projetos={projetos} onCardClick={setSelectedTarefa} onAddTask={() => setTaskOpen(true)} timeLabel={config.label} time={time} />
        ) : (
          <ListaView tarefas={filteredTarefas} projetos={projetos} onCardClick={setSelectedTarefa} />
        )}
      </div>

      <TaskFormModal open={taskOpen} onOpenChange={setTaskOpen} defaultTime={time} />
      <TaskDetailsDrawer tarefa={selectedTarefa} onClose={() => setSelectedTarefa(null)} />
    </div>
  )
}

function ListaView({ tarefas, projetos, onCardClick }: { tarefas: Tarefa[]; projetos: any[]; onCardClick: (t: Tarefa) => void }) {
  if (tarefas.length === 0) {
    return <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">Nenhuma tarefa encontrada</div>
  }
  return (
    <div className="space-y-2">
      {tarefas.map(t => {
        const projeto = projetos.find((p: any) => p.id === t.projetoId)
        const overdue = isOverdue(t.prazo) && t.status !== 'concluido'
        return (
          <div key={t.id} onClick={() => onCardClick(t)} className={cn(
            'bg-white dark:bg-slate-900 rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-all flex items-center gap-4',
            overdue ? 'border-red-200 dark:border-red-900/40' : 'border-slate-200 dark:border-slate-700'
          )}>
            <StatusBadge status={t.status} />
            <PriorityBadge nivel={t.nivelPrioridade} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{t.titulo}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{projeto?.nome}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
              {t.responsavel && <span className="hidden sm:block">{t.responsavel.split(' ')[0]}</span>}
              <span className={overdue ? 'text-red-500' : ''}>{prazoLabel(t.prazo, t.status)}</span>
              <ScoreBadge score={t.scorePrioridade} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PrioridadesView({ tarefas, projetos, onCardClick }: { tarefas: Tarefa[]; projetos: any[]; onCardClick: (t: Tarefa) => void }) {
  const sorted = [...tarefas].filter(t => t.status !== 'concluido').sort((a, b) => b.scorePrioridade - a.scorePrioridade)
  return (
    <div className="space-y-2">
      {sorted.map((t, i) => {
        const projeto = projetos.find((p: any) => p.id === t.projetoId)
        return (
          <div key={t.id} onClick={() => onCardClick(t)} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:shadow-sm transition-all flex items-center gap-4">
            <div className="w-6 text-center text-xs text-slate-400 dark:text-slate-500 font-mono">#{i + 1}</div>
            <ScoreBadge score={t.scorePrioridade} />
            <PriorityBadge nivel={t.nivelPrioridade} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{t.titulo}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{t.motivoPrioridade} · {projeto?.nome}</p>
            </div>
            <StatusBadge status={t.status} />
          </div>
        )
      })}
    </div>
  )
}

// ─── Agenda View ──────────────────────────────────────────────────────────────

const HORA_SLOTS = [
  { hora: '09:00', label: '', period: 'morning' },
  { hora: '10:00', label: '', period: 'morning' },
  { hora: '11:00', label: '', period: 'morning' },
  { hora: '12:00', label: '', period: 'morning' },
  { hora: '13:00', label: '', period: 'afternoon' },
  { hora: '14:00', label: '', period: 'afternoon' },
  { hora: '15:00', label: '', period: 'afternoon' },
  { hora: '16:00', label: '', period: 'afternoon' },
  { hora: '17:00', label: '', period: 'afternoon' },
]

const AGENDA_COLORS = [
  { label: 'Padrão',   value: null },
  { label: 'Azul',     value: '#3b82f6' },
  { label: 'Índigo',   value: '#6366f1' },
  { label: 'Roxo',     value: '#a855f7' },
  { label: 'Rosa',     value: '#ec4899' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Laranja',  value: '#f97316' },
  { label: 'Amarelo',  value: '#eab308' },
  { label: 'Verde',    value: '#10b981' },
  { label: 'Ciano',    value: '#06b6d4' },
  { label: 'Slate',    value: '#64748b' },
]

function isSpanningTask(t: Tarefa) {
  const si = HORA_SLOTS.findIndex(s => s.hora === t.horaAgenda)
  const ei = HORA_SLOTS.findIndex(s => s.hora === t.horaFim)
  return si !== -1 && ei !== -1 && ei > si
}

function distribuirTarefasNosSlots(tarefas: Tarefa[]): Record<string, Tarefa[]> {
  const slots: Record<string, Tarefa[]> = {}
  HORA_SLOTS.forEach(s => { slots[s.hora] = [] })

  const ativas = [...tarefas]
    .filter(t => t.status !== 'concluido')
    .sort((a, b) => b.scorePrioridade - a.scorePrioridade)

  const alocadas = new Set<string>()

  // 1. Hora fixa definida pelo usuário (horaAgenda)
  ativas.filter(t => t.horaAgenda && slots[t.horaAgenda]).forEach(t => {
    slots[t.horaAgenda!].push(t)
    alocadas.add(t.id)
  })

  const restantes = ativas.filter(t => !alocadas.has(t.id))

  // 2. Atrasadas → 09:00
  restantes.filter(t => isOverdue(t.prazo)).forEach(t => {
    slots['09:00'].push(t)
    alocadas.add(t.id)
  })

  // 3. Em andamento → manhã (9-11)
  const manha = ['09:00', '10:00', '11:00']
  restantes.filter(t => t.status === 'em-andamento' && !isOverdue(t.prazo)).forEach((t, i) => {
    slots[manha[i % manha.length]].push(t)
    alocadas.add(t.id)
  })

  // 4. Vencem hoje → tarde (13-15)
  const tarde = ['13:00', '14:00', '15:00']
  restantes.filter(t => isDueToday(t.prazo) && t.status !== 'em-andamento' && !alocadas.has(t.id)).forEach((t, i) => {
    slots[tarde[i % tarde.length]].push(t)
    alocadas.add(t.id)
  })

  // 5. Vencem amanhã → 16-17
  const tardeTarde = ['16:00', '17:00']
  restantes.filter(t => isDueTomorrow(t.prazo) && !isDueToday(t.prazo) && !alocadas.has(t.id)).forEach((t, i) => {
    slots[tardeTarde[i % tardeTarde.length]].push(t)
    alocadas.add(t.id)
  })

  // 6. Restantes não alocadas → distribuir a partir de 09:00
  const fallbackSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
  restantes.filter(t => !alocadas.has(t.id)).forEach((t, i) => {
    slots[fallbackSlots[i % fallbackSlots.length]].push(t)
  })

  return slots
}

const STATUS_NEXT: Record<StatusTarefa, StatusTarefa | null> = {
  'a-fazer': 'em-andamento',
  'em-andamento': 'concluido',
  'aguardando': 'em-andamento',
  'concluido': null,
}

const PRIORITY_LEGEND: { nivel: NivelPrioridade; label: string; border: string; bg: string; dot: string; activeBg: string }[] = [
  { nivel: 'critica', label: 'Crítica',  border: 'border-l-red-500',    bg: 'bg-red-50 dark:bg-red-950/20',     dot: 'bg-red-500',    activeBg: 'bg-red-100 dark:bg-red-900/40 ring-2 ring-red-400' },
  { nivel: 'alta',    label: 'Alta',     border: 'border-l-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20', dot: 'bg-orange-500', activeBg: 'bg-orange-100 dark:bg-orange-900/40 ring-2 ring-orange-400' },
  { nivel: 'media',   label: 'Média',    border: 'border-l-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/20', dot: 'bg-yellow-500', activeBg: 'bg-yellow-100 dark:bg-yellow-900/40 ring-2 ring-yellow-400' },
  { nivel: 'baixa',   label: 'Baixa',    border: 'border-l-slate-400',  bg: 'bg-slate-50 dark:bg-slate-800/40',  dot: 'bg-slate-400',  activeBg: 'bg-slate-200 dark:bg-slate-700/60 ring-2 ring-slate-400' },
]

function AgendaView({
  tarefas, projetos, onCardClick, onAddTask, timeLabel, time
}: {
  tarefas: Tarefa[]
  projetos: any[]
  onCardClick: (t: Tarefa) => void
  onAddTask: () => void
  timeLabel: string
  time: Time
}) {
  const { moveTarefa, addTarefa, updateTarefa } = useStore()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [quickTask, setQuickTask] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverHora, setDragOverHora] = useState<string | null>(null)
  const [slotOrders, setSlotOrders] = useState<Record<string, string[]>>({})
  const [editingHoraId, setEditingHoraId] = useState<string | null>(null)
  const [resizingId, setResizingId] = useState<string | null>(null)
  const [resizeEndIdx, setResizeEndIdx] = useState<number | null>(null)
  const [colorPickerId, setColorPickerId] = useState<string | null>(null)
  const quickInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineInnerRef = useRef<HTMLDivElement>(null)
  const resizingRef = useRef<{ id: string; si: number; horaAgenda: string } | null>(null)

  const startResize = (e: React.MouseEvent, id: string, si: number, horaAgenda: string) => {
    e.preventDefault()
    e.stopPropagation()
    resizingRef.current = { id, si, horaAgenda }
    setResizingId(id)
    setResizeEndIdx(si)

    const getColIdx = (clientX: number) => {
      if (!timelineInnerRef.current) return si
      const rect = timelineInnerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const colWidth = rect.width / HORA_SLOTS.length
      return Math.min(Math.max(si, Math.floor(x / colWidth)), HORA_SLOTS.length - 1)
    }

    const onMove = (ev: MouseEvent) => setResizeEndIdx(getColIdx(ev.clientX))

    const onUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      const idx = getColIdx(ev.clientX)
      const r = resizingRef.current
      if (r && idx > r.si) {
        updateTarefa(r.id, { horaAgenda: r.horaAgenda, horaFim: HORA_SLOTS[idx].hora })
      } else if (r && idx === r.si) {
        // arrastou para a mesma coluna — remove horaFim (vira card normal)
        updateTarefa(r.id, { horaFim: undefined })
      }
      resizingRef.current = null
      setResizingId(null)
      setResizeEndIdx(null)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleDragStart = (e: React.DragEvent, tarefaId: string) => {
    setDraggedId(tarefaId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, hora: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverHora(hora)
  }

  const handleDrop = (e: React.DragEvent, hora: string) => {
    e.preventDefault()
    if (draggedId) {
      const t = Object.values(slots).flat().find(x => x.id === draggedId)
      if (t && t.horaAgenda && t.horaFim) {
        // Preserva a duração da tarefa spanning ao mover
        const si = HORA_SLOTS.findIndex(s => s.hora === t.horaAgenda)
        const ei = HORA_SLOTS.findIndex(s => s.hora === t.horaFim)
        const newSi = HORA_SLOTS.findIndex(s => s.hora === hora)
        const duration = ei - si
        const newEi = Math.min(newSi + duration, HORA_SLOTS.length - 1)
        updateTarefa(draggedId, { horaAgenda: hora, horaFim: HORA_SLOTS[newEi].hora })
      } else {
        updateTarefa(draggedId, { horaAgenda: hora })
      }
      toast.success(`Tarefa movida para ${hora}`)
    }
    setDraggedId(null)
    setDragOverHora(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverHora(null)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isToday = selectedDate.toDateString() === new Date().toDateString()

  const now = new Date()
  const horaAtual = isToday ? `${String(now.getHours()).padStart(2, '0')}:00` : ''

  const slots = distribuirTarefasNosSlots(tarefas)

  const spanningTasks = Object.values(slots).flat()
    .filter(isSpanningTask)
    .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i)

  // Sincroniza slotOrders quando novos slots chegam (só adiciona IDs ausentes, preserva ordem customizada)
  useEffect(() => {
    setSlotOrders(prev => {
      const next: Record<string, string[]> = {}
      Object.entries(slots).forEach(([hora, ts]) => {
        const ids = ts.map(t => t.id)
        const existing = prev[hora] || []
        const kept = existing.filter(id => ids.includes(id))
        const added = ids.filter(id => !kept.includes(id))
        next[hora] = [...kept, ...added]
      })
      return next
    })
  }, [tarefas])

  const moveInSlot = (hora: string, idx: number, dir: -1 | 1) => {
    setSlotOrders(prev => {
      const order = [...(prev[hora] || [])]
      const target = idx + dir
      if (target < 0 || target >= order.length) return prev
      ;[order[idx], order[target]] = [order[target], order[idx]]
      return { ...prev, [hora]: order }
    })
  }

  const pendentes = tarefas.filter(t => t.status !== 'concluido')
  const concluidas = tarefas.filter(t => t.status === 'concluido')
  const criticas = tarefas.filter(t => t.nivelPrioridade === 'critica' && t.status !== 'concluido')

  const nomeDia = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })
  const dataFormatada = selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const navegarDia = (delta: number) => {
    setSelectedDate(d => {
      const nova = new Date(d)
      nova.setDate(nova.getDate() + delta)
      return nova
    })
  }

  const handleQuickTask = () => {
    const titulo = quickTask.trim()
    if (!titulo) return
    const prazoISO = selectedDate.toISOString().split('T')[0]
    addTarefa({
      titulo,
      descricao: '',
      status: 'a-fazer',
      prioridade: 'media',
      prazo: prazoISO,
      responsavel: '',
      projetoId: projetos[0]?.id || '',
      time,
      tags: [],
      checklist: [],
      comentarios: [],
    })
    setQuickTask('')
    toast.success('Tarefa adicionada!')
    quickInputRef.current?.focus()
  }

  const content = (
    <div ref={containerRef} className={cn('flex flex-col gap-4', isFullscreen && 'h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 p-4')}>

      {/* ── CABEÇALHO COMPACTO (full width) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex flex-col gap-3">
        {/* Linha superior: data + nav + stats + botão */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Navegação de dia */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navegarDia(-1)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
                <CalendarDays size={14} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize flex items-center gap-1.5">
                  {nomeDia}
                  {isToday && <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-full">Hoje</span>}
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{dataFormatada}</p>
              </div>
            </div>
            <button
              onClick={() => navegarDia(1)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
              >
                Hoje
              </button>
            )}
          </div>

          {/* Progresso */}
          <div className="flex-1 min-w-[140px] max-w-xs">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Progresso</span>
              <span>{tarefas.length > 0 ? Math.round((concluidas.length / tarefas.length) * 100) : 0}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${tarefas.length > 0 ? (concluidas.length / tarefas.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs ml-auto">
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <Timer size={12} /> {pendentes.length} pendentes
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={12} /> {concluidas.length} concluídas
            </span>
            {criticas.length > 0 && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                <Flame size={12} /> {criticas.length} crítica{criticas.length > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={onAddTask}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
            >
              <Plus size={12} /> Nova
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title={isFullscreen ? 'Sair do tela cheia' : 'Tela cheia'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        {/* Campo de lançamento rápido */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={quickInputRef}
              type="text"
              value={quickTask}
              onChange={e => setQuickTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleQuickTask()}
              placeholder="Lançar tarefa rápida... (Enter para adicionar)"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
          </div>
          <button
            onClick={handleQuickTask}
            disabled={!quickTask.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors flex-shrink-0"
          >
            <Send size={12} /> Adicionar
          </button>
        </div>
      </div>

      {/* Timeline horizontal — largura total */}
      <div className={cn('bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto', isFullscreen && 'flex-1 min-h-0 flex flex-col')}>
        <div ref={timelineInnerRef} className={cn('min-w-[720px]', isFullscreen && 'flex flex-col flex-1 min-h-0')}>

          {/* Linha de cabeçalhos das horas */}
          <div className="flex divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
            {HORA_SLOTS.map(({ hora, period }) => {
              const isPast = hora < horaAtual
              const isCurrent = hora === horaAtual
              const isLunch = period === 'lunch'
              return (
                <div key={hora} className={cn(
                  'flex-1 min-w-[90px] px-2 py-2 flex items-center justify-center gap-1',
                  isCurrent && 'bg-indigo-50/60 dark:bg-indigo-950/25',
                  isLunch && 'bg-slate-50/80 dark:bg-slate-800/30',
                  isPast && !isCurrent && 'opacity-50',
                )}>
                  <span className={cn(
                    'text-[11px] font-mono font-bold',
                    isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                  )}>
                    {hora}
                  </span>
                  {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                </div>
              )
            })}
          </div>

          {/* Linha de tarefas com intervalo (grid — sem sobreposição) */}
          {spanningTasks.length > 0 && (
            <div
              className="border-b border-slate-100 dark:border-slate-800"
              style={{ display: 'grid', gridTemplateColumns: `repeat(${HORA_SLOTS.length}, minmax(90px, 1fr))` }}
              onDragOver={e => {
                e.preventDefault()
                if (!timelineInnerRef.current) return
                const rect = timelineInnerRef.current.getBoundingClientRect()
                const x = e.clientX - rect.left
                const colWidth = rect.width / HORA_SLOTS.length
                const idx = Math.min(Math.max(0, Math.floor(x / colWidth)), HORA_SLOTS.length - 1)
                setDragOverHora(HORA_SLOTS[idx].hora)
              }}
              onDragLeave={() => setDragOverHora(null)}
              onDrop={e => {
                if (!timelineInnerRef.current) return
                const rect = timelineInnerRef.current.getBoundingClientRect()
                const x = e.clientX - rect.left
                const colWidth = rect.width / HORA_SLOTS.length
                const idx = Math.min(Math.max(0, Math.floor(x / colWidth)), HORA_SLOTS.length - 1)
                handleDrop(e, HORA_SLOTS[idx].hora)
              }}
            >
              {spanningTasks.map(t => {
                const si = HORA_SLOTS.findIndex(s => s.hora === t.horaAgenda)
                const ei = HORA_SLOTS.findIndex(s => s.hora === t.horaFim)
                if (si === -1 || ei === -1) return null
                const isResizing = resizingId === t.id
                const liveEi = isResizing && resizeEndIdx !== null ? resizeEndIdx : ei
                const overdue = isOverdue(t.prazo)
                const nextStatus = STATUS_NEXT[t.status]
                return (
                  <div key={`span-${t.id}`} style={{ gridColumn: `${si + 1} / ${liveEi + 2}` }} className="p-1.5 min-h-[80px] flex flex-col">
                    <div
                      draggable={!isResizing}
                      onDragStart={e => handleDragStart(e, t.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => !isResizing && onCardClick(t)}
                      style={t.cor ? { borderLeftColor: t.cor, backgroundColor: t.cor + '18' } : undefined}
                      className={cn(
                        'relative p-2 rounded-lg border-l-[3px] border border-slate-300 dark:border-slate-600 transition-all hover:shadow-md select-none group flex items-center gap-2 flex-1',
                        isResizing ? 'cursor-col-resize ring-2 ring-indigo-400' : 'cursor-grab active:cursor-grabbing',
                        !t.cor && PRIORITY_BORDER[t.nivelPrioridade],
                        draggedId === t.id && 'opacity-40 scale-95',
                        !t.cor && (overdue ? 'bg-red-50 dark:bg-red-950/50' : t.status === 'em-andamento' ? 'bg-blue-50 dark:bg-blue-950/50' : 'bg-white dark:bg-slate-800')
                      )}
                    >
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          if (nextStatus) {
                            moveTarefa(t.id, nextStatus)
                            toast.success(nextStatus === 'concluido' ? '✅ Tarefa concluída!' : '▶ Em andamento')
                          }
                        }}
                        className={cn(
                          'flex-shrink-0 transition-colors',
                          t.status === 'concluido' ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-400 hover:text-indigo-500'
                        )}
                      >
                        {t.status === 'concluido' ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                      </button>
                      <p className={cn(
                        'text-[10px] font-semibold leading-tight flex-1 min-w-0 truncate',
                        t.status === 'concluido' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
                      )}>
                        {t.titulo}
                      </p>
                      {/* Botão de cor — antes do prazo, longe do handle */}
                      <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={e => { e.stopPropagation(); setColorPickerId(colorPickerId === t.id ? null : t.id) }}
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                          style={{ backgroundColor: t.cor || '#94a3b8' }}
                          title="Mudar cor"
                        />
                        {colorPickerId === t.id && (
                          <div className="absolute left-0 top-5 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl p-2 flex flex-wrap gap-1.5 w-[132px]">
                            {AGENDA_COLORS.map(c => (
                              <button
                                key={c.label}
                                title={c.label}
                                onClick={() => { updateTarefa(t.id, { cor: c.value ?? undefined }); setColorPickerId(null) }}
                                className={cn('w-6 h-6 rounded-full border-2 transition-transform hover:scale-110', t.cor === c.value ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent')}
                                style={{ backgroundColor: c.value ?? '#e2e8f0' }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className={cn('text-[9px] font-medium flex-shrink-0', overdue ? 'text-red-400' : 'text-slate-500 dark:text-slate-400')}>
                        {prazoLabel(t.prazo, t.status)}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold flex-shrink-0 border border-emerald-200 dark:border-emerald-700 mr-5">
                        {t.horaAgenda} → {isResizing && resizeEndIdx !== null ? HORA_SLOTS[resizeEndIdx]?.hora : t.horaFim}
                      </span>
                      {/* Handle de resize — borda direita */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-r-lg hover:bg-white/20"
                        onMouseDown={e => startResize(e, t.id, si, t.horaAgenda!)}
                      >
                        <div className="w-0.5 h-5 rounded-full bg-slate-400 dark:bg-slate-400" />
                        <div className="w-0.5 h-5 rounded-full bg-slate-400 dark:bg-slate-400 ml-0.5" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Colunas normais — excluem spanning tasks */}
          <div className={cn('flex divide-x divide-slate-100 dark:divide-slate-800', isFullscreen && 'flex-1 min-h-0')}>
            {HORA_SLOTS.map(({ hora, period }) => {
              const slotIds = slotOrders[hora] || (slots[hora] || []).map(t => t.id)
              const tarefasSlot = slotIds
                .map(id => (slots[hora] || []).find(t => t.id === id))
                .filter(Boolean)
                .filter(t => !isSpanningTask(t!)) as Tarefa[]
              const isPast = hora < horaAtual
              const isCurrent = hora === horaAtual
              const isLunch = period === 'lunch'

              return (
                <div
                  key={hora}
                  className={cn(
                    'flex-1 min-w-[90px] transition-colors',
                    isFullscreen && 'overflow-y-auto',
                    isCurrent && 'bg-indigo-50/60 dark:bg-indigo-950/25',
                    isLunch && 'bg-slate-50/80 dark:bg-slate-800/30',
                    isPast && !isCurrent && 'opacity-50',
                    dragOverHora === hora && !isLunch && 'bg-indigo-100/70 dark:bg-indigo-900/30 ring-2 ring-inset ring-indigo-400'
                  )}
                  onDragOver={isLunch ? undefined : e => handleDragOver(e, hora)}
                  onDragLeave={() => setDragOverHora(null)}
                  onDrop={isLunch ? undefined : e => handleDrop(e, hora)}
                >
                  <div className={cn('p-1.5 space-y-1.5', isFullscreen ? 'h-full' : 'min-h-[80px]')}>
                    {isLunch ? (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-3">Intervalo</p>
                    ) : tarefasSlot.length === 0 ? (
                      !isPast && <p className="text-[10px] text-slate-300 dark:text-slate-700 italic text-center py-3">Livre</p>
                    ) : (
                      tarefasSlot.map((t, idx) => {
                        const overdue = isOverdue(t.prazo)
                        const nextStatus = STATUS_NEXT[t.status]
                        return (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={e => handleDragStart(e, t.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => onCardClick(t)}
                            style={t.cor ? { borderLeftColor: t.cor, backgroundColor: t.cor + '18' } : undefined}
                            className={cn(
                              'relative p-1.5 rounded-lg border-l-[3px] border border-slate-300 dark:border-slate-600 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm select-none group',
                              !t.cor && PRIORITY_BORDER[t.nivelPrioridade],
                              draggedId === t.id && 'opacity-40 scale-95',
                              !t.cor && (overdue
                                ? 'bg-red-50 dark:bg-red-950/50'
                                : t.status === 'em-andamento'
                                  ? 'bg-blue-50 dark:bg-blue-950/50'
                                  : 'bg-white dark:bg-slate-800')
                            )}
                          >
                            <div className="flex items-start gap-1 mb-1">
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  if (nextStatus) {
                                    moveTarefa(t.id, nextStatus)
                                    toast.success(nextStatus === 'concluido' ? '✅ Tarefa concluída!' : '▶ Em andamento')
                                  }
                                }}
                                className={cn(
                                  'flex-shrink-0 mt-0.5 transition-colors',
                                  t.status === 'concluido' ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-400 hover:text-indigo-500'
                                )}
                              >
                                {t.status === 'concluido' ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                              </button>
                              <p className={cn(
                                'text-[10px] font-semibold leading-tight line-clamp-2 flex-1',
                                t.status === 'concluido' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
                              )}>
                                {t.titulo}
                              </p>
                              {/* Botões de ordenação */}
                              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={e => { e.stopPropagation(); moveInSlot(hora, idx, -1) }}
                                  disabled={idx === 0}
                                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  <ChevronUp size={9} />
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); moveInSlot(hora, idx, 1) }}
                                  disabled={idx === tarefasSlot.length - 1}
                                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  <ChevronDown size={9} />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 pr-4">
                              {/* Botão de cor — esquerda, longe do handle de resize */}
                              <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={e => { e.stopPropagation(); setColorPickerId(colorPickerId === t.id ? null : t.id) }}
                                  className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                  style={{ backgroundColor: t.cor || '#94a3b8' }}
                                  title="Mudar cor"
                                />
                                {colorPickerId === t.id && (
                                  <div className="absolute left-0 bottom-5 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl p-2 flex flex-wrap gap-1.5 w-[132px]">
                                    {AGENDA_COLORS.map(c => (
                                      <button
                                        key={c.label}
                                        title={c.label}
                                        onClick={() => { updateTarefa(t.id, { cor: c.value ?? undefined }); setColorPickerId(null) }}
                                        className={cn('w-6 h-6 rounded-full border-2 transition-transform hover:scale-110', t.cor === c.value ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent')}
                                        style={{ backgroundColor: c.value ?? '#e2e8f0' }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span className={cn(
                                'text-[9px] font-medium flex-1',
                                overdue ? 'text-red-400 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
                              )}>
                                {prazoLabel(t.prazo, t.status)}
                              </span>
                              {editingHoraId === t.id ? (
                                <select
                                  autoFocus
                                  value={t.horaAgenda || ''}
                                  onChange={e => {
                                    updateTarefa(t.id, { horaAgenda: e.target.value || undefined })
                                    setEditingHoraId(null)
                                  }}
                                  onBlur={() => setEditingHoraId(null)}
                                  onClick={e => e.stopPropagation()}
                                  className="text-[9px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                >
                                  <option value="">Auto</option>
                                  {HORA_SLOTS.map(s => <option key={s.hora} value={s.hora}>{s.hora}</option>)}
                                </select>
                              ) : (
                                <button
                                  onClick={e => { e.stopPropagation(); setEditingHoraId(t.id) }}
                                  className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                >
                                  {t.horaAgenda || 'auto'}
                                </button>
                              )}
                            </div>
                            {/* Handle de resize — arrastar para definir horaFim */}
                            <div
                              className="absolute right-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-r-lg hover:bg-indigo-500/10"
                              onMouseDown={e => {
                                e.stopPropagation()
                                const slotHora = t.horaAgenda || hora
                                const si = HORA_SLOTS.findIndex(s => s.hora === slotHora)
                                if (si !== -1) startResize(e, t.id, si, slotHora)
                              }}
                            >
                              <div className="w-0.5 h-4 rounded-full bg-indigo-400 dark:bg-indigo-500" />
                              <div className="w-0.5 h-4 rounded-full bg-indigo-400 dark:bg-indigo-500 ml-0.5" />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )

  return content
}

const PRIORITY_BORDER: Record<NivelPrioridade, string> = {
  critica: 'border-l-red-500',
  alta:    'border-l-orange-500',
  media:   'border-l-yellow-500',
  baixa:   'border-l-slate-300 dark:border-l-slate-600',
}

const PRIORITY_ROW_BG: Record<NivelPrioridade, string> = {
  critica: 'bg-red-50/40 dark:bg-red-950/10',
  alta:    'bg-orange-50/40 dark:bg-orange-950/10',
  media:   'bg-yellow-50/40 dark:bg-yellow-950/10',
  baixa:   '',
}

function TaskListGroup({
  label, dot, tarefas, projetos, onCardClick, emptyText, priorityFilter
}: {
  label: string
  dot: string
  tarefas: Tarefa[]
  projetos: any[]
  onCardClick: (t: Tarefa) => void
  emptyText: string
  priorityFilter: NivelPrioridade | null
}) {
  const [collapsed, setCollapsed] = useState(label === 'Concluídas')

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dot)} />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
            {tarefas.length}
          </span>
        </div>
        <ChevronRight size={14} className={cn(
          'text-slate-400 transition-transform duration-200',
          !collapsed && 'rotate-90'
        )} />
      </button>

      {!collapsed && (
        <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/70">
          {tarefas.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-4 px-4 italic">{emptyText}</p>
          ) : (
            tarefas.map(t => {
              const projeto = projetos.find((p: any) => p.id === t.projetoId)
              const overdue = isOverdue(t.prazo) && t.status !== 'concluido'
              const borderColor = PRIORITY_BORDER[t.nivelPrioridade]
              const rowBg = priorityFilter ? PRIORITY_ROW_BG[t.nivelPrioridade] : ''
              return (
                <div
                  key={t.id}
                  onClick={() => onCardClick(t)}
                  className={cn(
                    'flex items-start gap-3 pl-3 pr-4 py-3 cursor-pointer transition-colors',
                    'border-l-4',
                    borderColor,
                    rowBg,
                    overdue ? 'hover:bg-red-50/50 dark:hover:bg-red-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  )}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {t.status === 'concluido'
                      ? <CheckCircle2 size={14} className="text-emerald-500" />
                      : <Circle size={14} className="text-slate-300 dark:text-slate-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs font-medium leading-snug',
                      t.status === 'concluido'
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-100'
                    )}>
                      {t.titulo}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {projeto && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                          <Tag size={9} /> {projeto.nome}
                        </span>
                      )}
                      {t.responsavel && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{t.responsavel.split(' ')[0]}</span>
                      )}
                      {t.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={cn(
                      'text-[10px] font-medium',
                      overdue ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'
                    )}>
                      {prazoLabel(t.prazo, t.status)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
