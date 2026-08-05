import { useState, useEffect, useRef, useCallback } from 'react'
import { LayoutGrid, Folder, Plus, Trash2, AlignLeft } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useProjetosPermitidos } from '@/hooks/useProjetosPermitidos'
import { CanvasProjeto as CanvasData } from '@/types'
import { canvasesDe, CampoCanvas } from '@/utils/canvas'
import { formatRelative } from '@/utils/dates'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type Bloco = { campo: CampoCanvas; titulo: string; hint: string; area: string }

// Blocos do Project Model Canvas (FGV) — mesma estrutura do Excel de referência
const BLOCOS: Bloco[] = [
  { campo: 'objetivo',        titulo: 'Objetivo do Projeto',       hint: 'O que o projeto entrega, para quem e com que resultado.',   area: 'obj' },
  { campo: 'justificativas',  titulo: 'Justificativas (passado)',  hint: 'O problema ou contexto que motivou o projeto.',             area: 'jus' },
  { campo: 'objetivoSmart',   titulo: 'Objetivo SMART',            hint: 'Específico, mensurável, atingível, relevante e com prazo.', area: 'sma' },
  { campo: 'beneficios',      titulo: 'Benefícios (futuro)',       hint: 'O que melhora quando o projeto estiver entregue.',          area: 'ben' },
  { campo: 'produto',         titulo: 'Produto',                   hint: 'O que será entregue de concreto.',                          area: 'pro' },
  { campo: 'requisitos',      titulo: 'Requisitos',                hint: 'O que o produto precisa atender, item a item.',             area: 'req' },
  { campo: 'fatoresExternos', titulo: 'Fatores Externos',          hint: 'Stakeholders e fatores fora do controle do time.',          area: 'fat' },
  { campo: 'equipe',          titulo: 'Equipe',                    hint: 'Quem faz o quê dentro do projeto.',                         area: 'equ' },
  { campo: 'premissas',       titulo: 'Premissas',                 hint: 'O que assumimos como verdade para o plano funcionar.',      area: 'pre' },
  { campo: 'entregas',        titulo: 'Grupo de Entregas',         hint: 'Os pacotes de entrega, com responsável.',                   area: 'ent' },
  { campo: 'restricoes',      titulo: 'Restrições',                hint: 'Limites não negociáveis (política, capacidade, prazo).',    area: 'res' },
  { campo: 'riscos',          titulo: 'Riscos',                    hint: 'O que pode dar errado e contaminar o resultado.',           area: 'ris' },
  { campo: 'linhaDoTempo',    titulo: 'Linha do Tempo',            hint: 'Marcos por semana ou por fase.',                            area: 'tem' },
  { campo: 'custos',          titulo: 'Custos',                    hint: 'Onde o projeto gasta: ferramentas, horas, mídia.',          area: 'cus' },
  { campo: 'pendencias',      titulo: 'Pendências — em aberto no canvas', hint: 'Dúvidas e decisões que ainda precisam de resposta.', area: 'pen' },
]

const porCampo = (campo: CampoCanvas) => BLOCOS.find(b => b.campo === campo)!

// Grade fiel ao Excel (5 colunas: Por quê / O quê / Quem / Como / Quando & Quanto)
const GRID_AREAS = `
  "obj obj obj obj obj"
  "jus pro fat pre ris"
  "sma req equ ent tem"
  "ben req res res cus"
  "pen pen pen pen pen"
`

const GRUPOS = ['Por quê?', 'O quê?', 'Quem?', 'Como?', 'Quando e quanto?']

// Modo leitura: os mesmos blocos, agrupados pelas perguntas do canvas
const GRUPOS_LEITURA: { titulo: string; campos: CampoCanvas[] }[] = [
  { titulo: 'Por quê?',         campos: ['justificativas', 'objetivoSmart', 'beneficios'] },
  { titulo: 'O quê?',           campos: ['produto', 'requisitos'] },
  { titulo: 'Quem?',            campos: ['fatoresExternos', 'equipe'] },
  { titulo: 'Como?',            campos: ['premissas', 'entregas', 'restricoes'] },
  { titulo: 'Quando e quanto?', campos: ['riscos', 'linhaDoTempo', 'custos'] },
]

/**
 * Bloco editável. A altura acompanha o conteúdo (min-height medido), então o texto
 * nunca fica com barra de rolagem interna. Salva ao sair do campo.
 */
