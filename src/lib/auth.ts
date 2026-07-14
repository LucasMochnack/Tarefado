import { supabase } from './supabase'
import { useStore } from '@/store/useStore'

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

/** Inicializa a auth: aplica a sessão atual e escuta mudanças. */
export function iniciarAuth() {
  if (!supabase) {
    useStore.getState().aplicarSessao(null)
    return
  }
  supabase.auth.getSession().then(({ data }) => {
    useStore.getState().aplicarSessao(data.session?.user?.email ?? null)
  })
  supabase.auth.onAuthStateChange((_event, session) => {
    useStore.getState().aplicarSessao(session?.user?.email ?? null)
  })
}
