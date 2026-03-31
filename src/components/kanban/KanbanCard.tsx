import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Tarefa } from '@/types'
import { useStore } from '@/store/useStore'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { TimeBadge } from '@/components/shared/TimeBadge'
import { isOverdue, prazoLabel } from '@/utils/dates'
import { Calendar, User, MessageSquare, CheckSquare, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
  tarefa: Tarefa
  onClick: (t: Tarefa) => void
  isDragging?: boolean
}

export function KanbanCard({ tarefa, onClick, isDragging }: KanbanCardProps) {
  const projetos = useStore(s => s.projetos)
  const projeto = projetos.find(p => p.id === tarefa.projetoId)
  const overdue = isOverdue(tarefa.prazo) && tarefa.status !== 'concluido'
  const checkDone = tarefa.checklist.filter(c => c.concluido).length

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
        'bg-white dark:bg-slate-900 rounded-xl border p-3.5 cursor-pointer',
        'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
        'select-none group',
        overdue
          ? 'border-red-200 dark:border-red-900/50 hover:border-red-300'
          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-xl rotate-1 scale-105'
      )}
    >
      {/* Priority + overdue indicator */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <PriorityBadge nivel={tarefa.nivelPrioridade} size="xs" />
        {overdue && (
          <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
            <AlertCircle size={11} />
            {prazoLabel(tarefa.prazo, tarefa.status)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-2 line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
        {tarefa.titulo}
      </h3>

      {/* Project */}
      {projeto && (
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: projeto.cor }} />
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{projeto.nome}</span>
        </div>
      )}

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
          {tarefa.responsavel && (
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {tarefa.responsavel.charAt(0)}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden xl:block">
                {tarefa.responsavel.split(' ')[0]}
              </span>
            </div>
          )}
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