function BlocoEditavel({ titulo, hint, valor, destaque, leitura, onSave }: {
  titulo: string; hint: string; valor: string; destaque?: boolean; leitura?: boolean; onSave: (v: string) => void
}) {
  // Normaliza CRLF: o textarea do DOM converte \r\n em \n, então guardar \r\n faria
  // o valor controlado do React divergir do DOM em todo render.
  const limpo = valor.includes('\r') ? valor.replace(/\r\n?/g, '\n') : valor
  const [texto, setTexto] = useState(limpo)
  const [focado, setFocado] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (!focado) setTexto(limpo) }, [limpo, focado])

  // Mede o conteúdo e fixa como min-height: com flex-1 o campo ainda estica pra
  // preencher a linha da grade, mas nunca encolhe abaixo do texto.
  // Se o elemento ainda não tem largura (fora de layout), NÃO mede — medir aí
  // daria uma altura errada e esconderia o texto.
  const ajustar = useCallback(() => {
    const el = ref.current
    if (!el || el.clientWidth === 0) return
    el.style.minHeight = '0px'
    const h = el.scrollHeight
    el.style.minHeight = `${Math.max(h, 64)}px`
  }, [])

  useEffect(() => { ajustar() }, [texto, ajustar])

  // Re-mede quando a LARGURA muda (o texto reflui): troca de modo, resize, sidebar.
  // Só na largura de propósito: o callback altera a altura, então reagir a altura
  // realimentaria o próprio observer.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let ultimaLargura = el.clientWidth
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      if (w !== ultimaLargura) { ultimaLargura = w; ajustar() }
    })
    ro.observe(el)
    window.addEventListener('resize', ajustar)
    return () => { ro.disconnect(); window.removeEventListener('resize', ajustar) }
  }, [ajustar])

  return (
    <div className={cn(
      'flex flex-col rounded-xl border overflow-hidden bg-white dark:bg-slate-900 transition-colors',
      focado
        ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-500/15'
        : 'border-slate-200 dark:border-slate-700',
      destaque && !focado && 'border-indigo-300/60 dark:border-indigo-700/60'
    )}>
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider flex-shrink-0 bg-indigo-600/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
        {titulo}
      </div>
      <textarea
        ref={ref}
        value={texto}
        placeholder={hint}
        onChange={e => setTexto(e.target.value)}
        onFocus={() => setFocado(true)}
        onBlur={() => {
          setFocado(false)
          if (texto !== limpo) { onSave(texto); toast.success('Canvas salvo', { id: 'canvas-save' }) }
        }}
        className={cn(
          // overflow-y-auto (não hidden) é rede de segurança: se a medição falhar,
          // o texto rola — nunca fica invisível.
          'flex-1 w-full resize-none overflow-y-auto bg-transparent px-3.5 py-3 outline-none whitespace-pre-wrap',
          'text-slate-700 dark:text-slate-200 placeholder:text-slate-400/70 dark:placeholder:text-slate-500/70 placeholder:italic',
          leitura ? 'text-[14.5px] leading-[1.75]' : 'text-[13px] leading-[1.6]'
        )}
        spellCheck={false}
      />
    </div>
  )
}

/** Nome do canvas — editável, salva ao sair do campo ou no Enter. */
function NomeCanvas({ valor, onSave }: { valor: string; onSave: (v: string) => void }) {
  const [texto, setTexto] = useState(valor)
  const [focado, setFocado] = useState(false)
  useEffect(() => { if (!focado) setTexto(valor) }, [valor, focado])

  const salvar = () => {
    const limpo = texto.trim()
    if (!limpo) { setTexto(valor); return }        // nome vazio: volta ao anterior
    if (limpo !== valor) { onSave(limpo); toast.success('Nome atualizado') }
  }

  return (
    <input
      value={texto}
      onChange={e => setTexto(e.target.value)}
      onFocus={() => setFocado(true)}
      onBlur={() => { setFocado(false); salvar() }}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      placeholder="Nome do canvas"
      aria-label="Nome do canvas"
      className="w-full max-w-xl px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
    />
  )
}

