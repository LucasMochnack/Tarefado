import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useStore } from '@/store/useStore'

// Mapeia a chave do estado (store) para o nome da tabela no Supabase
const TABELAS = {
  tarefas: 'tarefas',
  projetos: 'projetos',
  tarefasRecorrentes: 'tarefas_recorrentes',
  usuarios: 'usuarios',
  anotacoes: 'anotacoes',
} as const

type StoreKey = keyof typeof TABELAS
type Item = { id: string } & Record<string, unknown>
const CHAVES = Object.keys(TABELAS) as StoreKey[]

// Serialização canônica (chaves ordenadas) — estável mesmo com a reordenação do JSONB
function stable(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']'
  const o = v as Record<string, unknown>
  return '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + stable(o[k])).join(',') + '}'
}

// Último estado sincronizado (id -> JSON canônico) para calcular diffs / suprimir eco
const snapshot: Record<StoreKey, Map<string, string>> = {
  tarefas: new Map(), projetos: new Map(), tarefasRecorrentes: new Map(), usuarios: new Map(),
  anotacoes: new Map(),
}

// Tabela ainda não criada no Supabase → degrada pra local em vez de quebrar o sync
function tabelaInexistente(error: any): boolean {
  const s = `${error?.code || ''} ${error?.message || ''}`.toLowerCase()
  return s.includes('42p01') || s.includes('pgrst205')
    || s.includes('does not exist') || s.includes('could not find the table')
}

let iniciado = false
let puxando = false
let sincronizadoOk = false           // só empurra depois de um pull bem-sucedido
let canal: RealtimeChannel | null = null
let unsubStore: (() => void) | null = null

function itensDoEstado(key: StoreKey): Item[] {
  return (useStore.getState() as any)[key] as Item[]
}
function setSnapshot(key: StoreKey, itens: Item[]) {
  const m = new Map<string, string>()
  for (const it of itens) m.set(it.id, stable(it))
  snapshot[key] = m
}

/** Busca tudo da nuvem e popula o store (nuvem = fonte da verdade). */
export async function puxarDaNuvem(): Promise<{ vazio: boolean }> {
  if (!supabase) return { vazio: true }
  puxando = true
  try {
    const resultados = await Promise.all(CHAVES.map(k => supabase!.from(TABELAS[k]).select('data')))
    let total = 0
    const patch: Partial<Record<StoreKey, Item[]>> = {}
    const okKeys: StoreKey[] = []
    CHAVES.forEach((k, i) => {
      const { data, error } = resultados[i]
      if (error) {
        // Tabela ainda não existe → ignora essa (mantém local); outros erros sobem
        if (tabelaInexistente(error)) {
          console.warn(`[cloudSync] tabela "${TABELAS[k]}" ausente no Supabase — usando só local`)
          return
        }
        throw error
      }
      const itens = (data ?? []).map((r: any) => r.data as Item)
      total += itens.length
      patch[k] = itens
      okKeys.push(k)
    })
    // Só sobrescreve o local se a nuvem tem algo (evita apagar o local na 1ª migração).
    // Tabelas ausentes ficam fora do patch e do snapshot — o local delas é preservado.
    if (total > 0) useStore.setState(patch as any)
    okKeys.forEach(k => setSnapshot(k, patch[k] ?? []))
    return { vazio: total === 0 }
  } finally {
    puxando = false
  }
}

async function upsert(key: StoreKey, item: Item) {
  if (!supabase) return
  await supabase.from(TABELAS[key]).upsert({ id: item.id, data: item, updated_at: new Date().toISOString() })
}
async function remover(key: StoreKey, id: string) {
  if (!supabase) return
  await supabase.from(TABELAS[key]).delete().eq('id', id)
}

/** Empurra o que mudou; atualiza o snapshot por-id (preserva o que o Realtime tocou). */
async function empurrarMudancas() {
  if (!supabase || puxando || !sincronizadoOk) return
  for (const key of CHAVES) {
    const itens = itensDoEstado(key)
    const ids = new Set<string>()
    const ops: Promise<unknown>[] = []
    for (const it of itens) {
      ids.add(it.id)
      const json = stable(it)
      if (snapshot[key].get(it.id) !== json) {
        ops.push(upsert(key, it).then(() => snapshot[key].set(it.id, json)))
      }
    }
    for (const id of [...snapshot[key].keys()]) {
      if (!ids.has(id)) ops.push(remover(key, id).then(() => snapshot[key].delete(id)))
    }
    if (ops.length) await Promise.allSettled(ops)
  }
}

