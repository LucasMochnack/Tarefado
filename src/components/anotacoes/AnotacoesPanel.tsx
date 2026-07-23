import { useState } from 'react'
import { StickyNote, Plus, Pencil, Trash2, Save } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useProjetosPermitidos } from '@/hooks/useProjetosPermitidos'
import { formatRelative } from '@/utils/dates'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

/**
 * Painel lateral de anotações — mostra as notas do projeto filtrado
 * (ou todas, em "Todos os projetos"). Usado ao lado do Kanban.
 */
export function AnotacoesPanel() {
  const { anotacoes, projetos, projetoSelecionado, addAnotacao, updateAnotacao, deleteAnotacao } = useStore()
  const projetosPermitidos = useProjetosPermitidos()

  const podeVer = (id: string) => id === '' || !projetosPermitidos || projetosPermitidos.includes(id)
  const ocultos = new Set(projetos.filter(p => p.ocultarEmTodos).map(p => p.id))
  const projInfo = (id: string) =>
    projetos.find(p => p.id === id) ?? (id ? { nome: 'Projeto removido', cor: '#6b7280' } : { nome: 'Geral', cor: '#6b7280' })

  const notas = anotacoes
    .filter(a => {
      if (projetoSelecionado) return a.projetoId === projetoSelecionado && podeVer(projetoSelecionado)
      return !ocultos.has(a.projetoId) && podeVer(a.projetoId)
    })
    .sort((a, b) => (b.atualizadoEm || '').localeCompare(a.atualizadoEm || ''))

  const [mode, setMode] = useState<{ tipo: 'none' } | { tipo: 'nova' } | { tipo: 'edit'; id: string }>({ tipo: 'none' })
  const [form, setForm] = useState({ titulo: '', conteudo: '' })
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const abrirNova = () => { setForm({ titulo: '', conteudo: '' }); setMode({ tipo: 'nova' }) }
  const abrirEdit = (id: string) => {
    const a = anotacoes.find(x => x.id === id); if (!a) return
    setForm({ titulo: a.titulo, conteudo: a.conteudo }); setMode({ tipo: 'edit', id })
  }
  const fechar = () => setMode({ tipo: 'none' })

  const salvar = () => {
    if (!form.titulo.trim() && !form.conteudo.trim()) { toast.error('Escreva algo'); return }
    const base = { titulo: form.titulo.trim() || 'Sem título', conteudo: form.conteudo }
    if (mode.tipo === 'nova') {
      addAnotacao({ ...base, projetoId: projetoSelecionado || '' })
      toast.success('Anotação criada!')
    } else if (mode.tipo === 'edit') {
      updateAnotacao(mode.id, base)
      toast.success('Anotação atualizada!')
    }
    fechar()
  }

  const FIELD = 'w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition'

  const Editor = (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/40 dark:bg-indigo-950/10 p-2.5 space-y-2">
      <input
        autoFocus
        value={form.titulo}
        onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
        placeholder="Título"
        className={cn(FIELD, 'font-semibold')}
      />
      <textarea
        value={form.conteudo}
        onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
        placeholder={'Escreva aqui…\nUm tópico por linha.'}
        rows={5}
        className={cn(FIELD, 'resize-y leading-relaxed')}
      />
      <div className="flex items-center justify-end gap-1.5">
        <button onClick={fechar} className="px-2.5 py-1 rounded-lg text-[11px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
        <button onClick={salvar} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-indigo-600 text-white hover:bg-indigo-700">
          <Save size={11} /> Salvar
        </button>
      </div>
    </div>
  )

  return (
    <aside className="hidden lg:flex w-80 flex-shrink-0 flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 min-h-0">
      <header className="flex items-center justify-between px-4 h-14 flex-shrink-0 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <StickyNote size={16} className="text-indigo-500" />
          <span className="text-sm font-semibold">Anotações</span>
          {notas.length > 0 && (
            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-1.5">{notas.length}</span>
          )}
        </div>
        {mode.tipo !== 'nova' && (
          <button onClick={abrirNova} title="Nova anotação" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Plus size={16} />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {mode.tipo === 'nova' && Editor}

        {notas.length === 0 && mode.tipo !== 'nova' ? (
          <div className="flex flex-col items-center justify-center text-center gap-2 py-10 px-3">
            <StickyNote size={22} className="text-slate-300 dark:text-slate-600" />
            <p className="text-xs text-slate-400">Nenhuma anotação{projetoSelecionado ? ' neste projeto' : ''}.</p>
            <button onClick={abrirNova} className="text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:underline">Criar a primeira</button>
          </div>
        ) : (
          notas.map(a => {
            if (mode.tipo === 'edit' && mode.id === a.id) return <div key={a.id}>{Editor}</div>
            const info = projInfo(a.projetoId)
            return (
              <div key={a.id} className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug break-words">{a.titulo}</h4>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => abrirEdit(a.id)} title="Editar" className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600"><Pencil size={12} /></button>
                    <button onClick={() => setConfirmId(a.id)} title="Excluir" className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600"><Trash2 size={12} /></button>
                  </div>
                </div>
                {a.conteudo && (
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed break-words line-clamp-[12]">{a.conteudo}</p>
                )}
                <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  {!projetoSelecionado ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: info.cor }} />
                      <span className="truncate">{info.nome}</span>
                    </span>
                  ) : <span />}
                  <span className="text-[10px] text-slate-400 flex-shrink-0">{formatRelative(a.atualizadoEm)}</span>
                </div>

                {confirmId === a.id && (
                  <div className="absolute inset-0 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-3 text-center">
                    <p className="text-xs text-slate-700 dark:text-slate-200">Excluir esta anotação?</p>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setConfirmId(null)} className="px-2.5 py-1 rounded-lg text-[11px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
                      <button onClick={() => { deleteAnotacao(a.id); setConfirmId(null); toast.success('Anotação excluída') }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-red-600 text-white hover:bg-red-700"><Trash2 size={11} /> Excluir</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
