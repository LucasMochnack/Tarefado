import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Plus, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Tarefa, StatusTarefa } from '@/types'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { TaskDetailsDrawer } from '@/components/tasks/TaskDetailsDrawer'
import { ProjectFormModal } from '@/components/projects/ProjectFormModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { VoiceInputButton } from '@/components/shared/VoiceInputButton'
import { formatDate, isOverdue, prazoLabel } from '@/utils/dates'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export function ProjetoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projetos, tarefas, deleteProjeto } = useStore()
  const [taskOpen, setTaskOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusTarefa | ''>('')
  const [view, setView] = useState<'lista' | 'kanban'>('lista')

  const projeto = projetos.find(p => p.id === id)

  if (!projeto) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-slate-500 dark:text-slate-400">Projeto não encontrado</p>
        <button onClick={() => navigate('/projetos')} className="text-indigo-600 hover:underline flex items-center gap-1">
          <ArrowLeft size={14} /> Voltar para Projetos
        </button>
      </div>
    )
  }

  const tarefasProjeto = tarefas.filter(t => t.projetoId === id)
  const filteredTarefas = statusFilter ? tarefasProjeto.filter(t => t.status === statusFilter) : tarefasProjeto

  const pendentes = tarefasProjeto.filter(t => t.status === 'a-fazer').length
  const andamento = tarefasProjeto.filter(t => t.status === 'em-andamento').length
  const concluidas = tarefasProjeto.filter(t => t.status === 'concluido').length
  const atrasadas = tarefasProjeto.filter(t => isOverdue(t.prazo) && t.status !== 'concluido').length

  const handleDelete = () => {
    deleteProjeto(projeto.id)
    toast.success('Projeto excluído')
    navigate('/projetos')
  }

  const quadranteLabelMap: Record<string, string> = {
    'importante-urgente': '🔴 Importante + Urgente',
    'importante-nao-urgente': '🔵 Importante + Não Urgente',
    'nao-importante-urgente': '🟠 Não Importante + Urgente',
    'nao-importante-nao-urgente': '⚪ Não Importante + Não Urgente',
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Nav */}
      <button onClick={() => navigate('/projetos')} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        <ArrowLeft size={15} /> Projetos
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl flex-shrink-0" style={{ backgroundColor: projeto.cor + '22', border: `2px solid ${projeto.cor}` }}>
              <div className="w-full h-full rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: projeto.cor }} />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{projeto.nome}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{projeto.descricao}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                  {quadranteLabelMap[projeto.quadranteEisenhower]}
                </span>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full capitalize">
                  Time: {projeto.time}
                </span>
                <span className={cn('text-xs px-2.5 py-1 rounded-full capitalize',
                  isOverdue(projeto.prazoFinal)
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                )}>
                  <Calendar size={11} className="inline mr-1" />
                  {isOverdue(projeto.prazoFinal) ? 'Atrasado · ' : ''}{formatDate(projeto.prazoFinal)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <VoiceInputButton size="sm" defaultProjetoId={projeto.id} />
            <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors">
              <Edit2 size={13} /> Editar
            </button>
            <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Progresso geral</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{projeto.progresso}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${projeto.progresso}%`, backgroundColor: projeto.cor }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          {[
            { label: 'Pendentes', value: pendentes, color: 'text-slate-700 dark:text-slate-200' },
            { label: 'Em Andamento', value: andamento, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Concluídas', value: concluidas, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Atrasadas', value: atrasadas, color: atrasadas > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks section */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            {(['', 'a-fazer', 'em-andamento', 'aguardando', 'concluido'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s as StatusTarefa | '')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {s === '' ? `Todas (${tarefasProjeto.length})` : <StatusBadge status={s} size="xs" />}
              </button>
            ))}
          </div>
          <button
            onClick={() => setTaskOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
          >
            <Plus size={13} /> Nova Tarefa
          </button>
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {filteredTarefas.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
              Nenhuma tarefa encontrada
            </div>
          )}
          {filteredTarefas
            .sort((a, b) => b.scorePrioridade - a.scorePrioridade)
            .map(t => {
              const overdue = isOverdue(t.prazo) && t.status !== 'concluido'
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTarefa(t)}
                  className={cn(
                    'bg-white dark:bg-slate-900 rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-all duration-200 flex items-center gap-4',
                    overdue ? 'border-red-200 dark:border-red-900/40' : 'border-slate-200 dark:border-slate-700'
                  )}
                >
                  <StatusBadge status={t.status} />
                  <PriorityBadge nivel={t.nivelPrioridade} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{t.titulo}</p>
                    {t.motivoPrioridade && t.nivelPrioridade !== 'baixa' && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{t.motivoPrioridade}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                    {t.responsavel && <span>{t.responsavel.split(' ')[0]}</span>}
                    <span className={overdue ? 'text-red-500' : ''}>{prazoLabel(t.prazo, t.status)}</span>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      <TaskFormModal open={taskOpen} onOpenChange={setTaskOpen} defaultProjetoId={projeto.id} defaultTime={projeto.time as any} />
      <ProjectFormModal open={editOpen} onOpenChange={setEditOpen} projeto={projeto} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir projeto"
        description={`Tem certeza que deseja excluir "${projeto.nome}"? Todas as tarefas vinculadas serão removidas.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
      />
      <TaskDetailsDrawer tarefa={selectedTarefa} onClose={() => setSelectedTarefa(null)} />
    </div>
  )
}
