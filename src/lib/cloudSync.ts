import { supabase } from './supabase'
import { useStore } from '@/store/useStore'

// Mapeia a chave do estado (store) para o nome da tabela no Supabase
const TABELAS = {
  tarefas: 'tarefas',
  projetos: 'projetos',
  tarefasRecorrentes: 'tarefas_recorrentes',
  usuarios: 'usuarios',
} as const

type StoreKey = keyof typeof TABELAS
type Item = { id: string } & Record<string, unknown>

// Último estado sincronizado (id -> JSON) para calcular diffs
const snapshot: Record<StoreKey, Map<string, string>> = {
  tarefas: new Map(),
  projetos: new Map(),
  tarefasRecorrentes: new Map(),
  usuarios: new Map(),
}

let iniciado = false
let puxando = false

function itensDoEstado(key: StoreKey): Item[] {
  return (useStore.getState() as any)[key] as Item[]
}

function setSnapshot(key: StoreKey, itens: Item[]) {
  const m = new Map<string, string>()
  for (const it of itens) m.set(it.id, JSON.stringify(it))
  snapshot[key] = m
}

/** Busca tudo da nuvem e popula o store (nuvem = fonte da verdade). */
export async function puxarDaNuvem(): Promise<{ vazio: boolean }> {
  if (!supabase) return { vazio: true }
  puxando = true
  try {
    const chaves = Object.keys(TABELAS) as StoreKey[]
    const resultados = await Promise.all(
      chaves.map(k => supabase!.from(TABELAS[k]).select('data'))
    )
    let totalLinhas = 0
    const patch: Partial<Record<StoreKey, Item[]>> = {}
    chaves.forEach((k, i) => {
      const { data, error } = resultados[i]
      if (error) throw error
      const itens = (data ?? []).map((r: any) => r.data as Item)
      totalLinhas += itens.length
      patch[k] = itens
    })

    if (totalLinhas > 0) {
      // Nuvem tem dados → substitui o store e marca como sincronizado
      useStore.setState(patch as any)
      chaves.forEach(k => setSnapshot(k, patch[k] ?? []))
      return { vazio: false }
    }
    // Nuvem vazia → marca snapshot vazio (para a migração empurrar o local)
    chaves.forEach(k => setSnapshot(k, []))
    return { vazio: true }
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

/** Empurra para a nuvem apenas o que mudou desde o último snapshot. */
async function empurrarMudancas() {
  if (!supabase || puxando) return
  const chaves = Object.keys(TABELAS) as StoreKey[]
  for (const key of chaves) {
    const itens = itensDoEstado(key)
    const atual = new Map<string, string>()
    const ops: Promise<unknown>[] = []
    for (const it of itens) {
      const json = JSON.stringify(it)
      atual.set(it.id, json)
      if (snapshot[key].get(it.id) !== json) ops.push(upsert(key, it))
    }
    // Removidos: estavam no snapshot e sumiram
    for (const id of snapshot[key].keys()) {
      if (!atual.has(id)) ops.push(remover(key, id))
    }
    if (ops.length) {
      await Promise.allSettled(ops)
      snapshot[key] = atual
    }
  }
}

let debounce: ReturnType<typeof setTimeout> | null = null
function agendarPush() {
  if (!supabase || puxando) return
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => { empurrarMudancas().catch(err => console.error('[cloudSync] push', err)) }, 700)
}

/**
 * Liga a sincronização: puxa da nuvem, migra o local se a nuvem estiver vazia,
 * e passa a empurrar mudanças do store para a nuvem.
 */
export async function iniciarSync() {
  if (!supabase || iniciado) return
  iniciado = true
  try {
    const { vazio } = await puxarDaNuvem()
    if (vazio) {
      // Primeira vez: sobe o que já existe localmente para a nuvem
      await empurrarMudancas()
    }
  } catch (err) {
    console.error('[cloudSync] pull inicial', err)
  }
  // Empurra qualquer alteração futura do store
  useStore.subscribe(() => agendarPush())
}
