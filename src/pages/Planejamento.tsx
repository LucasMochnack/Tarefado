import { useState, useMemo } from 'react'
import { Plus, TrendingUp, ShoppingCart, Zap, ChevronLeft, ChevronRight, Filter, Check, X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Time, NivelPrioridade, Tarefa } from '@/types'
import { TaskDetailsDrawer } from '@/components/tasks/TaskDetailsDrawer'
import { cn } from '@/lib/utils'
import { parseISO, format, addDays, isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

// ── Feriados nacionais brasileiros ─────────────────────────────────────────
function getEaster(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}
function getFeriadosBrasileiros(year: number): Date[] {
  const easter = getEaster(year)
  const d = (n: number) => addDays(easter, n)
  return [
    new Date(year, 0, 1), d(-48), d(-47), d(-2),
    new Date(year, 3, 21), new Date(year, 4, 1), d(60),
    new Date(year, 8, 7), new Date(year, 9, 12),
    new Date(year, 10, 2), new Date(year, 10, 15), new Date(year, 10, 20),
    new Date(year, 11, 25),
  ]
}
function isDiaUtil(date: Date, feriados: Date[]): boolean {
  const dow = date.getDay()
  if (dow === 0 || dow === 6) return false
  return !feriados.some(f => isSameDay(f, date))
}

// ── Config ─────────────────────────────────────────────────────────────────
const TIMES_CONFIG: { slug: Time; label: string; icon: any; chip: string }[] = [
  { slug: 'alta-renda', label: 'Alta Renda', icon: TrendingUp, chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  { slug: 'varejo',     label: 'Varejo',     icon: ShoppingCart, chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  { slug: 'on-demand',  label: 'On Demand',  icon: Zap,          chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
]
const PRIORIDADES: { nivel: NivelPrioridade; label: string; cell: string; badge: string }[] = [
  { nivel: 'critica', label: 'Crítica', cell: 'bg-emerald-500 dark:bg-emerald-400', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
  { nivel: 'alta',    label: 'Alta',    cell: 'bg-emerald-500 dark:bg-emerald-400', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
  { nivel: 'media',   label: 'Média',   cell: 'bg-emerald-500 dark:bg-emerald-400', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' },
  { nivel: 'baixa',   label: 'Baixa',   cell: 'bg-emerald-500 dark:bg-emerald-400', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
]
const HORAS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']

const W = { tarefa: 160, time: 80, prior: 60, hora: 58, horaFim: 58, inicio: 58, fim: 58 }
const L = {
  tarefa:  0,
  time:    W.tarefa,
  prior:   W.tarefa + W.time,
  hora:    W.tarefa + W.time + W.prior,
  horaFim: W.tarefa + W.time + W.prior + W.hora,
  inicio:  W.tarefa + W.time + W.prior + W.hora + W.horaFim,
  fim:     W.tarefa + W.time + W.prior + W.hora + W.horaFim + W.inicio,
}

const EMPTY_ROW = {
  titulo: '', time: 'alta-renda' as Time, prioridade: 'media' as NivelPrioridade,
  hora: '', horaFim: '', inicio: '', fim: '', diasSelecionados: [] as string[],
}

// ── Component ───────────────────────────────────────────────────────────────
export function Planejamento() {
  const { tarefas, addTarefa, updateTarefa, projetos } = useStore()
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null)
  const [selectedTimes, setSelectedTimes]   = useState<Time[]>(['alta-renda', 'varejo', 'on-demand'])
  const [selectedPrior, setSelectedPrior]   = useState<NivelPrioridade[]>([])
  const [selectedHora, setSelectedHora]     = useState('')
  const [numDays, setNumDays]               = useState(14)
  const [modoSemana, setModoSemana]         = useState(false)
  const [startDate, setStartDate]           = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d })
  const [newRow, setNewRow]                 = useState(EMPTY_ROW)
  const [rangePending, setRangePending]     = useState<string | null>(null)
  const [editingField, setEditingField]     = useState<string | null>(null)
  const [editingCell, setEditingCell]       = useState<{ rowId: string; field: string } | null>(null)
  const [editValue, setEditValue]           = useState('')

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])

  const irParaSemanaAtual = () => {
    const d = new Date(); d.setHours(0,0,0,0)
    const dow = d.getDay()
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
    setStartDate(d); setNumDays(5); setModoSemana(true)
  }

  const days = useMemo(() => {
    const allFeriados = [
      ...getFeriadosBrasileiros(startDate.getFullYear()),
      ...getFeriadosBrasileiros(startDate.getFullYear() + 1),
    ]
    const result: Date[] = []
    let cur = new Date(startDate)
    if (modoSemana) {
      for (let i = 0; i < 5; i++) {
        const d = addDays(startDate, i)
        if (isDiaUtil(d, allFeriados)) result.push(d)
      }
    } else {
      while (result.length < numDays) {
        if (isDiaUtil(cur, allFeriados)) result.push(new Date(cur))
        cur = addDays(cur, 1)
      }
    }
    return result
  }, [startDate, numDays, modoSemana])

  const navegarSemana = (dir: -1 | 1) => {
    setStartDate(d => {
      const next = addDays(d, dir * 7)
      if (modoSemana) {
        const dow = next.getDay()
        next.setDate(next.getDate() - (dow === 0 ? 6 : dow - 1))
      }
      return next
    })
  }

  const toggleTime  = (slug: Time) => setSelectedTimes(p => p.includes(slug) ? p.filter(t => t !== slug) : [...p, slug])
  const togglePrior = (n: NivelPrioridade) => setSelectedPrior(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n])

  const taskStart = (t: Tarefa) => t.dataInicio || t.criadoEm

  const taskSpansDay = (t: Tarefa, day: Date) => {
    try { return isWithinInterval(day, { start: startOfDay(parseISO(taskStart(t))), end: endOfDay(parseISO(t.prazo)) }) }
    catch { return false }
  }

  const filtered = tarefas
    .filter(t => {
      if (t.status === 'concluido') return false
      if (!selectedTimes.includes(t.time as Time)) return false
      if (selectedPrior.length && !selectedPrior.includes(t.nivelPrioridade)) return false
      if (selectedHora && t.horaAgenda && t.horaAgenda !== selectedHora) return false
      return true
    })
    .sort((a, b) => ({ critica: 0, alta: 1, media: 2, baixa: 3 }[a.nivelPrioridade] - { critica: 0, alta: 1, media: 2, baixa: 3 }[b.nivelPrioridade]))

  // ── Existing row inline edit ─────────────────────────────────────────────
  const startEdit = (rowId: string, field: string, value: string) => {
    setEditingCell({ rowId, field })
    setEditValue(value)
  }

  const commitEdit = (overrideValue?: string) => {
    if (!editingCell) return
    const { rowId, field } = editingCell
    const v = overrideValue !== undefined ? overrideValue : editValue
    if (field === 'titulo')  updateTarefa(rowId, { titulo: v })
    if (field === 'time')    updateTarefa(rowId, { time: v as Time })
    if (field === 'prior')   updateTarefa(rowId, { prioridade: v as NivelPrioridade })
    if (field === 'hora')    updateTarefa(rowId, { horaAgenda: v || undefined })
    if (field === 'horaFim') updateTarefa(rowId, { horaFim: v || undefined })
    if (field === 'inicio')  updateTarefa(rowId, { dataInicio: v ? new Date(v + 'T12:00:00').toISOString() : undefined })
    if (field === 'fim')     updateTarefa(rowId, { prazo: v ? new Date(v + 'T12:00:00').toISOString() : new Date().toISOString() })
    setEditingCell(null)
  }

  const cancelEdit = () => setEditingCell(null)

  const cellEditProps = (rowId: string, field: string, value: string) => ({
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); startEdit(rowId, field, value) },
  })

  const inputEditProps = {
    onBlur: () => commitEdit(),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() },
  }

  // ── Click dia em tarefa existente ──────────────────────────────────────
  const clickDiaTarefa = (t: Tarefa, day: Date) => {
    const iso = format(day, 'yyyy-MM-dd')
    const start = startOfDay(parseISO(taskStart(t)))
    const end   = endOfDay(parseISO(t.prazo))
    if (day < start) {
      updateTarefa(t.id, { dataInicio: new Date(iso + 'T12:00:00').toISOString() })
    } else if (day > end) {
      updateTarefa(t.id, { prazo: new Date(iso + 'T12:00:00').toISOString() })
    } else {
      // dentro do range: clicar na extremidade ajusta, no meio não faz nada
      const diffStart = Math.abs(day.getTime() - start.getTime())
      const diffEnd   = Math.abs(day.getTime() - end.getTime())
      if (diffStart <= diffEnd) {
        updateTarefa(t.id, { dataInicio: new Date(iso + 'T12:00:00').toISOString() })
      } else {
        updateTarefa(t.id, { prazo: new Date(iso + 'T12:00:00').toISOString() })
      }
    }
  }

  // ── Inline row handlers ─────────────────────────────────────────────────
  const toggleDia = (iso: string) => {
    if (!rangePending) {
      // Primeiro clique: define início do intervalo
      setRangePending(iso)
      setNewRow(prev => ({ ...prev, diasSelecionados: [iso], inicio: iso, fim: iso }))
    } else {
      // Segundo clique: completa o intervalo
      const [a, b] = [rangePending, iso].sort()
      const diasNoRange = days
        .map(d => format(d, 'yyyy-MM-dd'))
        .filter(d => d >= a && d <= b)
      setNewRow(prev => ({ ...prev, diasSelecionados: diasNoRange, inicio: a, fim: b }))
      setRangePending(null)
    }
  }

  const handleSave = () => {
    if (!newRow.titulo.trim()) { toast.error('Digite o nome da tarefa'); return }
    const prazoISO = newRow.fim
      ? new Date(newRow.fim + 'T12:00:00').toISOString()
      : new Date().toISOString()
    const dataInicioISO = newRow.inicio
      ? new Date(newRow.inicio + 'T12:00:00').toISOString()
      : undefined
    addTarefa({
      titulo: newRow.titulo.trim(),
      descricao: '',
      status: 'a-fazer',
      prioridade: newRow.prioridade,
      prazo: prazoISO,
      dataInicio: dataInicioISO,
      responsavel: '',
      projetoId: projetos[0]?.id || '',
      time: newRow.time,
      tags: [],
      horaAgenda: newRow.hora || undefined,
      horaFim: newRow.horaFim || undefined,
      checklist: [],
      comentarios: [],
    })
    toast.success('Tarefa adicionada!')
    setNewRow(EMPTY_ROW)
  }

  // ── Shared style helpers ────────────────────────────────────────────────
  const thFixed = (extra = '') =>
    `sticky z-30 bg-slate-100 dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 py-2.5 px-2 text-left ${extra}`
  const tdFixed = (isEven: boolean) =>
    cn('sticky z-10 border-b border-r border-slate-100 dark:border-slate-800 px-2 py-2',
      isEven ? 'bg-white dark:bg-slate-900 group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-950/20'
             : 'bg-slate-50/60 dark:bg-slate-900/60 group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-950/20')
  const tdNew = 'sticky z-10 border-b border-r border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 px-1.5 py-1.5'
  const selectCls = 'w-full text-[10px] bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer'

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Planejamento</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Cronograma de atendimentos e campanhas — dias úteis</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Times:</span>
            {TIMES_CONFIG.map(t => (
              <button key={t.slug} onClick={() => toggleTime(t.slug)}
                className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                  selectedTimes.includes(t.slug) ? t.chip + ' border-transparent' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300')}>
                <t.icon size={11} /> {t.label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Prioridade:</span>
            {PRIORIDADES.map(p => (
              <button key={p.nivel} onClick={() => togglePrior(p.nivel)}
                className={cn('px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                  selectedPrior.includes(p.nivel) ? p.badge + ' border-transparent' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300')}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Hora:</span>
            <select value={selectedHora} onChange={e => setSelectedHora(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
              <option value="">Todas</option>
              {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Dias úteis:</span>
            <button onClick={irParaSemanaAtual}
              className={cn('px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                modoSemana ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}>
              Semana
            </button>
            {[10, 15, 20, 30].map(n => (
              <button key={n} onClick={() => { setNumDays(n); setModoSemana(false) }}
                className={cn('px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                  !modoSemana && numDays === n ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}>
                {n}d
              </button>
            ))}
          </div>
          {(selectedPrior.length > 0 || selectedHora !== '' || selectedTimes.length < 3) && (
            <button
              onClick={() => { setSelectedTimes(['alta-renda', 'varejo', 'on-demand']); setSelectedPrior([]); setSelectedHora('') }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors ml-auto">
              <X size={10} /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Gantt ── */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-20">
            <tr>
              <th style={{ left: L.tarefa, width: W.tarefa, minWidth: W.tarefa }} className={thFixed()}>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tarefa</span>
              </th>
              <th style={{ left: L.time, width: W.time, minWidth: W.time }} className={thFixed()}>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Time</span>
              </th>
              <th style={{ left: L.prior, width: W.prior, minWidth: W.prior }} className={thFixed('text-center')}>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Prior.</span>
              </th>
              <th style={{ left: L.hora, width: W.hora, minWidth: W.hora }} className={thFixed('text-center')}>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">H. Início</span>
              </th>
              <th style={{ left: L.horaFim, width: W.horaFim, minWidth: W.horaFim }} className={thFixed('text-center')}>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">H. Fim</span>
              </th>
              <th style={{ left: L.inicio, width: W.inicio, minWidth: W.inicio }} className={thFixed('text-center')}>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Início</span>
              </th>
              <th style={{ left: L.fim, width: W.fim, minWidth: W.fim }} className={thFixed('text-center')}>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Fim</span>
              </th>
              <th className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-0.5 py-2.5 w-6">
                <button onClick={() => navegarSemana(-1)} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                  <ChevronLeft size={13} />
                </button>
              </th>
              {days.map((day, i) => {
                const isToday = isSameDay(day, today)
                return (
                  <th key={i} className={cn(
                    'border-b border-r border-slate-200 dark:border-slate-700 px-0 py-2 text-center w-[38px] min-w-[38px]',
                    isToday ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-slate-100 dark:bg-slate-800'
                  )}>
                    <div className={cn('text-[10px] font-bold', isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400')}>
                      {format(day, 'd')}
                    </div>
                    <div className={cn('text-[9px]', isToday ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500')}>
                      {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                    </div>
                  </th>
                )
              })}
              <th className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-0.5 py-2.5 w-6">
                <button onClick={() => navegarSemana(1)} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                  <ChevronRight size={13} />
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {/* ── Task rows ── */}
            {filtered.map((t, rowIdx) => {
              const timeCfg  = TIMES_CONFIG.find(tc => tc.slug === t.time)
              const priorCfg = PRIORIDADES.find(p => p.nivel === t.nivelPrioridade)!
              const isEven   = rowIdx % 2 === 0
              const isRow    = (f: string) => editingCell?.rowId === t.id && editingCell?.field === f
              const editCls  = 'cursor-pointer hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 group/cell'
              return (
                <tr key={t.id}
                  className={cn('group transition-colors',
                    isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-900/60')}>

                  {/* Tarefa */}
                  <td style={{ left: L.tarefa, width: W.tarefa, minWidth: W.tarefa }}
                    className={cn(tdFixed(isEven), editCls)}
                    {...cellEditProps(t.id, 'titulo', t.titulo)}>
                    {isRow('titulo') ? (
                      <input autoFocus value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        {...inputEditProps}
                        className="w-full text-[11px] bg-transparent focus:outline-none text-slate-800 dark:text-slate-100 font-medium" />
                    ) : (
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[11px] font-medium text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight flex-1">{t.titulo}</p>
                        <button onMouseDown={e => { e.stopPropagation(); setSelectedTarefa(t) }}
                          className="opacity-0 group-hover/cell:opacity-60 hover:!opacity-100 text-slate-400 hover:text-indigo-500 transition-opacity flex-shrink-0 p-0.5 rounded">
                          <Plus size={9} className="rotate-45" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Time */}
                  <td style={{ left: L.time, width: W.time, minWidth: W.time }}
                    className={cn(tdFixed(isEven), editCls)}
                    {...cellEditProps(t.id, 'time', t.time)}>
                    {isRow('time') ? (
                      <select autoFocus value={editValue}
                        onChange={e => commitEdit(e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        className="w-full text-[10px] bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer">
                        {TIMES_CONFIG.map(tc => <option key={tc.slug} value={tc.slug}>{tc.label}</option>)}
                      </select>
                    ) : timeCfg ? (
                      <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium whitespace-nowrap', timeCfg.chip)}>
                        <timeCfg.icon size={8} /> {timeCfg.label}
                      </span>
                    ) : <span className="text-[10px] text-slate-400">{t.time}</span>}
                  </td>

                  {/* Prioridade */}
                  <td style={{ left: L.prior, width: W.prior, minWidth: W.prior }}
                    className={cn(tdFixed(isEven), editCls, 'text-center')}
                    {...cellEditProps(t.id, 'prior', t.prioridade)}>
                    {isRow('prior') ? (
                      <select autoFocus value={editValue}
                        onChange={e => commitEdit(e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        className="w-full text-[10px] bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer">
                        {PRIORIDADES.map(p => <option key={p.nivel} value={p.nivel}>{p.label}</option>)}
                      </select>
                    ) : (
                      <span className={cn('inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold', priorCfg.badge)}>{priorCfg.label}</span>
                    )}
                  </td>

                  {/* Hora */}
                  <td style={{ left: L.hora, width: W.hora, minWidth: W.hora }}
                    className={cn(tdFixed(isEven), editCls, 'text-center')}
                    {...cellEditProps(t.id, 'hora', t.horaAgenda || '')}>
                    {isRow('hora') ? (
                      <select autoFocus value={editValue}
                        onChange={e => commitEdit(e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        className="w-full text-[10px] bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer font-mono">
                        <option value="">—</option>
                        {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    ) : (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{t.horaAgenda || '—'}</span>
                    )}
                  </td>

                  {/* Hora Fim */}
                  <td style={{ left: L.horaFim, width: W.horaFim, minWidth: W.horaFim }}
                    className={cn(tdFixed(isEven), editCls, 'text-center')}
                    {...cellEditProps(t.id, 'horaFim', t.horaFim || '')}>
                    {isRow('horaFim') ? (
                      <select autoFocus value={editValue}
                        onChange={e => commitEdit(e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        className="w-full text-[10px] bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer font-mono">
                        <option value="">—</option>
                        {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    ) : (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{t.horaFim || '—'}</span>
                    )}
                  </td>

                  {/* Início */}
                  <td style={{ left: L.inicio, width: W.inicio, minWidth: W.inicio }}
                    className={cn(tdFixed(isEven), editCls, 'text-center')}
                    {...cellEditProps(t.id, 'inicio', format(parseISO(taskStart(t)), 'yyyy-MM-dd'))}>
                    {isRow('inicio') ? (
                      <input autoFocus type="date" value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        {...inputEditProps}
                        className="w-full text-[10px] bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer font-mono" />
                    ) : (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{format(parseISO(taskStart(t)), 'dd/MM')}</span>
                    )}
                  </td>

                  {/* Fim */}
                  <td style={{ left: L.fim, width: W.fim, minWidth: W.fim }}
                    className={cn(tdFixed(isEven), editCls, 'text-center')}
                    {...cellEditProps(t.id, 'fim', format(parseISO(t.prazo), 'yyyy-MM-dd'))}>
                    {isRow('fim') ? (
                      <input autoFocus type="date" value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        {...inputEditProps}
                        className="w-full text-[10px] bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer font-mono" />
                    ) : (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{format(parseISO(t.prazo), 'dd/MM')}</span>
                    )}
                  </td>

                  <td className="border-b border-slate-100 dark:border-slate-800 w-6" />
                  {days.map((day, i) => {
                    const spans   = taskSpansDay(t, day)
                    const isStart = isSameDay(parseISO(taskStart(t)), day)
                    const isEnd   = isSameDay(parseISO(t.prazo), day)
                    const isToday = isSameDay(day, today)
                    return (
                      <td key={i}
                        onClick={e => { e.stopPropagation(); clickDiaTarefa(t, day) }}
                        className={cn(
                          'border-b border-r border-slate-100 dark:border-slate-800 p-0.5 w-[38px] min-w-[38px] cursor-pointer group/day',
                          isToday && !spans ? 'bg-indigo-50/40 dark:bg-indigo-950/10 hover:bg-indigo-100/60' : !spans && 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                        )}>
                        {spans
                          ? <div className={cn('h-5 w-full transition-opacity group-hover/day:opacity-80', priorCfg.cell, isStart && 'rounded-l-full', isEnd && 'rounded-r-full')} />
                          : <div className="h-5 w-full rounded-sm opacity-0 group-hover/day:opacity-20 bg-slate-400 dark:bg-slate-500 transition-opacity" />
                        }
                      </td>
                    )
                  })}
                  <td className="border-b border-slate-100 dark:border-slate-800 w-6" />
                </tr>
              )
            })}

            {/* ── Inline new task row ── */}
            <tr className="group">
              {/* Tarefa */}
              <td style={{ left: L.tarefa, width: W.tarefa, minWidth: W.tarefa }}
                className={cn(tdNew, 'border-t-2 border-t-emerald-400 dark:border-t-emerald-600')}>
                <div className="flex items-center gap-1.5">
                  <button onClick={handleSave}
                    className="w-5 h-5 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 transition-colors shadow-sm">
                    <Plus size={11} />
                  </button>
                  <input
                    type="text"
                    value={newRow.titulo}
                    onChange={e => setNewRow(p => ({ ...p, titulo: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="Nova tarefa..."
                    className="flex-1 min-w-0 text-[11px] bg-transparent focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </td>

              {/* Time */}
              {(() => {
                const cfg = TIMES_CONFIG.find(t => t.slug === newRow.time)!
                return (
                  <td style={{ left: L.time, width: W.time, minWidth: W.time }}
                    className={cn(tdNew, 'border-t-2 border-t-emerald-400 dark:border-t-emerald-600 cursor-pointer')}
                    onClick={() => editingField !== 'time' && setEditingField('time')}>
                    {editingField === 'time' ? (
                      <select autoFocus value={newRow.time}
                        onChange={e => { setNewRow(p => ({ ...p, time: e.target.value as Time })); setEditingField(null) }}
                        onBlur={() => setEditingField(null)}
                        className={selectCls}>
                        {TIMES_CONFIG.map(t => <option key={t.slug} value={t.slug}>{t.label}</option>)}
                      </select>
                    ) : (
                      <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium whitespace-nowrap', cfg.chip)}>
                        <cfg.icon size={8} /> {cfg.label}
                      </span>
                    )}
                  </td>
                )
              })()}

              {/* Prioridade */}
              {(() => {
                const cfg = PRIORIDADES.find(p => p.nivel === newRow.prioridade)!
                return (
                  <td style={{ left: L.prior, width: W.prior, minWidth: W.prior }}
                    className={cn(tdNew, 'border-t-2 border-t-emerald-400 dark:border-t-emerald-600 text-center cursor-pointer')}
                    onClick={() => editingField !== 'prior' && setEditingField('prior')}>
                    {editingField === 'prior' ? (
                      <select autoFocus value={newRow.prioridade}
                        onChange={e => { setNewRow(p => ({ ...p, prioridade: e.target.value as NivelPrioridade })); setEditingField(null) }}
                        onBlur={() => setEditingField(null)}
                        className={selectCls}>
                        {PRIORIDADES.map(p => <option key={p.nivel} value={p.nivel}>{p.label}</option>)}
                      </select>
                    ) : (
                      <span className={cn('inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold', cfg.badge)}>{cfg.label}</span>
                    )}
                  </td>
                )
              })()}

              {/* Hora */}
              <td style={{ left: L.hora, width: W.hora, minWidth: W.hora }}
                className={cn(tdNew, 'border-t-2 border-t-emerald-400 dark:border-t-emerald-600 text-center cursor-pointer')}
                onClick={() => editingField !== 'hora' && setEditingField('hora')}>
                {editingField === 'hora' ? (
                  <select autoFocus value={newRow.hora}
                    onChange={e => { setNewRow(p => ({ ...p, hora: e.target.value })); setEditingField(null) }}
                    onBlur={() => setEditingField(null)}
                    className={selectCls}>
                    <option value="">—</option>
                    {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                ) : (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{newRow.hora || '—'}</span>
                )}
              </td>

              {/* Hora Fim */}
              <td style={{ left: L.horaFim, width: W.horaFim, minWidth: W.horaFim }}
                className={cn(tdNew, 'border-t-2 border-t-emerald-400 dark:border-t-emerald-600 text-center cursor-pointer')}
                onClick={() => editingField !== 'horaFim' && setEditingField('horaFim')}>
                {editingField === 'horaFim' ? (
                  <select autoFocus value={newRow.horaFim}
                    onChange={e => { setNewRow(p => ({ ...p, horaFim: e.target.value })); setEditingField(null) }}
                    onBlur={() => setEditingField(null)}
                    className={selectCls}>
                    <option value="">—</option>
                    {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                ) : (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{newRow.horaFim || '—'}</span>
                )}
              </td>

              {/* Início */}
              <td style={{ left: L.inicio, width: W.inicio, minWidth: W.inicio }}
                className={cn(tdNew, 'border-t-2 border-t-emerald-400 dark:border-t-emerald-600 text-center cursor-pointer')}
                onClick={() => editingField !== 'inicio' && setEditingField('inicio')}>
                {editingField === 'inicio' ? (
                  <input autoFocus type="date" value={newRow.inicio}
                    onChange={e => setNewRow(p => ({ ...p, inicio: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    className="w-full text-[10px] bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer font-mono" />
                ) : (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{newRow.inicio || '—'}</span>
                )}
              </td>

              {/* Fim */}
              <td style={{ left: L.fim, width: W.fim, minWidth: W.fim }}
                className={cn(tdNew, 'border-t-2 border-t-emerald-400 dark:border-t-emerald-600 text-center cursor-pointer')}
                onClick={() => editingField !== 'fim' && setEditingField('fim')}>
                {editingField === 'fim' ? (
                  <input autoFocus type="date" value={newRow.fim}
                    onChange={e => setNewRow(p => ({ ...p, fim: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    className="w-full text-[10px] bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer font-mono" />
                ) : (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{newRow.fim || '—'}</span>
                )}
              </td>

              {/* Nav spacer */}
              <td className="border-b border-emerald-100 dark:border-emerald-800/30 border-t-2 border-t-emerald-400 dark:border-t-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 w-6" />

              {/* Day cells — primeiro clique = início, segundo = fim */}
              {days.map((day, i) => {
                const iso      = format(day, 'yyyy-MM-dd')
                const selected = newRow.diasSelecionados.includes(iso)
                const isPending = rangePending === iso
                const isInPreview = rangePending && iso >= [rangePending, iso].sort()[0] && iso <= [rangePending, iso].sort()[1]
                return (
                  <td key={i}
                    onClick={() => toggleDia(iso)}
                    className={cn(
                      'border-b border-r border-emerald-100 dark:border-emerald-800/40 border-t-2 border-t-emerald-400 dark:border-t-emerald-600 p-0.5 w-[38px] min-w-[38px] cursor-pointer transition-colors',
                      selected
                        ? 'bg-emerald-100 dark:bg-emerald-900/50'
                        : 'bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/30'
                    )}>
                    {selected && (
                      <div className={cn(
                        'h-5 w-full rounded-sm flex items-center justify-center shadow-sm',
                        isPending
                          ? 'bg-emerald-400 dark:bg-emerald-500 animate-pulse'
                          : 'bg-emerald-500 dark:bg-emerald-400'
                      )}>
                        {isPending
                          ? <span className="text-white text-[8px] font-bold">1</span>
                          : <Check size={10} className="text-white" strokeWidth={3} />
                        }
                      </div>
                    )}
                  </td>
                )
              })}

              {/* Save button */}
              <td className="border-b border-emerald-100 dark:border-emerald-800/30 border-t-2 border-t-emerald-400 dark:border-t-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 w-6 px-0.5">
                <button onClick={handleSave} disabled={!newRow.titulo.trim()}
                  title="Salvar tarefa"
                  className="w-5 h-5 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-sm">
                  <Check size={10} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Legend ── */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center gap-4 flex-wrap">
        <span className="text-[11px] text-slate-400 font-medium">Legenda:</span>
        {PRIORIDADES.map(p => (
          <div key={p.nivel} className="flex items-center gap-1.5">
            <div className={cn('w-5 h-3 rounded-sm', p.cell)} />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{p.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-5 h-3 rounded-sm bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-300 dark:border-indigo-700" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Hoje</span>
        </div>
        <span className="text-[11px] text-slate-400 ml-2">· Apenas dias úteis (sem fins de semana e feriados nacionais)</span>
      </div>

      {selectedTarefa && (
        <TaskDetailsDrawer tarefa={selectedTarefa} onClose={() => setSelectedTarefa(null)} onEdit={() => {}} />
      )}
    </div>
  )
}
