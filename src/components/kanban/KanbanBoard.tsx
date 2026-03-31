import { useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  DragOverlay, closestCorners, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useStore } from '@/store/useStore'
import { Tarefa, StatusTarefa, FiltrosTarefa } from '@/types'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { TaskDetailsDrawer } from '@/components/tasks/TaskDetailsDrawer'
import { isOverdue, daysSinceUpdate } from '@/utils/dates'
import toast from 'react-hot-toast'

const COLUNAS: { id: StatusTarefa; label: string; color: string }[] = [
  { id: 'a-fazer', label: 'A Fazer', color: 'bg-slate-500' },
  { id: 'em-andamento', label: 'Em Andamento', color: 'bg-blue-500' },
  { id: 'aguardando', label: 'Aguardando', color: 'bg-amber-500' },
  { id: 'concluido', label: 'Concluído', color: 'bg-emerald-500' },
]

interface KanbanBoardProps {
  filtros: FiltrosTarefa
}

export function KanbanBoard({ filtros }: KanbanBoardProps) {
  const { tarefas, moveTarefa } = useStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const filteredTarefas = tarefas.filter(t => {
    if (filtros.projeto && t.projetoId !== filtros.projeto) return false
    if (filtros.time && t.time !== filtros.time) return false
    if (filtros.status && t.status !== filtros.status) return false
    if (filtros.prioridade && t.nivelPrioridade !== filtros.prioridade) return false
    if (filtros.responsavel && t.responsavel !== filtros.responsavel) return false
    if (filtros.somenteAtrasadas && (!isOverdue(t.prazo) || t.status === 'concluido')) return false
    if (filtros.somenteParadas && daysSinceUpdate(t.ultimaAtualizacao) < 7) return false
    if (filtros.semResponsavel && !!t.responsavel) return false
    if (filtros.busca) {
      const q = filtros.busca.toLowerCase()
      if (!t.titulo.toLowerCase().includes(q) && !t.descricao.toLowerCase().includes(q)) return false
    }
    return true
  })

  const activeTarefa = tarefas.find(t => t.id === activeId)

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return

    const tarefaId = active.id as string
    const overId = over.id as string

    // Check if dropped over a column
    const coluna = COLUNAS.find(c => c.id === overId)
    if (coluna) {
      const tarefa = tarefas.find(t => t.id === tarefaId)
      if (tarefa && tarefa.status !== coluna.id) {
        moveTarefa(tarefaId, coluna.id)
        toast.success(`Movida para "${coluna.label}"`)
      }
      return
    }

    // Dropped over another card — find its column
    const targetTarefa = tarefas.find(t => t.id === overId)
    if (targetTarefa) {
      const sourceTarefa = tarefas.find(t => t.id === tarefaId)
      if (sourceTarefa && sourceTarefa.status !== targetTarefa.status) {
        moveTarefa(tarefaId, targetTarefa.status)
        toast.success(`Movida para "${COLUNAS.find(c => c.id === targetTarefa.status)?.label}"`)
      }
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full min-h-0">
          {COLUNAS.map(coluna => {
            const tarefasColuna = filteredTarefas.filter(t => t.status === coluna.id)
            return (
              <KanbanColumn
                key={coluna.id}
                id={coluna.id}
                label={coluna.label}
                color={coluna.color}
                tarefas={tarefasColuna}
                onCardClick={t => setSelectedTarefa(t)}
              />
            )
          })}
        </div>
        <DragOverlay>
          {activeTarefa ? (
            <KanbanCard tarefa={activeTarefa} onClick={() => {}} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailsDrawer tarefa={selectedTarefa} onClose={() => setSelectedTarefa(null)} />
    </>
  )
}
