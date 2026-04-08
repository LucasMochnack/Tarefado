import { useStore } from '@/store/useStore'
import { Time } from '@/types'

/**
 * Retorna os times que o usuário logado pode visualizar.
 * - null → sem restrição (vê tudo)
 * - Time[] → só pode ver tarefas desses times
 *
 * Regra: usuário com 'performance' no seu time vê tudo.
 * Admin também vê tudo.
 */
export function usePermissoes(): Time[] | null {
  const { usuarios, usuarioEmail } = useStore()
  const usuario = usuarios.find(u => u.email.toLowerCase() === usuarioEmail.toLowerCase())

  if (!usuario) return null
  if (usuario.admin) return null
  if (!usuario.times || usuario.times.length === 0) return null
  if (usuario.times.includes('performance')) return null

  return usuario.times as Time[]
}
