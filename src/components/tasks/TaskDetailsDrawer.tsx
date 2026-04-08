import { useState, useRef, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X, Trash2, Calendar, User, Tag, Folder, Clock,
  MessageSquare, CheckSquare, Plus, Send, AlertCircle, Check, Pencil
} from 'lucide-react'
import { Tarefa, StatusTarefa, Time, NivelPrioridade } from '@/types'
import { useStore } from '@/store/useStore'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge, ScoreBadge } from '@/components/shared/PriorityBadge'
import { TimeBadge } from '@/components/shared/TimeBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatDate, formatRelative, isOverdue, prazoLabel } from '@/utils/dates'
import { todayISO } from '@/utils/dates'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/shared/UserAvatar'

interface TaskDetailsDrawerProps {
  tarefa: Tarefa | null
  onClose: () => void
}

const TIMES: { value: Time; label: string }[] = [
  { value: 'alta-renda', label: 'Alta Renda' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'on-demand', label: 'On Demand' },
  { value: 'b2c', label: 'B2C' },
  { value: 'campinas', label: 'Campinas' },
  { value: 'produtos', label: 'Produtos' },
  { value: 'performance', label: 'Performance' },
  { value: 'geral', label: 'Geral' },
]

const STATUS_LABELS: Record<StatusTarefa, string> = {
  'a-fazer': 'A Fazer',
  'em-andamento': 'Em Andamento',
  'aguardando': 'Aguardando',
  'concluido': 'Concluído',
}

function InlineText({
  value,
  onSave,
  placeholder,
  multiline,
  className,
}: {
  value: string
  onSave: (v: string) => void
  placeholder?: string
  multiline?: boolean
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  useEffect(() => { setDraft(value) }, [value])

  const commit = () => {
    setEditing(false)
    if (draft.trim() !== value) { onSave(draft.trim()); toast.success('Salvo!') }
  }

  if (editing) {
    const props = {
      ref,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit() }
        if (e.key === 'Escape') { setEditing(false); setDraft(value) }
      },
      className: cn(
        'w-full rounded-lg border border-indigo-400 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30',
        className
      ),
    }
    return multiline
      ? <textarea {...props} rows={3} className={cn(props.className, 'resize-none')} />
      : <input {...props} />
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        'cursor-text hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded px-1 -mx-1 transition-colors group inline-flex items-center gap-1',
        !value && 'text-slate-400 dark:text-slate-500 italic',
        className
      )}
      title="Clique para editar"
    >
      {value || placeholder || 'Clique para editar'}
      <Pencil size={10} className="opacity-0 group-hover:opacity-40 flex-shrink-0" />
    </span>
  )
}