// Mutex: nunca roda dois pushes ao mesmo tempo; re-executa se algo mudou durante
let empurrando = false
let repetir = false
async function empurrarSeguro() {
  if (empurrando) { repetir = true; return }
  empurrando = true
  try {
    do { repetir = false; await empurrarMudancas() } while (repetir)
  } catch (err) {
    console.error('[cloudSync] push', err)
  } finally {
    empurrando = false
  }
}

let debounce: ReturnType<typeof setTimeout> | null = null
function agendarPush() {
  if (!supabase || puxando || !sincronizadoOk) return
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => { empurrarSeguro() }, 700)
}

// ── Tempo real: aplica no store as mudanças vindas da nuvem ──
function aplicarRemoto(key: StoreKey, payload: any) {
  if (payload.eventType === 'DELETE') {
    const id = payload.old?.id
    if (!id || !snapshot[key].has(id)) return
    useStore.setState({ [key]: itensDoEstado(key).filter(i => i.id !== id) } as any)
    snapshot[key].delete(id)
    return
  }
  const item = payload.new?.data as Item | undefined
  if (!item?.id) return
  const json = stable(item)
  if (snapshot[key].get(item.id) === json) return // eco do nosso próprio write
  const atual = itensDoEstado(key)
  const existe = atual.some(i => i.id === item.id)
  useStore.setState({
    [key]: existe ? atual.map(i => (i.id === item.id ? item : i)) : [...atual, item],
  } as any)
  snapshot[key].set(item.id, json)
}

async function reconciliar() {
  if (!sincronizadoOk) return
  try { await puxarDaNuvem() } catch (err) { console.error('[cloudSync] reconciliar', err) }
}

async function iniciarRealtime() {
  if (!supabase || canal) return
  // Realtime com RLS exige o token da sessão para receber os eventos
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) supabase.realtime.setAuth(data.session.access_token)
  const ch = supabase.channel('tarefado-rt')
  CHAVES.forEach(key => {
    ch.on('postgres_changes', { event: '*', schema: 'public', table: TABELAS[key] }, p => {
      if (!puxando) aplicarRemoto(key, p)
    })
  })
  ch.subscribe(status => {
    // Ao (re)conectar, re-puxa para cobrir a janela pull↔subscribe e eventos perdidos offline
    if (status === 'SUBSCRIBED') reconciliar()
  })
  canal = ch
}

// Backfill quando a aba volta ao foco / reconecta a internet
const onWake = () => reconciliar()

/**
 * Liga a sincronização de UMA sessão: pull → (migra local se nuvem vazia) →
 * escuta mudanças do store e da nuvem. Chamada no login (SIGNED_IN/INITIAL_SESSION).
 */
export async function iniciarSync() {
  if (!supabase || iniciado) return
  iniciado = true
  try {
    await puxarDaNuvem()
    sincronizadoOk = true
    // pós-pull (sobre os dados da nuvem): garante o projeto Pessoais, gera recorrentes
    // do dia e garante o perfil de quem entrou (para o admin poder atribuir projetos).
    useStore.getState().garantirProjetosPadrao()
    useStore.getState().processarRecorrentes()
    const email = useStore.getState().usuarioEmail
    if (email) useStore.getState().garantirPerfilUsuario(email)
    // Push diff-based: sobe só o que difere do snapshot (perfil novo, Pessoais, etc.)
    await empurrarMudancas()
  } catch (err) {
    console.error('[cloudSync] pull inicial', err)
    iniciado = false           // pull falhou → não habilita push (evita sobrescrever a nuvem)
    return
  }
  unsubStore = useStore.subscribe(() => agendarPush())
  iniciarRealtime()
  window.addEventListener('focus', onWake)
  window.addEventListener('online', onWake)
}

/** Encerra a sincronização e limpa tudo (chamada no logout — evita vazar dados entre contas). */
export async function pararSync() {
  if (debounce) { clearTimeout(debounce); debounce = null }
  if (unsubStore) { unsubStore(); unsubStore = null }
  window.removeEventListener('focus', onWake)
  window.removeEventListener('online', onWake)
  if (canal && supabase) { try { await supabase.removeChannel(canal) } catch { /* ok */ } }
  canal = null
  CHAVES.forEach(k => snapshot[k].clear())
  iniciado = false
  sincronizadoOk = false
  // Zera os dados em memória para o próximo login não ver nada do usuário anterior
  useStore.setState({ tarefas: [], projetos: [], tarefasRecorrentes: [], usuarios: [], anotacoes: [] } as any)
}
