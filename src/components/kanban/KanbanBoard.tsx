import { useState } from 'react'
import {
  DndContext, DragEndEvent, DragStartEvent, CollisionDetection,
  DragOverlay, pointerWithin, closestCorners, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import { useStore } from '@/store/useStore'
import { Tarefa, StatusTarefa, FiltrosTarefa } from '@/types'
import { usePermissoes } from '@/hooks/usePermissoes'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { TaskDetailsDrawer } from '@/components/tasks/TaskDetailsDrawer'
import { isOverdue, daysSinceUpdate } from '@/utils/dates'
import { aplicarFiltroProjeto } from '@/utils/projetoFilter'
import toast from 'react-hot-toast'

const COLUNAS: { id: StatusTarefa; label: string; color: string }[] = [
  { id: 'a-fazer', label: 'A Fazer', color: 'bg-slate-500' },
  { id: 'em-andamento', label: 'Em Andamento', color: 'bg-blue-500' },
  { id: 'aguardando', label: 'Aguardando', color: 'bg-amber-500' },
  { id: 'concluido', label: 'Concluído', color: 'bg-emerald-500' },
]

// Ordem de criticidade (menor = mais crítico, vai pro topo)
const CRIT_RANK: Record<string, number> = { critica: 0, alta: 1, media: 2, baixa: 3 }

const COLUNA_IDS = new Set<string>(COLUNAS.map(c => c.id))

// Detecção robusta: prioriza o que está sob o ponteiro; se nada, pega a coluna
// mais próxima (closestCorners nunca volta vazio) — garante que o drop "sempre vai".
const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args)
  return pointer.length > 0 ? pointer : closestCorners(args)
}

interface KanbanBoardProps {
  filtros: FiltrosTarefa
}

export function KanbanBoard({ filtros }: KanbanBoardProps) {
  const { tarefas: todasTarefas, projetos, moveTarefa, projetoSelecionado } = useStore()
  const timesPermitidos = usePermissoes()
  const permitidas = timesPermitidos ? todasTarefas.filter(t => timesPermitidos.includes(t.time)) : todasTarefas
  const tarefas = aplicarFiltroProjeto(permitidas, projetos, projetoSelecionado)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
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

  // Move só ao SOLTAR (sem mexer no status durante o arraste — mais estável)
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return

    const tarefaId = active.id as string
    const overId = over.id as string

    const sourceTarefa = tarefas.find(t => t.id === tarefaId)
    if (!sourceTarefa) return

    // Descobre a coluna de destino: o "over" pode ser a coluna OU um card dela
    let destino: StatusTarefa | null = null
    if (COLUNA_IDS.has(overId)) {
      destino = overId as StatusTarefa
    } else {
      const targetTarefa = tarefas.find(t => t.id === overId)
      if (targetTarefa) destino = targetTarefa.status
    }
    if (!destino || destino === sourceTarefa.status) return

    moveTarefa(tarefaId, destino)
    toast.success(`Movida para "${COLUNAS.find(c => c.id === destino)?.label}"`)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full min-h-0">
          {COLUNAS.map(coluna => {
            const tarefasColuna = filteredTarefas
              .filter(t => t.status === coluna.id)
              // Ordena por criticidade (mais crítica no topo), desempata pelo score
              .sort((a, b) => {
                const ra = CRIT_RANK[a.nivelPrioridade] ?? 9
                const rb = CRIT_RANK[b.nivelPrioridade] ?? 9
                if (ra !== rb) return ra - rb
                return b.scorePrioridade - a.scorePrioridade
              })
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
