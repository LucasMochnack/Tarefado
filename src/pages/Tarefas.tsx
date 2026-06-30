import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ListTodo, Plus, X, Trash2, Edit2, Check, Repeat, Clock, ToggleLeft, ToggleRight, User } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Tarefa, StatusTarefa, Time, TarefaRecorrente } from '@/types'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { TaskDetailsDrawer } from '@/components/tasks/TaskDetailsDrawer'
import { RecorrenteFormModal } from '@/components/tasks/RecorrenteFormModal'
import { VoiceInputButton } from '@/components/shared/VoiceInputButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { TimeBadge } from '@/components/shared/TimeBadge'
import { UserAvatarPicker } from '@/components/shared/UserAvatarPicker'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { isOverdue, prazoLabel, addDaysISO } from '@/utils/dates'
import { cn } from '@/lib/utils'
import { usePermissoes } from '@/hooks/usePermissoes'
import toast from 'react-hot-toast'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function descRecorrencia(r: TarefaRecorrente): string {
  if (r.tipoRecorrencia === 'diaria') return 'Todos os dias'
  if (r.tipoRecorrencia === 'mensal') return `Todo dia ${r.diaMes}`
  const dias = [...r.diasSemana].sort().map(d => DIAS_SEMANA[d]).join(', ')
  return `Toda ${dias}`
}

// Mapeia cargo (texto) para Time value — mesmo do TaskFormModal
const CARGO_TIME_MAP: Record<string, string> = {
  'Alta Renda': 'alta-renda', 'Varejo': 'varejo', 'On Demand': 'on-demand',
  'B2C': 'b2c', 'Campinas': 'campinas', 'Produtos': 'produtos',
  'Performance': 'performance', 'Geral': 'geral',
}

const FILTROS_STATUS: { value: StatusTarefa | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'a-fazer', label: 'A Fazer' },
  { value: 'em-andamento', label: 'Em Andamento' },
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'concluido', label: 'Concluídas' },
]

