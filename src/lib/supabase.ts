import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Config pública do Supabase (a chave "publishable" é pública por design — os dados
// são protegidos por RLS no banco). Fallback embutido garante que a nuvem funcione
// na Vercel sem configurar variáveis; o .env local sobrescreve em desenvolvimento.
const FALLBACK_URL = 'https://ohwvhaudgjwkmgpupuaw.supabase.co'
const FALLBACK_KEY = 'sb_publishable__I9b1z2HwC3OC-Y1vpjkHA_8_3IzEe6'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_URL
const key = (import.meta.env.VITE_SUPABASE_KEY as string | undefined) || FALLBACK_KEY

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: true } }) : null

export const supabaseAtivo = !!supabase
