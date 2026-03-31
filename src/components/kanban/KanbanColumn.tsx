import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Tarefa, StatusTarefa } from '@/types'
import { KanbanCard } from './KanbanCard'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'

interface KanbanColumnProps {
  id: StatusTarefa
  label: string
  color: string
  tarefas: Tarefa[]
  onCardClick: (t: Tarefa) => void
}

export function KanbanColumn({ id, label, color, tarefas, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const [addOpen, setAddOpen] = useState(false)

  return (
    <>
      <div className={cn(
        'flex flex-col rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 transition-all duration-200 flex-shrink-0',
        'w-72 xl:w-80',
        isOver && 'ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900 bg-indigo-50/50 dark:bg-indigo-950/20'
      )}>
        {/* Column header */}
        <div className="flex items-center justify-between p-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', color)} />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded-full min-w-5 text-center">
              {tarefas.length}
            </span>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            title="Nova tarefa nesta coluna"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Cards */}
        <div
          ref={setNodeRef}
          className="flex-1 overflow-y-auto p-2 space-y-2 min-h-32"
        >
          <SortableContext items={tarefas.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tarefas.map(tarefa => (
              <KanbanCard key={tarefa.id} tarefa={tarefa} onClick={onCardClick} />
            ))}
          </SortableContext>

          {tarefas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center mb-2 opacity-60">
                <div className={cn('w-4 h-4 rounded-full', color, 'opacity-50')} />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Nenhuma tarefa</p>
              <button onClick={() => setAddOpen(true)} className="mt-2 text-xs text-indigo-500 hover:underline">
                Adicionar
              </button>
            </div>
          )}
        </div>
      </div>

      <TaskFormModal open={addOpen} onOpenChange={setAddOpen} defaultStatus={id} />
    </>
  )
}
