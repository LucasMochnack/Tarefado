import { Tarefa, Projeto } from '@/types'

/** Todos os projetos a que a tarefa pertence (principal + extras), sem vazios/repetidos. */
export function projetosDaTarefa(t: Tarefa): string[] {
  const arr = [t.projetoId, ...(t.projetosExtra ?? [])].filter(Boolean)
  return Array.from(new Set(arr))
}

/** A tarefa pertence a este projeto? (principal OU um dos extras) */
export function tarefaNoProjeto(t: Tarefa, projetoId: string): boolean {
  return t.projetoId === projetoId || (t.projetosExtra?.includes(projetoId) ?? false)
}

/**
 * Aplica o filtro de projeto às tarefas.
 * - `permitidos` (null = sem restrição): limita ao que o usuário pode ver.
 * - Com um projeto selecionado: tarefas que pertencem a ele (principal ou extra).
 * - Em "Todos os projetos": esconde projetos `ocultarEmTodos` e, se restrito,
 *   mostra a tarefa se ela tiver ao menos um projeto visível E permitido.
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
    return tarefas.filter(t => tarefaNoProjeto(t, projetoSelecionado))
  }
  const ocultos = new Set(projetos.filter(p => p.ocultarEmTodos).map(p => p.id))
  return tarefas.filter(t => {
    const ps = projetosDaTarefa(t)
    const conjunto = ps.length ? ps : ['']   // tarefa sem projeto = trata como ''
    return conjunto.some(pid => !ocultos.has(pid) && podeVer(pid))
  })
}
