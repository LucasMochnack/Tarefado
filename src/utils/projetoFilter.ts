import { Tarefa, Projeto } from '@/types'

/**
 * Aplica o filtro de projeto às tarefas.
 * - Com um projeto selecionado: mostra apenas as tarefas dele (mesmo que seja oculto).
 * - Em "Todos os projetos" (null): esconde tarefas de projetos marcados como `ocultarEmTodos`
 *   (ex.: "Pessoais").
 */
export function aplicarFiltroProjeto(
  tarefas: Tarefa[],
  projetos: Projeto[],
  projetoSelecionado: string | null
): Tarefa[] {
  if (projetoSelecionado) {
    return tarefas.filter(t => t.projetoId === projetoSelecionado)
  }
  const ocultos = new Set(projetos.filter(p => p.ocultarEmTodos).map(p => p.id))
  return tarefas.filter(t => !ocultos.has(t.projetoId))
}
