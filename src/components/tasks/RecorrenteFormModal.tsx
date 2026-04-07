import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { TarefaRecorrente, TipoRecorrencia, DiaSemana, NivelPrioridade, Time } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const DIAS: { value: DiaSemana; label: string; short: string }[] = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
]

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

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  recorrente?: TarefaRecorrente
}

export function RecorrenteFormModal({ open, onOpenChange, recorrente }: Props) {
  const { addTarefaRecorrente, updateTarefaRecorrente, projetos, usuarios } = useStore()

  const [titulo, setTitulo] = useState(recorrente?.titulo ?? '')
  const [descricao, setDescricao] = useState(recorrente?.descricao ?? '')
  const [prioridade, setPrioridade] = useState<NivelPrioridade>(recorrente?.prioridade ?? 'media')
  const [time, setTime] = useState<Time>(recorrente?.time ?? 'geral')
  const [responsavel, setResponsavel] = useState(recorrente?.responsavel ?? '')
  const [projetoId, setProjetoId] = useState(recorrente?.projetoId ?? '')
  const [tipoRecorrencia, setTipoRecorrencia] = useState<TipoRecorrencia>(recorrente?.tipoRecorrencia ?? 'semanal')
  const [diasSemana, setDiasSemana] = useState<DiaSemana[]>(recorrente?.diasSemana ?? [1])
  const [diaMes, setDiaMes] = useState(recorrente?.diaMes ?? 1)
  const [horaAgenda, setHoraAgenda] = useState(recorrente?.horaAgenda ?? '')
  const [ativa, setAtiva] = useState(recorrente?.ativa ?? true)

  const toggleDia = (dia: DiaSemana) => {
    setDiasSemana(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) { toast.error('Informe o título'); return }
    if (tipoRecorrencia === 'semanal' && diasSemana.length === 0) { toast.error('Selecione ao menos um dia'); return }

    const dados = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      prioridade,
      time,
      responsavel,
      projetoId,
      tags: [],
      tipoRecorrencia,
      diasSemana,
      diaMes,
      horaAgenda: horaAgenda || undefined,
      ativa,
    }

    if (recorrente) {
      updateTarefaRecorrente(recorrente.id, dados)
      toast.success('Tarefa recorrente atualizada!')
    } else {
      addTarefaRecorrente(dados)
      toast.success('Tarefa recorrente criada!')
    }
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="font-bold text-slate-900 dark:text-white text-lg">
              {recorrente ? 'Editar tarefa recorrente' : 'Nova tarefa recorrente'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Título *">
              <input
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Reunião semanal de alinhamento"
                className={inputCls}
              />
            </Field>

            <Field label="Descrição">
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                rows={2}
                className={cn(inputCls, 'resize-none')}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Prioridade">
                <select value={prioridade} onChange={e => setPrioridade(e.target.value as NivelPrioridade)} className={inputCls}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </Field>
              <Field label="Time">
                <select value={time} onChange={e => setTime(e.target.value as Time)} className={inputCls}>
                  {TIMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Responsável">
                <input
                  value={responsavel}
                  onChange={e => setResponsavel(e.target.value)}
                  list="responsaveis-rec"
                  placeholder="Nome do responsável"
                  className={inputCls}
                />
                <datalist id="responsaveis-rec">
                  {usuarios?.map((u: any) => <option key={u.id} value={u.nome} />)}
                </datalist>
              </Field>
              <Field label="Projeto">
                <select value={projetoId} onChange={e => setProjetoId(e.target.value)} className={inputCls}>
                  <option value="">— Sem projeto —</option>
                  {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Horário (opcional)">
              <input type="time" value={horaAgenda} onChange={e => setHoraAgenda(e.target.value)} className={inputCls} />
            </Field>

            {/* Recorrência */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recorrência</p>
              <div className="flex gap-2">
                {(['diaria', 'semanal', 'mensal'] as TipoRecorrencia[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipoRecorrencia(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      tipoRecorrencia === t
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    {t === 'diaria' ? 'Diária' : t === 'semanal' ? 'Semanal' : 'Mensal'}
                  </button>
                ))}
              </div>

              {tipoRecorrencia === 'semanal' && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Dias da semana:</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {DIAS.map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDia(d.value)}
                        className={cn(
                          'w-10 h-10 rounded-lg text-xs font-semibold transition-colors',
                          diasSemana.includes(d.value)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                        )}
                      >
                        {d.short}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tipoRecorrencia === 'mensal' && (
                <Field label="Dia do mês">
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={diaMes}
                    onChange={e => setDiaMes(Number(e.target.value))}
                    className={cn(inputCls, 'w-24')}
                  />
                  <p className="text-xs text-slate-400 mt-1">Máximo dia 28 para garantir todos os meses</p>
                </Field>
              )}
            </div>

            {/* Ativa */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setAtiva(v => !v)}
                className={cn(
                  'relative w-10 h-5 rounded-full transition-colors',
                  ativa ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                )}
              >
                <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all', ativa ? 'left-5' : 'left-0.5')} />
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300">Ativa</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300">
                  Cancelar
                </button>
              </Dialog.Close>
              <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">
                {recorrente ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const inputCls = 'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      {children}
    </div>
  )
}