export function Tarefas() {
  const [searchParams] = useSearchParams()
  const {
    tarefas: todasTarefas, addTarefa, updateTarefa, deleteTarefa, usuarios, usuarioEmail,
    tarefasRecorrentes, deleteTarefaRecorrente, updateTarefaRecorrente, projetoSelecionado,
  } = useStore()
  const timesPermitidos = usePermissoes()
  const tarefas = (timesPermitidos ? todasTarefas.filter(t => timesPermitidos.includes(t.time)) : todasTarefas)
    .filter(t => !projetoSelecionado || t.projetoId === projetoSelecionado)

  const [aba, setAba] = useState<'tarefas' | 'recorrentes'>('tarefas')
  const [taskOpen, setTaskOpen] = useState(false)
  const [editTarefa, setEditTarefa] = useState<Tarefa | null>(null)
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tarefa | null>(null)
  const [busca, setBusca] = useState(searchParams.get('busca') || '')
  const [statusFiltro, setStatusFiltro] = useState<StatusTarefa | 'todas'>('todas')
  const [quickTitle, setQuickTitle] = useState('')

  // Recorrentes
  const [recModalOpen, setRecModalOpen] = useState(false)
  const [editRec, setEditRec] = useState<TarefaRecorrente | undefined>(undefined)
  const [delRec, setDelRec] = useState<TarefaRecorrente | null>(null)

  const openNovaRec = () => { setEditRec(undefined); setRecModalOpen(true) }
  const openEditarRec = (r: TarefaRecorrente) => { setEditRec(r); setRecModalOpen(true) }

  useEffect(() => {
    const b = searchParams.get('busca')
    if (b) setBusca(b)
  }, [searchParams])

  // Time padrão pelo cargo do usuário logado
  const usuarioLogado = usuarios.find(u => u.email.toLowerCase() === usuarioEmail.toLowerCase())
  const timeDefault = (usuarioLogado?.cargo ? CARGO_TIME_MAP[usuarioLogado.cargo] : 'geral') as Time

  const filtered = tarefas
    .filter(t => statusFiltro === 'todas' || t.status === statusFiltro)
    .filter(t => {
      if (!busca) return true
      const q = busca.toLowerCase()
      return t.titulo.toLowerCase().includes(q) || t.descricao.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      // Concluídas no fim, depois por score
      if (a.status === 'concluido' && b.status !== 'concluido') return 1
      if (b.status === 'concluido' && a.status !== 'concluido') return -1
      return b.scorePrioridade - a.scorePrioridade
    })

  const handleQuickAdd = () => {
    const titulo = quickTitle.trim()
    if (!titulo) return
    addTarefa({
      titulo,
      descricao: '',
      status: 'a-fazer',
      prioridade: 'media',
      prazo: addDaysISO(7),
      responsavel: '',
      projetoId: projetoSelecionado || '',
      time: timeDefault,
      tags: [],
      checklist: [],
      comentarios: [],
    } as any)
    setQuickTitle('')
    toast.success('Tarefa adicionada!')
  }

  const toggleConcluir = (t: Tarefa) => {
    updateTarefa(t.id, { status: t.status === 'concluido' ? 'a-fazer' : 'concluido' })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteTarefa(deleteTarget.id)
    toast.success('Tarefa excluída!')
    setDeleteTarget(null)
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ListTodo size={22} className="text-indigo-500" />
            Minhas Tarefas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {aba === 'tarefas'
              ? `${filtered.length} tarefa${filtered.length !== 1 ? 's' : ''}`
              : `${tarefasRecorrentes.length} recorrente${tarefasRecorrentes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {aba === 'tarefas' ? (
            <>
              <VoiceInputButton size="sm" />
              <button onClick={() => setTaskOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
                <Plus size={15} /> Nova Tarefa
              </button>
            </>
          ) : (
            <button onClick={openNovaRec} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
              <Plus size={15} /> Nova Recorrente
            </button>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setAba('tarefas')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            aba === 'tarefas'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          )}
        >
          <ListTodo size={15} /> Tarefas
        </button>
        <button
          onClick={() => setAba('recorrentes')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            aba === 'recorrentes'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          )}
        >
          <Repeat size={15} /> Recorrentes
          {tarefasRecorrentes.length > 0 && (
            <span className="ml-1 text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-1.5 py-0.5">
              {tarefasRecorrentes.length}
            </span>
          )}
        </button>
      </div>

      {/* ===== ABA TAREFAS ===== */}
      {aba === 'tarefas' && <>

      {/* Adição rápida */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400 transition-all">
        <Plus size={18} className="text-slate-400 flex-shrink-0" />
        <input
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd() }}
          placeholder="Escreva uma tarefa e tecle Enter…"
          className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
        {quickTitle.trim() && (
          <button onClick={handleQuickAdd} className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors">
            Adicionar
          </button>
        )}
      </div>

      {/* Busca + filtro de status */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Buscar…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-48"
        />
        {busca && (
          <button onClick={() => setBusca('')} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1">
            <X size={12} /> Limpar
          </button>
        )}
        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          {FILTROS_STATUS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFiltro(f.value)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                statusFiltro === f.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ListTodo size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Nenhuma tarefa por aqui</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const overdue = isOverdue(t.prazo) && t.status !== 'concluido'
            const done = t.status === 'concluido'
            return (
              <div key={t.id} className={cn(
                'bg-white dark:bg-slate-900 rounded-xl border p-3 flex items-center gap-3 group hover:shadow-sm transition-all',
                overdue ? 'border-red-200 dark:border-red-900/40' : 'border-slate-200 dark:border-slate-700'
              )}>
                {/* Concluir */}
                <button
                  onClick={() => toggleConcluir(t)}
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    done
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'
                  )}
                  title={done ? 'Reabrir' : 'Concluir'}
                >
                  {done && <Check size={12} />}
                </button>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTarefa(t)}>
                  <p className={cn(
                    'text-sm font-medium truncate transition-colors',
                    done ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  )}>
                    {t.titulo}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <PriorityBadge nivel={t.nivelPrioridade} size="xs" showIcon={false} />
                    <StatusBadge status={t.status} size="xs" />
                    <span className={cn('text-[11px]', overdue ? 'text-red-500' : 'text-slate-400')}>
                      {prazoLabel(t.prazo, t.status)}
                    </span>
                  </div>
                </div>

                {/* Time + Responsável */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <TimeBadge time={t.time} />
                  <UserAvatarPicker tarefaId={t.id} responsavel={t.responsavel} size="sm" />
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => setEditTarefa(t)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      </>}

      {/* ===== ABA RECORRENTES ===== */}
      {aba === 'recorrentes' && (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tarefas que se repetem automaticamente. Ex.: <span className="text-slate-700 dark:text-slate-300 font-medium">toda segunda às 07:00, criar “Enviar relatório semanal”</span>.
          </p>

          {tarefasRecorrentes.length === 0 ? (
            <div className="text-center py-16">
              <Repeat size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">Nenhuma tarefa recorrente</p>
              <button onClick={openNovaRec} className="mt-3 text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
                Criar a primeira
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {tarefasRecorrentes.map(r => (
                <div key={r.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3 group hover:shadow-sm transition-all">
                  <button
                    onClick={() => updateTarefaRecorrente(r.id, { ativa: !r.ativa })}
                    className={cn('flex-shrink-0 transition-colors', r.ativa ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 dark:text-slate-600 hover:text-slate-400')}
                    title={r.ativa ? 'Ativa — clique para pausar' : 'Pausada — clique para ativar'}
                  >
                    {r.ativa ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', r.ativa ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500')}>
                      {r.titulo}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Repeat size={11} /> {descRecorrencia(r)}</span>
                      {r.horaAgenda && <span className="flex items-center gap-1"><Clock size={11} /> {r.horaAgenda}</span>}
                      {r.responsavel && <span className="flex items-center gap-1"><User size={11} /> {r.responsavel}</span>}
                    </div>
                  </div>

                  <TimeBadge time={r.time} />

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => openEditarRec(r)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDelRec(r)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <TaskFormModal open={taskOpen} onOpenChange={setTaskOpen} />
      <TaskFormModal open={!!editTarefa} onOpenChange={v => !v && setEditTarefa(null)} tarefa={editTarefa || undefined} />
      <TaskDetailsDrawer tarefa={selectedTarefa} onClose={() => setSelectedTarefa(null)} />
      <RecorrenteFormModal
        key={editRec?.id ?? 'nova'}
        open={recModalOpen}
        onOpenChange={setRecModalOpen}
        recorrente={editRec}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={v => !v && setDeleteTarget(null)}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir "${deleteTarget?.titulo}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={!!delRec}
        onOpenChange={v => !v && setDelRec(null)}
        title="Excluir tarefa recorrente"
        description={`Remover a recorrência "${delRec?.titulo}"? As tarefas já criadas não são afetadas.`}
        confirmLabel="Excluir"
        onConfirm={() => { if (delRec) { deleteTarefaRecorrente(delRec.id); toast.success('Recorrência removida!'); setDelRec(null) } }}
      />
    </div>
  )
}