function InlineDate({
  value,
  onSave,
}: {
  value: string
  onSave: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  return editing ? (
    <input
      ref={ref}
      type="date"
      defaultValue={value}
      autoFocus
      onBlur={e => { setEditing(false); if (e.target.value !== value) { onSave(e.target.value); toast.success('Prazo atualizado!') } }}
      onChange={e => { if (e.target.value) { onSave(e.target.value); setEditing(false); toast.success('Prazo atualizado!') } }}
      className="rounded-lg border border-indigo-400 bg-white dark:bg-slate-800 px-2 py-0.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
    />
  ) : (
    <span
      onClick={() => setEditing(true)}
      className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded px-1 -mx-1 transition-colors group inline-flex items-center gap-1"
      title="Clique para editar"
    >
      {value ? formatDate(value) : <span className="text-slate-400 italic">Sem prazo</span>}
      <Pencil size={10} className="opacity-0 group-hover:opacity-40 flex-shrink-0" />
    </span>
  )
}

function InlineSelect<T extends string>({
  value,
  options,
  onSave,
  renderValue,
}: {
  value: T
  options: { value: T; label: string }[]
  onSave: (v: T) => void
  renderValue?: (v: T) => React.ReactNode
}) {
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLSelectElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  if (editing) {
    return (
      <select
        ref={ref}
        defaultValue={value}
        autoFocus
        onBlur={() => setEditing(false)}
        onChange={e => { onSave(e.target.value as T); setEditing(false); toast.success('Salvo!') }}
        className="rounded-lg border border-indigo-400 bg-white dark:bg-slate-800 px-2 py-0.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded px-1 -mx-1 transition-colors group inline-flex items-center gap-1"
      title="Clique para editar"
    >
      {renderValue ? renderValue(value) : options.find(o => o.value === value)?.label ?? value}
      <Pencil size={10} className="opacity-0 group-hover:opacity-40 flex-shrink-0" />
    </span>
  )
}

export function TaskDetailsDrawer({ tarefa, onClose }: TaskDetailsDrawerProps) {
  const { updateTarefa, deleteTarefa, projetos, usuarios } = useStore()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [novoComentario, setNovoComentario] = useState('')
  const [novoCheckItem, setNovoCheckItem] = useState('')
  const [addingCheck, setAddingCheck] = useState(false)

  if (!tarefa) return null

  const projeto = projetos.find(p => p.id === tarefa.projetoId)
  const overdue = isOverdue(tarefa.prazo) && tarefa.status !== 'concluido'

  const save = (data: Partial<Tarefa>) => updateTarefa(tarefa.id, data)

  const handleDelete = () => {
    deleteTarefa(tarefa.id)
    toast.success('Tarefa excluída')
    onClose()
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

  const handleRemoveCheck = (checkId: string) => {
    updateTarefa(tarefa.id, { checklist: tarefa.checklist.filter(c => c.id !== checkId) })
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

  const responsavelOptions = [
    { value: '', label: 'Sem responsável' },
    ...(usuarios?.map((u: any) => ({ value: u.nome, label: u.nome })) ?? []),
  ]

  const projetoOptions = [
    { value: '', label: '—' },
    ...projetos.map(p => ({ value: p.id, label: p.nome })),
  ]

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
                  <InlineSelect
                    value={tarefa.status}
                    options={(['a-fazer', 'em-andamento', 'aguardando', 'concluido'] as StatusTarefa[]).map(s => ({ value: s, label: STATUS_LABELS[s] }))}
                    onSave={v => save({ status: v })}
                    renderValue={v => <StatusBadge status={v} />}
                  />
                  <InlineSelect
                    value={tarefa.nivelPrioridade}
                    options={(['critica', 'alta', 'media', 'baixa'] as NivelPrioridade[]).map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
                    onSave={v => save({ nivelPrioridade: v, prioridade: v })}
                    renderValue={v => <PriorityBadge nivel={v} />}
                  />
                  <InlineSelect
                    value={tarefa.time}
                    options={TIMES}
                    onSave={v => save({ time: v })}
                    renderValue={v => <TimeBadge time={v} />}
                  />
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Score:</span>
                    <ScoreBadge score={tarefa.scorePrioridade} />
                  </div>
                </div>
                <Dialog.Title asChild>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                    <InlineText
                      value={tarefa.titulo}
                      onSave={v => save({ titulo: v })}
                      placeholder="Título da tarefa"
                      className="font-bold text-base"
                    />
                  </h2>
                </Dialog.Title>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
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
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Descrição</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <InlineText
                    value={tarefa.descricao}
                    onSave={v => save({ descricao: v })}
                    placeholder="Clique para adicionar descrição..."
                    multiline
                  />
                </p>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <MetaItem icon={Calendar} label="Prazo">
                  <span className={cn('text-sm font-medium', overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300')}>
                    {tarefa.prazo && <span className="mr-1 text-xs text-slate-400">{prazoLabel(tarefa.prazo, tarefa.status)} ·</span>}
                    <InlineDate value={tarefa.prazo} onSave={v => save({ prazo: v })} />
                  </span>
                </MetaItem>
                <MetaItem icon={User} label="Responsável">
                  <div className="flex items-center gap-2">
                    {tarefa.responsavel && <UserAvatar nome={tarefa.responsavel} size="sm" />}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      <InlineText
                        value={tarefa.responsavel}
                        onSave={v => save({ responsavel: v })}
                        placeholder="Sem responsável"
                      />
                    </span>
                  </div>
                </MetaItem>
                <MetaItem icon={Folder} label="Projeto">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    <InlineSelect
                      value={tarefa.projetoId ?? ''}
                      options={projetoOptions}
                      onSave={v => save({ projetoId: v })}
                      renderValue={v => <span>{projetos.find(p => p.id === v)?.nome ?? '—'}</span>}
                    />
                  </span>
                </MetaItem>
                <MetaItem icon={Clock} label="Atualizado">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{formatRelative(tarefa.ultimaAtualizacao)}</span>
                </MetaItem>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {tarefa.tags.map(tag => (
                    <span key={tag} className="group flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      #{tag}
                      <button
                        onClick={() => { save({ tags: tarefa.tags.filter(t => t !== tag) }); toast.success('Tag removida') }}
                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-red-400 leading-none"
                      >×</button>
                    </span>
                  ))}
                  <AddTagInline onAdd={tag => {
                    if (!tarefa.tags.includes(tag)) {
                      save({ tags: [...tarefa.tags, tag] })
                      toast.success('Tag adicionada')
                    }
                  }} />
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
                    <div key={item.id} className="flex items-start gap-2.5 group">
                      <input
                        type="checkbox"
                        checked={item.concluido}
                        onChange={() => handleToggleCheck(item.id)}
                        className="mt-0.5 accent-indigo-600 cursor-pointer"
                      />
                      <span className={cn('flex-1 text-sm', item.concluido ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300')}>
                        {item.texto}
                      </span>
                      <button
                        onClick={() => handleRemoveCheck(item.id)}
                        className="opacity-0 group-hover:opacity-50 hover:!opacity-100 text-red-400 text-xs leading-none mt-0.5"
                      >×</button>
                    </div>
                  ))}
                  {addingCheck && (
                    <div className="flex gap-2 mt-2">
                      <input
                        autoFocus
                        value={novoCheckItem}
                        onChange={e => setNovoCheckItem(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddCheckItem(); if (e.key === 'Escape') { setAddingCheck(false); setNovoCheckItem('') } }}
                        placeholder="Item do checklist..."
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <button onClick={handleAddCheckItem} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs hover:bg-indigo-700">OK</button>
                      <button onClick={() => { setAddingCheck(false); setNovoCheckItem('') }} className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs">✕</button>
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

function AddTagInline({ onAdd }: { onAdd: (tag: string) => void }) {
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (adding) ref.current?.focus() }, [adding])

  const commit = () => {
    const tag = value.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag) onAdd(tag)
    setValue('')
    setAdding(false)
  }

  if (adding) {
    return (
      <input
        ref={ref}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setAdding(false); setValue('') } }}
        placeholder="nova-tag"
        className="px-2 py-0.5 rounded-md border border-indigo-400 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-24 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
      />
    )
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="px-2 py-0.5 rounded-md border border-dashed border-slate-300 dark:border-slate-600 text-xs text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
    >
      <Plus size={10} /> tag
    </button>
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
