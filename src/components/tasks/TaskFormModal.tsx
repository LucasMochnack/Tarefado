import { useState, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Plus, Trash2, GripVertical } from 'lucide-react'
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
  defaultProjetoId?: string
}

export function TaskFormModal({ open, onOpenChange, tarefa, defaultStatus, defaultTime, defaultProjetoId }: TaskFormModalProps) {
  const { addTarefa, updateTarefa, projetos, usuarios } = useStore()
  const isEdit = !!tarefa

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    status: (defaultStatus || 'a-fazer') as StatusTarefa,
    prioridade: 'media' as NivelPrioridade,
    prazo: addDaysISO(7).slice(0, 10),
    horaAgenda: '',
    horaFim: '',
    responsavel: '',
    projetoId: defaultProjetoId || projetos[0]?.id || '',
    time: (defaultTime || 'b2c') as Time,
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
        horaFim: (tarefa as any).horaFim || '',
        responsavel: tarefa.responsavel,
        projetoId: tarefa.projetoId,
        time: tarefa.time,
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
        horaFim: '',
        responsavel: '',
        projetoId: defaultProjetoId || projetos[0]?.id || '',
        time: defaultTime || 'b2c',
        tags: '',
      })
      setChecklist([])
    }
  }, [tarefa, open, defaultStatus, defaultTime, defaultProjetoId, projetos])

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
      horaFim: form.horaFim || undefined,
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

  const inputClass = 'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors'
  const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide'

  const concluidos = checklist.filter(c => c.concluido).length
  const pct = checklist.length > 0 ? Math.round((concluidos / checklist.length) * 100) : 0

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <Dialog.Title className="font-bold text-slate-900 dark:text-white text-lg">
              {isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
            </Dialog.Title>
            <Dialog.Close className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className={labelClass}>Título *</label>
              <input
                required
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                className={inputClass}
                placeholder="Descreva a tarefa..."
              />
            </div>

            <div>
              <label className={labelClass}>Descrição</label>
              <textarea
                rows={3}
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                className={cn(inputClass, 'resize-none')}
                placeholder="Detalhes adicionais..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as StatusTarefa }))} className={inputClass}>
                  <option value="a-fazer">A Fazer</option>
                  <option value="em-andamento">Em Andamento</option>
                  <option value="aguardando">Aguardando</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Prioridade</label>
                <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value as NivelPrioridade }))} className={inputClass}>
                  <option value="critica">🔴 Crítica</option>
                  <option value="alta">🟠 Alta</option>
                  <option value="media">🟡 Média</option>
                  <option value="baixa">⚪ Baixa</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>Prazo</label>
                <input
                  type="date"
                  value={form.prazo}
                  onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Hora início</label>
                <select value={form.horaAgenda} onChange={e => setForm(f => ({ ...f, horaAgenda: e.target.value }))} className={inputClass}>
                  <option value="">Automático</option>
                  {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Hora fim</label>
                <select value={form.horaFim} onChange={e => setForm(f => ({ ...f, horaFim: e.target.value }))} className={inputClass}>
                  <option value="">—</option>
                  {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Responsável</label>
                <select value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} className={inputClass}>
                  <option value="">Sem responsável</option>
                  {(usuarios?.length > 0 ? usuarios.map((u: any) => u.nome) : RESPONSAVEIS).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Time</label>
                <select value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value as Time }))} className={inputClass}>
                  <option value="alta-renda">Alta Renda</option>
                  <option value="varejo">Varejo</option>
                  <option value="on-demand">On Demand</option>
                  <option value="b2c">B2C</option>
                  <option value="campinas">Campinas</option>
                  <option value="produtos">Produtos</option>
                  <option value="performance">Performance</option>
                  <option value="geral">Geral</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Projeto</label>
                <select value={form.projetoId} onChange={e => setForm(f => ({ ...f, projetoId: e.target.value }))} className={inputClass}>
                  <option value="">— Sem projeto —</option>
                  {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Tags (separadas por vírgula)</label>
              <input
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                className={inputClass}
                placeholder="follow-up, cliente, proposta..."
              />
            </div>

            {/* Subitens / Checklist */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className={cn(labelClass, 'mb-0')}>
                  Subitens {checklist.length > 0 && <span className="normal-case font-normal text-slate-400">({concluidos}/{checklist.length} · {pct}%)</span>}
                </label>
              </div>

              {/* Barra de progresso */}
              {checklist.length > 0 && (
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}

              {/* Lista de itens */}
              <div className="space-y-1.5">
                {checklist.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <GripVertical size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                    <input
                      type="checkbox"
                      checked={item.concluido}
                      onChange={() => toggleCheckItem(item.id)}
                      className="accent-indigo-600 flex-shrink-0"
                    />
                    <input
                      value={item.texto}
                      onChange={e => setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, texto: e.target.value } : c))}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); novoItemRef.current?.focus() }
                      }}
                      className={cn(
                        'flex-1 bg-transparent border-none outline-none text-sm py-0.5 px-1 rounded',
                        'text-slate-800 dark:text-slate-100',
                        'hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-slate-50 dark:focus:bg-slate-800',
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

              {/* Adicionar item */}
              <div className="flex items-center gap-2">
                <Plus size={13} className="text-slate-400 flex-shrink-0" />
                <input
                  ref={novoItemRef}
                  value={novoItem}
                  onChange={e => setNovoItem(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCheckItem() } }}
                  placeholder="Adicionar subitem..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-600 dark:text-slate-400 placeholder:text-slate-300 dark:placeholder:text-slate-600 py-0.5"
                />
                {novoItem.trim() && (
                  <button
                    type="button"
                    onClick={addCheckItem}
                    className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-xs hover:bg-indigo-700"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
              </Dialog.Close>
              <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                {isEdit ? 'Salvar alterações' : 'Criar tarefa'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
