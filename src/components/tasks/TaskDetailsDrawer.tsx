import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X, Edit2, Trash2, Calendar, User, Tag, Folder, Clock,
  MessageSquare, CheckSquare, Plus, Send, ChevronDown, AlertCircle
} from 'lucide-react'
import { Tarefa, StatusTarefa } from '@/types'
import { useStore } from '@/store/useStore'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge, ScoreBadge } from '@/components/shared/PriorityBadge'
import { TimeBadge } from '@/components/shared/TimeBadge'
import { TaskFormModal } from './TaskFormModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatDate, formatRelative, isOverdue, prazoLabel } from '@/utils/dates'
import { todayISO } from '@/utils/dates'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface TaskDetailsDrawerProps {
  tarefa: Tarefa | null
  onClose: () => void
}

export function TaskDetailsDrawer({ tarefa, onClose }: TaskDetailsDrawerProps) {
  const { updateTarefa, deleteTarefa, projetos } = useStore()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [novoComentario, setNovoComentario] = useState('')
  const [novoCheckItem, setNovoCheckItem] = useState('')
  const [addingCheck, setAddingCheck] = useState(false)

  if (!tarefa) return null

  const projeto = projetos.find(p => p.id === tarefa.projetoId)
  const overdue = isOverdue(tarefa.prazo) && tarefa.status !== 'concluido'

  const handleDelete = () => {
    deleteTarefa(tarefa.id)
    toast.success('Tarefa excluída')
    onClose()
  }

  const handleStatusChange = (status: StatusTarefa) => {
    updateTarefa(tarefa.id, { status })
    toast.success('Status atualizado!')
  }

  const handleAddComentario = () => {
    if (!novoComentario.trim()) return
    const comentario = {
      id: `com-${Date.now()}`,
      tarefaId: tarefa.id,
      autor: 'Você',
      texto: novoComentario.trim(),
      criadoEm: todayISO(),
    }
    updateTarefa(tarefa.id, { comentarios: [...tarefa.comentarios, comentario] })
    setNovoComentario('')
    toast.success('Comentário adicionado!')
  }

  const handleToggleCheck = (checkId: string) => {
    const newChecklist = tarefa.checklist.map(c =>
      c.id === checkId ? { ...c, concluido: !c.concluido } : c
    )
    updateTarefa(tarefa.id, { checklist: newChecklist })
  }

  const handleAddCheckItem = () => {
    if (!novoCheckItem.trim()) return
    const item = { id: `ck-${Date.now()}`, texto: novoCheckItem.trim(), concluido: false }
    updateTarefa(tarefa.id, { checklist: [...tarefa.checklist, item] })
    setNovoCheckItem('')
    setAddingCheck(false)
  }

  const checkProgress = tarefa.checklist.length > 0
    ? Math.round((tarefa.checklist.filter(c => c.concluido).length / tarefa.checklist.length) * 100)
    : null

  return (
    <>
      <Dialog.Root open={!!tarefa} onOpenChange={open => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
          <Dialog.Content className="fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col animate-slide-in">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex-1 pr-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <StatusBadge status={tarefa.status} />
                  <PriorityBadge nivel={tarefa.nivelPrioridade} />
                  <TimeBadge time={tarefa.time} />
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Score:</span>
                    <ScoreBadge score={tarefa.scorePrioridade} />
                  </div>
                </div>
                <Dialog.Title className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                  {tarefa.titulo}
                </Dialog.Title>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setEditOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600 transition-colors">
                  <Trash2 size={16} />
                </button>
                <Dialog.Close asChild>
                  <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={18} />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Motivo prioridade */}
              {tarefa.nivelPrioridade === 'critica' && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400 font-medium">{tarefa.motivoPrioridade}</p>
                </div>
              )}

              {/* Descrição */}
              {tarefa.descricao && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Descrição</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{tarefa.descricao}</p>
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <MetaItem icon={Calendar} label="Prazo">
                  <span className={cn('text-sm font-medium', overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300')}>
                    {prazoLabel(tarefa.prazo, tarefa.status)} · {formatDate(tarefa.prazo)}
                  </span>
                </MetaItem>
                <MetaItem icon={User} label="Responsável">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{tarefa.responsavel || 'Sem responsável'}</span>
                </MetaItem>
                <MetaItem icon={Folder} label="Projeto">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{projeto?.nome || '—'}</span>
                </MetaItem>
                <MetaItem icon={Clock} label="Atualizado">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{formatRelative(tarefa.ultimaAtualizacao)}</span>
                </MetaItem>
              </div>

              {/* Tags */}
              {tarefa.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {tarefa.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mover status */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Mover para</h4>
                <div className="flex gap-2 flex-wrap">
                  {(['a-fazer', 'em-andamento', 'aguardando', 'concluido'] as StatusTarefa[]).map(s => (
                    <button
                      key={s}
                      disabled={tarefa.status === s}
                      onClick={() => handleStatusChange(s)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        tarefa.status === s
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 cursor-default ring-1 ring-indigo-300 dark:ring-indigo-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700'
                      )}
                    >
                      <StatusBadge status={s} size="xs" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Checklist {checkProgress !== null && `(${checkProgress}%)`}
                  </h4>
                  <button onClick={() => setAddingCheck(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                    <Plus size={12} /> Adicionar
                  </button>
                </div>
                {checkProgress !== null && (
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-3">
                    <div className="h-1.5 bg-indigo-500 rounded-full transition-all" style={{ width: `${checkProgress}%` }} />
                  </div>
                )}
                <div className="space-y-2">
                  {tarefa.checklist.map(item => (
                    <label key={item.id} className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={item.concluido}
                        onChange={() => handleToggleCheck(item.id)}
                        className="mt-0.5 accent-indigo-600"
                      />
                      <span className={cn('text-sm', item.concluido ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300')}>
                        {item.texto}
                      </span>
                    </label>
                  ))}
                  {addingCheck && (
                    <div className="flex gap-2 mt-2">
                      <input
                        autoFocus
                        value={novoCheckItem}
                        onChange={e => setNovoCheckItem(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddCheckItem()}
                        placeholder="Item do checklist..."
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <button onClick={handleAddCheckItem} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs hover:bg-indigo-700">
                        OK
                      </button>
                      <button onClick={() => setAddingCheck(false)} className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs">
                        ✕
                      </button>
                    </div>
                  )}
                  {tarefa.checklist.length === 0 && !addingCheck && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">Sem itens no checklist</p>
                  )}
                </div>
              </div>

              {/* Comentários */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Comentários ({tarefa.comentarios.length})
                </h4>
                <div className="space-y-3">
                  {tarefa.comentarios.map(c => (
                    <div key={c.id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                        {c.autor.charAt(0)}
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{c.autor}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">{formatRelative(c.criadoEm)}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{c.texto}</p>
                      </div>
                    </div>
                  ))}
                  {tarefa.comentarios.length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">Sem comentários ainda</p>
                  )}
                </div>
              </div>
            </div>

            {/* Add comment */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                <input
                  value={novoComentario}
                  onChange={e => setNovoComentario(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComentario()}
                  placeholder="Adicionar comentário..."
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
                <button
                  onClick={handleAddComentario}
                  disabled={!novoComentario.trim()}
                  className="p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                Criada em {formatDate(tarefa.criadoEm)} · ID: {tarefa.id}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <TaskFormModal open={editOpen} onOpenChange={setEditOpen} tarefa={tarefa} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir "${tarefa.titulo}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
      />
    </>
  )
}

function MetaItem({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <Icon size={11} />
        {label}
      </div>
      {children}
    </div>
  )
}
