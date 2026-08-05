import { useState, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { LayoutGrid, Folder, Plus, Trash2, Maximize2, X, Save } from 'lucide-react'
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

// Grade fiel ao Excel (5 colunas: Por quê / O quê / Quem / Como / Quando & Quanto)
const GRID_AREAS = `
  "obj obj obj obj obj"
  "jus pro fat pre ris"
  "sma req equ ent tem"
  "ben req res res cus"
  "pen pen pen pen pen"
`

const GRUPOS = ['Por quê?', 'O quê?', 'Quem?', 'Como?', 'Quando e quanto?']

/** Limpa o texto vindo da planilha: CRLF e linhas em branco no fim. */
const normalizar = (v: string) => v.replace(/\r\n?/g, '\n').replace(/\n+$/, '')

/**
 * Caixa da grade: só prévia (sem campo de edição), então a grade fica compacta e
 * fiel ao Excel. Clicar abre o bloco expandido.
 */
function CaixaCanvas({ titulo, hint, valor, largo, onAbrir }: {
  titulo: string; hint: string; valor: string; largo?: boolean; onAbrir: () => void
}) {
  const texto = normalizar(valor)
  const vazio = texto.trim() === ''
  // Arrastar a barra de rolagem não deve abrir o modal
  const naBarra = useRef(false)
  return (
    <button
      type="button"
      onClick={() => { if (!naBarra.current) onAbrir(); naBarra.current = false }}
      title={`${titulo} — clique para expandir`}
      className={cn(
        'group relative flex flex-col w-full h-full text-left rounded-xl border overflow-hidden transition-all',
        'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700',
        'hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md focus:outline-none',
        'focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30'
      )}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 flex-shrink-0 bg-indigo-600/10 dark:bg-indigo-500/15">
        <span className="flex-1 text-[10.5px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 leading-tight">
          {titulo}
        </span>
        <Maximize2
          size={12}
          className="flex-shrink-0 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
      <div
        // Rola com a roda do mouse ao passar por cima; a barra só aparece no hover
        onMouseDown={e => { naBarra.current = e.nativeEvent.offsetX > e.currentTarget.clientWidth }}
        className={cn(
          'flex-1 min-h-0 px-3 py-2.5 text-[12.5px] leading-[1.55] whitespace-pre-wrap break-words',
          'overflow-y-auto [scrollbar-width:thin] cursor-text',
          '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent',
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent',
          'group-hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:group-hover:[&::-webkit-scrollbar-thumb]:bg-slate-600',
          vazio
            ? 'text-slate-400/70 dark:text-slate-600 italic'
            : 'text-slate-700 dark:text-slate-300',
          largo ? 'max-h-[6rem]' : 'max-h-[11.9rem]'
        )}
      >
        {vazio ? hint : texto}
      </div>
    </button>
  )
}

/** Bloco expandido: leitura e edição confortáveis. Salva ao fechar. */
function ModalBloco({ bloco, valor, onSalvar, onFechar }: {
  bloco: Bloco; valor: string; onSalvar: (v: string) => void; onFechar: () => void
}) {
  const original = normalizar(valor)
  const [texto, setTexto] = useState(original)
  const ref = useRef<HTMLTextAreaElement>(null)

  const fechar = () => {
    if (texto !== original) { onSalvar(texto); toast.success('Canvas salvo', { id: 'canvas-save' }) }
    onFechar()
  }

  return (
    <Dialog.Root open onOpenChange={o => { if (!o) fechar() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content
          // Radix foca o primeiro elemento focável (o X); queremos o texto, no fim dele
          onOpenAutoFocus={e => {
            e.preventDefault()
            const el = ref.current
            if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) }
          }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in"
        >
          <div className="flex items-start gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <Dialog.Title className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
                {bloco.titulo}
              </Dialog.Title>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{bloco.hint}</p>
            </div>
            <Dialog.Close className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <textarea
              ref={ref}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder={bloco.hint}
              spellCheck={false}
              className="w-full min-h-[44vh] resize-y rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 px-4 py-3 text-[15px] leading-[1.75] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 placeholder:italic outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
            <p className="mt-2 text-[11px] text-slate-400 italic">
              Escreva em tópicos (um por linha). Fechar já salva.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
            <button onClick={fechar} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
              <Save size={14} /> Salvar e fechar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
  const { projetos, projetoSelecionado, setProjetoSelecionado, addCanvas, updateCanvas, deleteCanvas } = useStore()
  const projetosPermitidos = useProjetosPermitidos()

  const visiveis = projetosPermitidos
    ? projetos.filter(p => projetosPermitidos.includes(p.id))
    : projetos

  const projeto = visiveis.find(p => p.id === projetoSelecionado) ?? null
  const canvases: CanvasData[] = projeto ? canvasesDe(projeto) : []

  const [canvasIdSel, setCanvasIdSel] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const [expandido, setExpandido] = useState<CampoCanvas | null>(null)

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

  const blocoAberto = expandido ? BLOCOS.find(b => b.campo === expandido) ?? null : null

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Canvas do Projeto</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Project Model Canvas — clique em uma caixa para expandir e editar
          </p>
        </div>
        {canvas?.atualizadoEm && (
          <span className="text-[11px] text-slate-400 font-medium">Atualizado {formatRelative(canvas.atualizadoEm)}</span>
        )}
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

              {/* Cabeçalhos das colunas (as perguntas do canvas) */}
              <div className="hidden xl:grid grid-cols-5 gap-3">
                {GRUPOS.map(g => (
                  <div key={g} className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{g}</div>
                ))}
              </div>

              {/* Grade do canvas — igual ao Excel */}
              <div
                className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:[grid-template-areas:var(--areas)] xl:grid-cols-5"
                style={{ ['--areas' as string]: GRID_AREAS }}
              >
                {BLOCOS.map(b => (
                  <div
                    key={b.campo}
                    className={cn(
                      'xl:[grid-area:var(--a)] min-h-[9.5rem]',
                      // Objetivo e Pendências ocupam a largura toda: caixa mais baixa
                      (b.campo === 'objetivo' || b.campo === 'pendencias') && 'sm:col-span-2 xl:col-span-full min-h-[7rem]'
                    )}
                    style={{ ['--a' as string]: b.area }}
                  >
                    <CaixaCanvas
                      titulo={b.titulo}
                      hint={b.hint}
                      valor={canvas[b.campo] ?? ''}
                      largo={b.campo === 'objetivo' || b.campo === 'pendencias'}
                      onAbrir={() => setExpandido(b.campo)}
                    />
                  </div>
                ))}
              </div>

              {blocoAberto && (
                <ModalBloco
                  bloco={blocoAberto}
                  valor={canvas[blocoAberto.campo] ?? ''}
                  onSalvar={v => updateCanvas(projeto.id, canvas.id, { [blocoAberto.campo]: v })}
                  onFechar={() => setExpandido(null)}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
