import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Tarefa } from '@/types'
import { useStore } from '@/store/useStore'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { TimeBadge } from '@/components/shared/TimeBadge'
import { isOverdue, prazoLabel } from '@/utils/dates'
import { Calendar, MessageSquare, CheckSquare, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserAvatarPicker } from '@/components/shared/UserAvatarPicker'

// Accent color per team — signature left bar on each card (from the design tokens)
const TEAM_ACCENT: Record<string, string> = {
  'performance': '#e8849f',
  'on-demand': '#2fc89a',
  'alta-renda': '#a98cf0',
  'varejo': '#46b6da',
  'b2c': '#d39a3f',
  'campinas': '#2ec8b6',
  'produtos': '#d77fd0',
  'geral': '#5d6b7d',
}

interface KanbanCardProps {
  tarefa: Tarefa
  onClick: (t: Tarefa) => void
  isDragging?: boolean
}

export function KanbanCard({ tarefa, onClick, isDragging }: KanbanCardProps) {
  const projeto = useStore(s => s.projetos.find(p => p.id === tarefa.projetoId))
  const overdue = isOverdue(tarefa.prazo) && tarefa.status !== 'concluido'
  const checkDone = tarefa.checklist.filter(c => c.concluido).length
  // Cor da barra: do projeto (mais relevante) ou, sem projeto, do time
  const accent = projeto?.cor ?? TEAM_ACCENT[tarefa.time] ?? TEAM_ACCENT.geral

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({ id: tarefa.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(tarefa)}
      className={cn(
        'relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl border p-3.5 pl-4 cursor-pointer',
        'hover:shadow-card hover:-translate-y-0.5 transition-all duration-200',
        'select-none group',
        overdue
          ? 'border-red-200 dark:border-red-900/50 hover:border-red-300'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-xl rotate-1 scale-105'
      )}
    >
      {/* Barra de acento — cor do projeto (ou do time, se sem projeto) */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: accent }}
      />

      {/* Priority + avatar */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <PriorityBadge nivel={tarefa.nivelPrioridade} size="xs" />
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {overdue && (
            <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
              <AlertCircle size={11} />
              {prazoLabel(tarefa.prazo, tarefa.status)}
            </span>
          )}
          <UserAvatarPicker tarefaId={tarefa.id} responsavel={tarefa.responsavel} size="md" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-2 line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
        {tarefa.titulo}
      </h3>

      {/* Projeto */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
          {projeto ? projeto.nome : 'Sem projeto'}
        </span>
      </div>

      {/* Tags */}
      {tarefa.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {tarefa.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <TimeBadge time={tarefa.time} />
        </div>
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
          {tarefa.comentarios.length > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <MessageSquare size={11} />
              {tarefa.comentarios.length}
            </span>
          )}
          {tarefa.checklist.length > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <CheckSquare size={11} />
              {checkDone}/{tarefa.checklist.length}
            </span>
          )}
          {!overdue && (
            <span className={cn('flex items-center gap-1 text-xs', tarefa.prazo && 'text-slate-400')}>
              <Calendar size={11} />
              {prazoLabel(tarefa.prazo, tarefa.status)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
