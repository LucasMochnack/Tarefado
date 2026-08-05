import { Projeto, CanvasProjeto } from '@/types'

/** Texto pronto pra planilha: normaliza CRLF e tira linhas em branco no fim. */
const limpar = (v?: string) => (v ?? '').replace(/\r\n?/g, '\n').replace(/\n+$/, '')

/** Nome de aba do Excel: máx. 31 caracteres e sem : \ / ? * [ ] */
const nomeAba = (s: string) => (s || 'Canvas').replace(/[:\\/?*[\]]/g, '-').slice(0, 31) || 'Canvas'

/** Nome de arquivo seguro, preservando acentos. */
const nomeArquivo = (s: string) =>
  (s || 'Canvas').replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim().replace(/\s+/g, '-') || 'Canvas'

const TEAL = 'FF0F766E'      // cabeçalho dos blocos
const TEAL_ESCURO = 'FF115E59' // faixas de largura total (objetivo / pendências)
const CLARO = 'FFF8FAFC'     // fundo do conteúdo
const BORDA = 'FFCBD5E1'

/**
 * Monta a planilha do canvas no mesmo layout do Project Model Canvas (FGV):
 * objetivo em faixa no topo, 5 colunas de blocos, pendências no rodapé.
 * Separado do download pra poder ser testado fora do navegador.
 * A lib do Excel é carregada por import dinâmico, pra não pesar o app.
 */
export async function construirCanvasWorkbook(projeto: Projeto, canvas: CanvasProjeto) {
  const { default: ExcelJS } = await import('exceljs')

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Tarefado'
  wb.created = new Date()

  const ws = wb.addWorksheet(nomeAba(canvas.nome), {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ showGridLines: false }],
  })

  // uma a uma: atribuir ws.columns só aplica a largura na primeira coluna
  for (let i = 1; i <= 5; i++) ws.getColumn(i).width = 32

  const rotulo = (ref: string, texto: string, faixa = false) => {
    const c = ws.getCell(ref)
    c.value = texto.toUpperCase()
    c.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: faixa ? TEAL_ESCURO : TEAL } }
    c.alignment = { vertical: 'middle', horizontal: faixa ? 'left' : 'center', wrapText: true, indent: faixa ? 1 : 0 }
  }

  const conteudo = (ref: string, texto: string) => {
    const c = ws.getCell(ref)
    c.value = limpar(texto)
    c.font = { name: 'Arial', size: 10 }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLARO } }
    c.alignment = { vertical: 'top', horizontal: 'left', wrapText: true, indent: 1 }
    c.border = {
      top: { style: 'thin', color: { argb: BORDA } },
      left: { style: 'thin', color: { argb: BORDA } },
      bottom: { style: 'thin', color: { argb: BORDA } },
      right: { style: 'thin', color: { argb: BORDA } },
    }
  }

  // Faixas de largura total: objetivo (topo) e pendências (rodapé)
  ws.mergeCells('A1:E1'); rotulo('A1', 'Objetivo do Projeto', true)
  ws.mergeCells('A2:E2'); conteudo('A2', canvas.objetivo ?? '')

  // Linha 4 fica como respiro, igual ao modelo de referência
  ws.mergeCells('A4:B4'); ws.mergeCells('C4:E4')

  // ── Bloco central: 3 faixas de rótulo + conteúdo ──
  rotulo('A5', 'Justificativas (passado)')
  rotulo('B5', 'Produto')
  rotulo('C5', 'Fatores Externos')
  rotulo('D5', 'Premissas')
  rotulo('E5', 'Riscos')
  conteudo('A6', canvas.justificativas ?? '')
  conteudo('B6', canvas.produto ?? '')
  conteudo('C6', canvas.fatoresExternos ?? '')
  conteudo('D6', canvas.premissas ?? '')
  conteudo('E6', canvas.riscos ?? '')

  rotulo('A7', 'Objetivo SMART')
  rotulo('B7', 'Requisitos')
  rotulo('C7', 'Equipe')
  rotulo('D7', 'Grupo de Entregas')
  rotulo('E7', 'Linha do Tempo')
  conteudo('A8', canvas.objetivoSmart ?? '')
  ws.mergeCells('B8:B10'); conteudo('B8', canvas.requisitos ?? '')  // célula alta, como no modelo
  conteudo('C8', canvas.equipe ?? '')
  conteudo('D8', canvas.entregas ?? '')
  conteudo('E8', canvas.linhaDoTempo ?? '')

  rotulo('A9', 'Benefícios (futuro)')
  ws.mergeCells('C9:D9'); rotulo('C9', 'Restrições')
  rotulo('E9', 'Custos')
  conteudo('A10', canvas.beneficios ?? '')
  ws.mergeCells('C10:D10'); conteudo('C10', canvas.restricoes ?? '')
  conteudo('E10', canvas.custos ?? '')

  ws.mergeCells('A12:E12'); rotulo('A12', 'Pendências — em aberto no canvas', true)
  ws.mergeCells('A13:E13'); conteudo('A13', canvas.pendencias ?? '')

  // Rodapé: origem do arquivo
  ws.mergeCells('A15:E15')
  const rodape = ws.getCell('A15')
  rodape.value = `Projeto: ${projeto.nome}  ·  Canvas: ${canvas.nome}  ·  exportado do Tarefado`
  rodape.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } }
  rodape.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

  const alturas: Record<number, number> = {
    1: 20, 2: 72, 3: 8, 4: 8, 5: 22, 6: 132, 7: 22, 8: 132, 9: 22, 10: 132, 11: 8, 12: 20, 13: 72, 14: 8, 15: 22,
  }
  for (const [linha, altura] of Object.entries(alturas)) ws.getRow(Number(linha)).height = altura

  return wb
}

/** Nome do arquivo baixado. */
export function nomeArquivoCanvas(projeto: Projeto, canvas: CanvasProjeto) {
  return `Canvas-${nomeArquivo(projeto.nome)}-${nomeArquivo(canvas.nome)}.xlsx`
}

/** Gera o .xlsx e dispara o download no navegador. */
export async function exportarCanvasExcel(projeto: Projeto, canvas: CanvasProjeto) {
  const wb = await construirCanvasWorkbook(projeto, canvas)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivoCanvas(projeto, canvas)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
