import { Tarefa, Projeto } from '@/types'

/**
 * Aplica o filtro de projeto às tarefas.
 * - `permitidos` (null = sem restrição): limita ao que o usuário pode ver.
 * - Com um projeto selecionado: só as tarefas dele (se permitido).
 * - Em "Todos os projetos": esconde projetos `ocultarEmTodos` e, se restrito,
 *   mostra apenas os projetos permitidos.
 */
export function aplicarFiltroProjeto(
  tarefas: Tarefa[],
  projetos: Projeto[],
  projetoSelecionado: string | null,
  permitidos: string[] | null = null,
): Tarefa[] {
  const podeVer = (projId: string) => !permitidos || permitidos.includes(projId)

  if (projetoSelecionado) {
    if (!podeVer(projetoSelecionado)) return []
    return tarefas.filter(t => t.projetoId === projetoSelecionado)
  }
  const ocultos = new Set(projetos.filter(p => p.ocultarEmTodos).map(p => p.id))
  return tarefas.filter(t => !ocultos.has(t.projetoId) && podeVer(t.projetoId))
}
