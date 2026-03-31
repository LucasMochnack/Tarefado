import { Time, StatusTarefa, NivelPrioridade } from '@/types'

export interface ParsedCommand {
  tipo: 'criar-tarefa' | 'adicionar-comentario' | 'mover-tarefa' | 'filtrar' | 'desconhecido'
  titulo?: string
  descricao?: string
  time?: Time
  projetoNome?: string
  prazo?: string
  prioridade?: NivelPrioridade
  comentario?: string
  tarefaNome?: string
  novoStatus?: StatusTarefa
  filtroStatus?: StatusTarefa
  filtroTime?: Time
  textoOriginal: string
}

const TIME_MAP: Record<string, Time> = {
  'b2c': 'b2c',
  'bê dois cê': 'b2c',
  'b 2 c': 'b2c',
  'campinas': 'campinas',
  'produtos': 'produtos',
  'produto': 'produtos',
}

const PRIORIDADE_MAP: Record<string, NivelPrioridade> = {
  'crítica': 'critica',
  'critica': 'critica',
  'urgente': 'critica',
  'alta': 'alta',
  'média': 'media',
  'media': 'media',
  'baixa': 'baixa',
}

const STATUS_MAP: Record<string, StatusTarefa> = {
  'a fazer': 'a-fazer',
  'pendente': 'a-fazer',
  'em andamento': 'em-andamento',
  'andamento': 'em-andamento',
  'fazendo': 'em-andamento',
  'aguardando': 'aguardando',
  'esperando': 'aguardando',
  'concluído': 'concluido',
  'concluida': 'concluido',
  'feito': 'concluido',
  'pronto': 'concluido',
  'done': 'concluido',
}

const PRAZO_MAP: Record<string, number> = {
  'hoje': 0,
  'amanhã': 1,
  'amanha': 1,
  'depois de amanhã': 2,
  'essa semana': 5,
  'próxima semana': 7,
  'em 3 dias': 3,
  'em 5 dias': 5,
  'em uma semana': 7,
}

function detectTime(text: string): Time | undefined {
  const lower = text.toLowerCase()
  for (const [key, value] of Object.entries(TIME_MAP)) {
    if (lower.includes(key)) return value
  }
  return undefined
}

function detectPrazo(text: string): string | undefined {
  const lower = text.toLowerCase()
  for (const [key, days] of Object.entries(PRAZO_MAP)) {
    if (lower.includes(key)) {
      const date = new Date()
      date.setDate(date.getDate() + days)
      return date.toISOString()
    }
  }
  return undefined
}

function detectPrioridade(text: string): NivelPrioridade | undefined {
  const lower = text.toLowerCase()
  for (const [key, value] of Object.entries(PRIORIDADE_MAP)) {
    if (lower.includes(key)) return value
  }
  return undefined
}

function detectStatus(text: string): StatusTarefa | undefined {
  const lower = text.toLowerCase()
  for (const [key, value] of Object.entries(STATUS_MAP)) {
    if (lower.includes(key)) return value
  }
  return undefined
}

function extractAfter(text: string, keyword: string): string {
  const lower = text.toLowerCase()
  const idx = lower.indexOf(keyword.toLowerCase())
  if (idx === -1) return ''
  return text.substring(idx + keyword.length).trim()
}

export function parseVoiceCommand(text: string): ParsedCommand {
  const lower = text.toLowerCase().trim()

  // Criar tarefa
  if (lower.startsWith('criar tarefa') || lower.startsWith('nova tarefa') || lower.startsWith('adicionar tarefa')) {
    let titulo = text
      .replace(/^(criar|nova|adicionar)\s+tarefa\s*/i, '')
      .replace(/\s*no time\s+\w+/i, '')
      .replace(/\s*no projeto\s+[\w\s]+/i, '')
      .replace(/\s*com prioridade\s+\w+/i, '')
      .replace(/\s*(amanhã|hoje|essa semana|próxima semana|depois de amanhã)/i, '')
      .replace(/\s*no time.*$/i, '')
      .replace(/\s*para.*$/i, '')
      .trim()

    // Extract after ":" if present (e.g., "Criar tarefa no time B2C: retomar cliente")
    if (titulo.includes(':')) {
      titulo = titulo.split(':')[1].trim()
    }

    return {
      tipo: 'criar-tarefa',
      titulo: titulo || 'Nova tarefa',
      time: detectTime(text),
      prazo: detectPrazo(text),
      prioridade: detectPrioridade(text),
      projetoNome: extractProjetoNome(text),
      textoOriginal: text,
    }
  }

  // Adicionar comentário
  if (lower.includes('adicionar comentário') || lower.includes('adicionar comentario') || lower.startsWith('comentário') || lower.startsWith('comentario')) {
    const comentario = text
      .replace(/^adicionar comentário\s*/i, '')
      .replace(/^comentário\s*/i, '')
      .replace(/^na tarefa\s+[\w\s]+:/i, '')
      .trim()

    const tarefaNome = extractTarefaNome(text)

    return {
      tipo: 'adicionar-comentario',
      comentario,
      tarefaNome,
      textoOriginal: text,
    }
  }

  // Mover tarefa
  if (lower.includes('mover tarefa') || lower.includes('mover ')) {
    const novoStatus = detectStatus(text)
    const tarefaNome = text
      .replace(/^mover tarefa\s*/i, '')
      .replace(/\s*para\s+.*/i, '')
      .trim()

    return {
      tipo: 'mover-tarefa',
      tarefaNome,
      novoStatus,
      textoOriginal: text,
    }
  }

  // Filtrar / mostrar
  if (lower.startsWith('mostrar') || lower.startsWith('filtrar') || lower.startsWith('ver ')) {
    const filtroStatus = detectStatus(text)
    const filtroTime = detectTime(text)

    return {
      tipo: 'filtrar',
      filtroStatus,
      filtroTime,
      textoOriginal: text,
    }
  }

  return { tipo: 'desconhecido', textoOriginal: text }
}

function extractProjetoNome(text: string): string | undefined {
  const match = text.match(/no projeto\s+([\w\s]+?)(?:\s+com|\s+para|\s+amanhã|\s+hoje|$)/i)
  return match ? match[1].trim() : undefined
}

function extractTarefaNome(text: string): string | undefined {
  const match = text.match(/na tarefa\s+([\w\s]+?)(?:\s*:|\s+comentário|$)/i)
  return match ? match[1].trim() : undefined
}
