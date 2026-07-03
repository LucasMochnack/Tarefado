import { useState } from 'react'
import { CalendarRange, ChevronLeft, ChevronRight, Check, CircleDot } from 'lucide-react'
import { startOfWeek, addDays, addWeeks, isSameDay, isToday, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useStore } from '@/store/useStore'
import { Tarefa, StatusTarefa } from '@/types'
import { TaskDetailsDrawer } from '@/components/tasks/TaskDetailsDrawer'
import { usePermissoes } from '@/hooks/usePermissoes'
import { aplicarFiltroProjeto } from '@/utils/projetoFilter'
import { cn } from '@/lib/utils'

const DIAS_LABEL = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const STATUS_DOT: Record<StatusTarefa, string> = {
  'a-fazer': '#94a2b4',
  'em-andamento': '#3b82f6',
  'aguardando': '#f59e0b',
  'em-testes': '#a855f7',
  'concluido': '#22c55e',
}

const SEM_PROJETO = { nome: 'Sem projeto', cor: '#5d6b7d' }

export function Resumo() {
  const { tarefas: todasTarefas, projetos, projetoSelecionado } = useStore()
  const timesPermitidos = usePermissoes()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selected, setSelected] = useState<Tarefa | null>(null)

  const permitidas = timesPermitidos ? todasTarefas.filter(t => timesPermitidos.includes(t.time)) : todasTarefas
  const tarefas = aplicarFiltroProjeto(permitidas, projetos, projetoSelecionado)

  const projMap = (id: string) => projetos.find(p => p.id === id) ?? SEM_PROJETO

  const inicioSemana = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 })
  const dias = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i))
  const fimSemana = dias[6]

  const updDate = (t: Tarefa) => {
    const raw = t.ultimaAtualizacao || t.atualizadoEm
    try { return raw ? parseISO(raw) : null } catch { return null }
  }

  // Tarefas com atividade (última atualização) em cada dia da semana
  const tarefasDoDia = (dia: Date) =>
    tarefas.filter(t => { const d = updDate(t); return d && isSameDay(d, dia) })

  // Agrupa por projeto, concluídas primeiro
  const gruposDoDia = (dia: Date) => {
    const grupos = new Map<string, Tarefa[]>()
    for (const t of tarefasDoDia(dia)) {
      const key = t.projetoId || ''
      if (!grupos.has(key)) grupos.set(key, [])
      grupos.get(key)!.push(t)
    }
    return [...grupos.entries()]
      .map(([projId, ts]) => ({
        projId,
        info: projMap(projId),
        tarefas: ts.sort((a, b) => (a.status === 'concluido' ? -1 : 1) - (b.status === 'concluido' ? -1 : 1)),
      }))
      .sort((a, b) => a.info.nome.localeCompare(b.info.nome))
  }

  // Totais da semana
  const tarefasSemana = tarefas.filter(t => {
    const d = updDate(t)
    return d && d >= inicioSemana && d <= addDays(fimSemana, 1)
  })
  const totalAtividade = tarefasSemana.length
  const totalConcluidas = tarefasSemana.filter(t => t.status === 'concluido').length

  const labelSemana = weekOffset === 0
    ? 'Esta semana'
    : `${format(inicioSemana, "dd 'de' MMM", { locale: ptBR })} – ${format(fimSemana, "dd 'de' MMM", { locale: ptBR })}`

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarRange size={22} className="text-indigo-500" />
            Resumo da Semana
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            O que você avançou em cada dia, por projeto
          </p>
        </div>

        {/* Navegação de semana */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Semana anterior">
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 min-w-[150px] text-center">
              {labelSemana}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Próxima semana">
              <ChevronRight size={16} />
            </button>
          </div>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
              Hoje
            </button>
          )}
        </div>

        {/* Resumo numérico */}
        <div className="w-full flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <CircleDot size={14} className="text-indigo-500" />
            <strong className="font-semibold">{totalAtividade}</strong> tarefa{totalAtividade !== 1 ? 's' : ''} com atividade
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Check size={14} />
            <strong className="font-semibold">{totalConcluidas}</strong> concluída{totalConcluidas !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Colunas por dia */}
      <div className="flex-1 overflow-x-auto p-6 min-h-0">
        <div className="flex gap-3 h-full min-h-0">
          {dias.map((dia, i) => {
            const grupos = gruposDoDia(dia)
            const totalDia = grupos.reduce((s, g) => s + g.tarefas.length, 0)
            const hoje = isToday(dia)
            return (
              <div
                key={i}
                className={cn(
                  'flex-1 min-w-[180px] flex flex-col rounded-xl border',
                  hoje
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                )}
              >
                {/* Cabeçalho do dia */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn('text-sm font-bold', hoje ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200')}>
                      {DIAS_LABEL[i]}
                    </span>
                    <span className="text-[11px] text-slate-400">{format(dia, 'dd/MM')}</span>
                  </div>
                  {totalDia > 0 && (
                    <span className="text-[11px] font-semibold text-slate-400 bg-white dark:bg-slate-800 rounded-full px-1.5 py-0.5 min-w-5 text-center">
                      {totalDia}
                    </span>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-y-auto p-2 space-y-3 min-h-0">
                  {grupos.length === 0 && (
                    <p className="text-[11px] text-slate-300 dark:text-slate-600 italic text-center pt-6">Sem atividade</p>
                  )}
                  {grupos.map(g => (
                    <div key={g.projId || 'sem'}>
                      {/* Sub-cabeçalho do projeto */}
                      <div className="flex items-center gap-1.5 mb-1.5 px-1">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: g.info.cor }} />
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate uppercase tracking-wide">
                          {g.info.nome}
                        </span>
                      </div>
                      {/* Tarefas do projeto naquele dia */}
                      <div className="space-y-1">
                        {g.tarefas.map(t => {
                          const done = t.status === 'concluido'
                          return (
                            <button
                              key={t.id}
                              onClick={() => setSelected(t)}
                              className={cn(
                                'w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-lg border transition-all hover:shadow-sm',
                                done
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                                  : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                              )}
                            >
                              {done ? (
                                <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check size={10} className="text-white" strokeWidth={3} />
                                </span>
                              ) : (
                                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: STATUS_DOT[t.status] }} />
                              )}
                              <span className={cn('text-xs leading-snug', done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200')}>
                                {t.titulo}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <TaskDetailsDrawer tarefa={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
