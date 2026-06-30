import { useState, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Plus, Trash2, GripVertical, ChevronDown, Pencil, ListChecks } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Tarefa, StatusTarefa, NivelPrioridade, Time } from '@/types'
import { addDaysISO } from '@/utils/dates'
import { RESPONSAVEIS } from '@/data/mockData'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface CheckItem { id: string; texto: string; concluido: boolean }

interface TaskFormModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  tarefa?: Tarefa
  defaultStatus?: StatusTarefa
  defaultTime?: Time
}

const CARGO_TIME_MAP: Record<string, string> = {
  'Alta Renda': 'alta-renda',
  'Varejo': 'varejo',
  'On Demand': 'on-demand',
  'B2C': 'b2c',
  'Campinas': 'campinas',
  'Produtos': 'produtos',
  'Performance': 'performance',
  'Geral': 'geral',
}

const FIELD = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-colors'
const LABEL = 'block text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider'

// Select com chevron custom (oculta a seta nativa feia do SO)
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
    </div>
  )
}

function SelectField({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(FIELD, 'appearance-none pr-9 cursor-pointer')}
      >
        {children}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

export function TaskFormModal({ open, onOpenChange, tarefa, defaultStatus, defaultTime }: TaskFormModalProps) {
  const { addTarefa, updateTarefa, usuarios, usuarioEmail, projetos, projetoSelecionado } = useStore()
  const isEdit = !!tarefa

  const usuarioLogado = usuarios.find(u => u.email.toLowerCase() === usuarioEmail.toLowerCase())
  const timeDoUsuario = usuarioLogado?.cargo
    ? (CARGO_TIME_MAP[usuarioLogado.cargo] as Time | undefined)
    : undefined
  const timeDefault = defaultTime ?? timeDoUsuario ?? 'geral'

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    status: (defaultStatus || 'a-fazer') as StatusTarefa,
    prioridade: 'media' as NivelPrioridade,
    prazo: addDaysISO(7).slice(0, 10),
    horaAgenda: '',
    responsavel: '',
    time: timeDefault as Time,
    projetoId: projetoSelecionado || '',
    tags: '',
  })

  const [checklist, setChecklist] = useState<CheckItem[]>([])
  const [novoItem, setNovoItem] = useState('')
  const novoItemRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (tarefa) {
      setForm({
        titulo: tarefa.titulo,
        descricao: tarefa.descricao,
        status: tarefa.status,
        prioridade: tarefa.prioridade,
        prazo: tarefa.prazo.slice(0, 10),
        horaAgenda: tarefa.horaAgenda || '',
        responsavel: tarefa.responsavel,
        time: tarefa.time,
        projetoId: tarefa.projetoId || '',
        tags: tarefa.tags.join(', '),
      })
      setChecklist(tarefa.checklist.map(c => ({ ...c })))
    } else {
      setForm({
        titulo: '',
        descricao: '',
        status: defaultStatus || 'a-fazer',
        prioridade: 'media',
        prazo: addDaysISO(7).slice(0, 10),
        horaAgenda: '',
        responsavel: '',
        time: timeDefault,
        projetoId: projetoSelecionado || '',
        tags: '',
      })
      setChecklist([])
    }
  }, [tarefa, open, defaultStatus, defaultTime])

  const addCheckItem = () => {
    const texto = novoItem.trim()
    if (!texto) return
    setChecklist(prev => [...prev, { id: `ck-${Date.now()}`, texto, concluido: false }])
    setNovoItem('')
    novoItemRef.current?.focus()
  }

  const removeCheckItem = (id: string) => setChecklist(prev => prev.filter(c => c.id !== id))

  const toggleCheckItem = (id: string) =>
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, concluido: !c.concluido } : c))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const data = {
      ...form,
      prazo: new Date(form.prazo).toISOString(),
      horaAgenda: form.horaAgenda || undefined,
      tags,
      checklist,
      comentarios: tarefa?.comentarios || [],
    }
    if (isEdit && tarefa) {
      updateTarefa(tarefa.id, data)
      toast.success('Tarefa atualizada!')
    } else {
      addTarefa(data)
      toast.success('Tarefa criada!')
    }
    onOpenChange(false)
  }

  const concluidos = checklist.filter(c => c.concluido).length
  const pct = checklist.length > 0 ? Math.round((concluidos / checklist.length) * 100) : 0

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-black/5 border border-slate-200 dark:border-slate-800 animate-fade-in overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              {isEdit ? <Pencil size={18} /> : <Plus size={20} strokeWidth={2.5} />}
            </div>
            <div className="flex-1 min-w-0">
              <Dialog.Title className="font-display font-bold text-slate-900 dark:text-white text-lg leading-tight">
                {isEdit ? 'Editar tarefa' : 'Nova tarefa'}
              </Dialog.Title>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {isEdit ? 'Atualize os detalhes da tarefa' : 'Preencha os detalhes para criar a tarefa'}
              </p>
            </div>
            <Dialog.Close className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* Body */}
          <form id="task-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <Field label="Título *">
              <input
                required
                autoFocus
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                className={cn(FIELD, 'text-base py-3 font-medium')}
                placeholder="O que precisa ser feito?"
              />
            </Field>

            <Field label="Descrição">
              <textarea
                rows={3}
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                className={cn(FIELD, 'resize-none')}
                placeholder="Detalhes adicionais…"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <SelectField value={form.status} onChange={v => setForm(f => ({ ...f, status: v as StatusTarefa }))}>
                  <option value="a-fazer">A Fazer</option>
                  <option value="em-andamento">Em Andamento</option>
                  <option value="aguardando">Aguardando</option>
                  <option value="concluido">Concluído</option>
                </SelectField>
              </Field>
              <Field label="Prioridade">
                <SelectField value={form.prioridade} onChange={v => setForm(f => ({ ...f, prioridade: v as NivelPrioridade }))}>
                  <option value="critica">🔴 Crítica</option>
                  <option value="alta">🟠 Alta</option>
                  <option value="media">🟡 Média</option>
                  <option value="baixa">⚪ Baixa</option>
                </SelectField>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Prazo">
                <input
                  type="date"
                  value={form.prazo}
                  onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))}
                  className={cn(FIELD, 'cursor-pointer')}
                />
              </Field>
              <Field label="Horário (Google Agenda)">
                <input
                  type="time"
                  value={form.horaAgenda}
                  onChange={e => setForm(f => ({ ...f, horaAgenda: e.target.value }))}
                  className={cn(FIELD, 'cursor-pointer')}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Responsável">
                <SelectField value={form.responsavel} onChange={v => setForm(f => ({ ...f, responsavel: v }))}>
                  <option value="">Sem responsável</option>
                  {(usuarios?.length > 0 ? usuarios.map((u: any) => u.nome) : RESPONSAVEIS).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </SelectField>
              </Field>
              <Field label="Time">
                <SelectField value={form.time} onChange={v => setForm(f => ({ ...f, time: v as Time }))}>
                  <option value="alta-renda">Alta Renda</option>
                  <option value="varejo">Varejo</option>
                  <option value="on-demand">On Demand</option>
                  <option value="b2c">B2C</option>
                  <option value="campinas">Campinas</option>
                  <option value="produtos">Produtos</option>
                  <option value="performance">Performance</option>
                  <option value="geral">Geral</option>
                </SelectField>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Projeto">
                <SelectField value={form.projetoId} onChange={v => setForm(f => ({ ...f, projetoId: v }))}>
                  <option value="">— Sem projeto —</option>
                  {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </SelectField>
              </Field>
              <Field label="Tags">
                <input
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className={FIELD}
                  placeholder="follow-up, cliente…"
                />
              </Field>
            </div>

            {/* Subitens / Checklist */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <ListChecks size={13} /> Subitens
                </span>
                {checklist.length > 0 && (
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{concluidos}/{checklist.length} · {pct}%</span>
                )}
              </div>

              {checklist.length > 0 && (
                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
              )}

              <div className="space-y-1">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <GripVertical size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                    <input
                      type="checkbox"
                      checked={item.concluido}
                      onChange={() => toggleCheckItem(item.id)}
                      className="accent-indigo-600 flex-shrink-0 w-3.5 h-3.5"
                    />
                    <input
                      value={item.texto}
                      onChange={e => setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, texto: e.target.value } : c))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); novoItemRef.current?.focus() } }}
                      className={cn(
                        'flex-1 bg-transparent border-none outline-none text-sm py-1 px-1.5 rounded-md',
                        'text-slate-800 dark:text-slate-100',
                        'hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800',
                        item.concluido && 'line-through text-slate-400 dark:text-slate-500'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => removeCheckItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-500 transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pl-[18px]">
                <Plus size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  ref={novoItemRef}
                  value={novoItem}
                  onChange={e => setNovoItem(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCheckItem() } }}
                  placeholder="Adicionar subitem…"
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-600 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 py-1"
                />
                {novoItem.trim() && (
                  <button type="button" onClick={addCheckItem} className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors">
                    Add
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
            <Dialog.Close asChild>
              <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Cancelar
              </button>
            </Dialog.Close>
            <button
              type="submit"
              form="task-form"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/30 transition-all active:scale-[0.98]"
            >
              {isEdit ? 'Salvar alterações' : 'Criar tarefa'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
