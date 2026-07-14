import { useStore } from '@/store/useStore'

/**
 * Projetos que o usuário logado pode ver.
 * - null  → sem restrição (vê todos os projetos)
 * - id[]  → só pode ver esses projetos
 *
 * Admin vê tudo. Sem perfil ou sem lista definida = vê tudo.
 */
export function useProjetosPermitidos(): string[] | null {
  const { usuarios, usuarioEmail } = useStore()
  const u = usuarios.find(x => x.email.toLowerCase() === usuarioEmail.toLowerCase())
  if (!u || u.admin) return null
  if (!u.projetosPermitidos || u.projetosPermitidos.length === 0) return null
  return u.projetosPermitidos
}
