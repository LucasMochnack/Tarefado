import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Projeto, QuadranteEisenhower } from '@/types'
import { ProjectFormModal } from '@/components/projects/ProjectFormModal'
import { VoiceInputButton } from '@/components/shared/VoiceInputButton'
import { formatDate, isOverdue } from '@/utils/dates'
import { cn } from '@/lib/utils'

const QUADRANTES: { id: QuadranteEisenhower; label: string; sub: string; color: string; bg: string; border: string }[] = [
  {
    id: 'importante-urgente',
    label: 'Fazer Agora',
    sub: 'Importante + Urgente',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-900/40',
  },
  {
    id: 'importante-nao-urgente',
    label: 'Agendar',
    sub: 'Importante + Não Urgente',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-900/40',
  },
  {
    id: 'nao-importante-urgente',
    label: 'Delegar',
    sub: 'Não Importante + Urgente',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-900/40',
  },
  {
    id: 'nao-importante-nao-urgente',
    label: 'Eliminar',
    sub: 'Não Importante + Não Urgente',
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800/30',
    border: 'border-slate-200 dark:border-slate-700',
  },
]

export function Projetos() {
  const { projetos, tarefas } = useStore()
  const navigate = useNavigate()
  const [projectOpen, setProjectOpen] = useState(false)

  const tarefasPorProjeto = (projetoId: string) => tarefas.filter(t => t.projetoId === projetoId)

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Matriz de Eisenhower</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Priorize seus projetos pela matriz de urgência e importância</p>
        </div>
        <div className="flex items-center gap-2">
          <VoiceInputButton size="sm" />
          <button
            onClick={() => setProjectOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Novo Projeto
          </button>
        </div>
      </div>

      {/* Axis labels */}
      <div className="grid grid-cols-2 gap-1 text-xs text-center">
        <div className="col-span-1 py-1 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg font-semibold">⚡ URGENTE</div>
        <div className="col-span-1 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-semibold">🕐 NÃO URGENTE</div>
      </div>

      {/* 2x2 Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {QUADRANTES.map(q => {
          const qProjetos = projetos.filter(p => p.quadranteEisenhower === q.id)
          return (
            <div key={q.id} className={cn('rounded-xl border p-5', q.bg, q.border)}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className={cn('text-xs font-bold uppercase tracking-wider', q.color)}>{q.label}</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{q.sub}</p>
                </div>
                <span className="text-xs bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  {qProjetos.length} projeto{qProjetos.length !== 1 ? 's' : ''}
                </span>
              </div>

              {qProjetos.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  Nenhum projeto neste quadrante
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {qProjetos.map(p => {
                    const tt = tarefasPorProjeto(p.id)
                    const concluidas = tt.filter(t => t.status === 'concluido').length
                    const pendentes = tt.filter(t => t.status !== 'concluido').length
                    const overdue = isOverdue(p.prazoFinal)
                    return (
                      <div
                        key={p.id}
                        onClick={() => navigate(`/projetos/${p.id}`)}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.cor }} />
                            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                              {p.nome}
                            </h3>
                          </div>
                          <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-0.5" />
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{p.descricao}</p>

                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Progresso</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.progresso}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${p.progresso}%`, backgroundColor: p.cor }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                              <Clock size={11} /> {pendentes} pend.
                            </span>
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={11} /> {concluidas} ok
                            </span>
                          </div>
                          <span className={cn('flex items-center gap-1', overdue ? 'text-red-500' : 'text-slate-400 dark:text-slate-500')}>
                            <Calendar size={11} />
                            {overdue ? 'Atrasado' : formatDate(p.prazoFinal)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <StatusProjetoBadge status={p.status} />
                          <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{p.time}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ProjectFormModal open={projectOpen} onOpenChange={setProjectOpen} />
    </div>
  )
}

function StatusProjetoBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ativo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    pausado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    concluido: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    atrasado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', map[status] || map.ativo)}>
      {status}
    </span>
  )
}
