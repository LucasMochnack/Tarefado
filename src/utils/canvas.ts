import { Projeto, CanvasProjeto } from '@/types'

/** Campos de conteúdo do canvas (fora de id/nome/datas). */
export const CAMPOS_CANVAS = [
  'objetivo', 'justificativas', 'objetivoSmart', 'beneficios',
  'produto', 'requisitos', 'fatoresExternos', 'equipe',
  'premissas', 'entregas', 'restricoes', 'riscos',
  'linhaDoTempo', 'custos', 'pendencias',
] as const

export type CampoCanvas = typeof CAMPOS_CANVAS[number]

/** Um canvas tem conteúdo se qualquer bloco estiver preenchido. */
export function canvasTemConteudo(c: Partial<CanvasProjeto>): boolean {
  return CAMPOS_CANVAS.some(k => (c[k] ?? '').trim() !== '')
}

/**
 * Canvases do projeto, já normalizados: converte o formato antigo
 * (`projeto.canvas`, um só) para a lista atual.
 */
export function canvasesDe(p: Projeto): CanvasProjeto[] {
  if (p.canvases?.length) return p.canvases
  const legado = p.canvas
  if (legado && canvasTemConteudo(legado)) {
    return [{ ...legado, id: legado.id || 'cnv-legado', nome: legado.nome || 'Canvas' }]
  }
  return []
}