export function CanvasProjeto() {
  const {
    projetos, projetoSelecionado, setProjetoSelecionado,
    addCanvas, updateCanvas, deleteCanvas,
    canvasModoGrade, setCanvasModoGrade,
  } = useStore()
  const projetosPermitidos = useProjetosPermitidos()

  const visiveis = projetosPermitidos
    ? projetos.filter(p => projetosPermitidos.includes(p.id))
    : projetos

  const projeto = visiveis.find(p => p.id === projetoSelecionado) ?? null
  const canvases: CanvasData[] = projeto ? canvasesDe(projeto) : []

  const [canvasIdSel, setCanvasIdSel] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)

  // Mantém uma seleção válida: escolhe o primeiro quando troca de projeto ou o atual sai
  useEffect(() => {
    if (!canvases.length) { setCanvasIdSel(null); return }
    if (!canvasIdSel || !canvases.some(c => c.id === canvasIdSel)) setCanvasIdSel(canvases[0].id)
  }, [projeto?.id, canvases.length, canvasIdSel, canvases])

  const canvas = canvases.find(c => c.id === canvasIdSel) ?? null

  const criar = () => {
    if (!projeto) return
    const id = addCanvas(projeto.id, `Canvas ${canvases.length + 1}`)
    setCanvasIdSel(id)
    toast.success('Canvas criado')
  }

  const campo = (b: Bloco, leitura: boolean) => (
    <BlocoEditavel
      key={b.campo}
      titulo={b.titulo}
      hint={b.hint}
      valor={canvas?.[b.campo] ?? ''}
      destaque={b.campo === 'objetivo'}
      leitura={leitura}
      onSave={v => projeto && canvas && updateCanvas(projeto.id, canvas.id, { [b.campo]: v })}
    />
  )

  const btnModo = (ativo: boolean) => cn(
    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors',
    ativo
      ? 'bg-indigo-600 text-white'
      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600'
  )

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Canvas do Projeto</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Project Model Canvas — cada projeto pode ter mais de um
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canvas?.atualizadoEm && (
            <span className="text-[11px] text-slate-400 font-medium">Atualizado {formatRelative(canvas.atualizadoEm)}</span>
          )}
          {/* Modo de visualização */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden" role="group" aria-label="Modo de visualização">
            <button onClick={() => setCanvasModoGrade(false)} className={btnModo(!canvasModoGrade)} aria-pressed={!canvasModoGrade}>
              <AlignLeft size={13} /> Leitura
            </button>
            <button onClick={() => setCanvasModoGrade(true)} className={btnModo(canvasModoGrade)} aria-pressed={canvasModoGrade}>
              <LayoutGrid size={13} /> Grade
            </button>
          </div>
        </div>
      </div>

      {/* Seletor de projeto */}
      <div className="flex items-center gap-2 flex-wrap">
        {visiveis.map(p => (
          <button
            key={p.id}
            onClick={() => setProjetoSelecionado(projetoSelecionado === p.id ? null : p.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1.5',
              projetoSelecionado === p.id
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600'
            )}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-black/10 dark:ring-white/20" style={{ backgroundColor: p.cor }} />
            {p.nome}
          </button>
        ))}
      </div>

      {!projeto ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <LayoutGrid size={26} className="text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">Escolha um projeto acima para abrir os canvas dele</p>
          <p className="text-sm text-slate-400 flex items-center gap-1.5">
            <Folder size={13} /> Cada projeto pode ter vários canvas
          </p>
        </div>
      ) : (
        <>
          {/* Abas dos canvas do projeto + criar */}
          <div className="flex items-center gap-2 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-3">
            {canvases.map(c => (
              <button
                key={c.id}
                onClick={() => setCanvasIdSel(c.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors max-w-[240px] truncate',
                  c.id === canvasIdSel
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600'
                )}
                title={c.nome}
              >
                {c.nome || 'Sem nome'}
              </button>
            ))}
            <button
              onClick={criar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
            >
              <Plus size={13} /> Novo canvas
            </button>
          </div>

          {!canvas ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <LayoutGrid size={26} className="text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium">Nenhum canvas em “{projeto.nome}” ainda.</p>
              <button onClick={criar} className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                Criar o primeiro
              </button>
            </div>
          ) : (
            <>
              {/* Nome do canvas + excluir */}
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[260px]">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    Nome do canvas
                  </label>
                  <NomeCanvas valor={canvas.nome} onSave={v => updateCanvas(projeto.id, canvas.id, { nome: v })} />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setConfirmDel(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:border-red-300 text-xs font-medium transition-colors"
                  >
                    <Trash2 size={13} /> Excluir canvas
                  </button>
                  {confirmDel && (
                    <div className="absolute right-0 top-full mt-2 z-20 w-64 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl text-center space-y-2.5">
                      <p className="text-xs text-slate-700 dark:text-slate-200">Excluir “{canvas.nome}”? Não dá para desfazer.</p>
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setConfirmDel(false)} className="px-2.5 py-1 rounded-lg text-[11px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
                        <button
                          onClick={() => { deleteCanvas(projeto.id, canvas.id); setConfirmDel(false); toast.success('Canvas excluído') }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-red-600 text-white hover:bg-red-700"
                        >
                          <Trash2 size={11} /> Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {canvasModoGrade ? (
                /* ── GRADE: layout do canvas FGV (5 colunas) ── */
                <>
                  <div className="hidden xl:grid grid-cols-5 gap-3">
                    {GRUPOS.map(g => (
                      <div key={g} className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{g}</div>
                    ))}
                  </div>
                  <div
                    className="grid gap-3 grid-cols-1 xl:[grid-template-areas:var(--areas)] xl:grid-cols-5"
                    style={{ ['--areas' as string]: GRID_AREAS }}
                  >
                    {BLOCOS.map(b => (
                      <div key={b.campo} className="xl:[grid-area:var(--a)] flex" style={{ ['--a' as string]: b.area }}>
                        <div className="flex-1 flex flex-col">{campo(b, false)}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* ── LEITURA: uma coluna na medida de leitura, agrupada pelas perguntas ── */
                <div className="max-w-2xl space-y-7">
                  {campo(porCampo('objetivo'), true)}

                  {GRUPOS_LEITURA.map(g => (
                    <section key={g.titulo} className="space-y-3">
                      <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                        {g.titulo}
                      </h2>
                      {g.campos.map(c => campo(porCampo(c), true))}
                    </section>
                  ))}

                  {campo(porCampo('pendencias'), true)}
                </div>
              )}

              <p className="text-[11px] text-slate-400 italic">
                Dica: escreva em tópicos (um por linha). Salva ao sair do campo e sincroniza na nuvem.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
