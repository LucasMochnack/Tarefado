import { supabase } from './supabase'
import { useStore } from '@/store/useStore'
import { iniciarSync, pararSync } from './cloudSync'

/** Entrar com e-mail + senha (Supabase Auth). */
export async function entrar(email: string, senha: string) {
  if (!supabase) throw new Error('Nuvem não configurada')
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha })
  if (error) throw error
}

/** Criar conta com e-mail + senha. Retorna se ainda precisa confirmar o e-mail. */
export async function criarConta(email: string, senha: string): Promise<{ precisaConfirmar: boolean }> {
  if (!supabase) throw new Error('Nuvem não configurada')
  const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password: senha })
  if (error) throw error
  return { precisaConfirmar: !data.session }
}

/** Sair. */
export async function sair() {
  if (supabase) await supabase.auth.signOut()
  else useStore.getState().aplicarSessao(null)
}

/**
 * Inicializa a auth. O ciclo de vida do sync é amarrado à SESSÃO:
 * - login (SIGNED_IN / INITIAL_SESSION com sessão)  → iniciarSync (pull limpo)
 * - logout (SIGNED_OUT)                              → pararSync (teardown + limpa dados)
 */
export function iniciarAuth() {
  if (!supabase) {
    useStore.getState().aplicarSessao(null)
    return
  }
  supabase.auth.onAuthStateChange((event, session) => {
    const email = session?.user?.email ?? null
    useStore.getState().aplicarSessao(email)
    if (email && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
      iniciarSync().catch(err => console.error('[auth] iniciarSync', err))
    } else if (event === 'SIGNED_OUT') {
      pararSync().catch(err => console.error('[auth] pararSync', err))
    }
  })
}
