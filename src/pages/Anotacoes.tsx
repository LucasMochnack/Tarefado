import { useState } from 'react'
import { StickyNote, Plus, Pencil, Trash2, Save } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useProjetosPermitidos } from '@/hooks/useProjetosPermitidos'
import { formatRelative } from '@/utils/dates'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const SEM_PROJETO = { nome: 'Geral', cor: '#6b7280' }

export function Anotacoes() {
  const { anotacoes, projetos, projetoSelecionado, setProjetoSelecionado, addAnotacao, updateAnotacao, deleteAnotacao } = useStore()
  const projetosPermitidos = useProjetosPermitidos()

  const projetosDisponiveis = projetosPermitidos
    ? projetos.filter(p => projetosPermitidos.includes(p.id))
    : projetos

  const podeVer = (id: string) => id === '' || !projetosPermitidos || projetosPermitidos.includes(id)
  const ocultos = new Set(projetos.filter(p => p.ocultarEmTodos).map(p => p.id))

  const projInfo = (id: string) => projetos.find(p => p.id === id) ?? (id ? { nome: 'Projeto removido', cor: '#6b7280' } : SEM_PROJETO)

  const notas = anotacoes
    .filter(a => {
      if (projetoSelecionado) return a.projetoId === projetoSelecionado && podeVer(projetoSelecionado)
      return !ocultos.has(a.projetoId) && podeVer(a.projetoId)
    })
    .sort((a, b) => (b.atualizadoEm || '').localeCompare(a.atualizadoEm || ''))

  // editId: null (nada) | 'novo' | id de uma anotação
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ titulo: '', conteudo: '', projetoId: '' })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const abrirNova = () => {
    setForm({ titulo: '', conteudo: '', projetoId: projetoSelecionado || '' })
    setEditId('novo')
  }
  const abrirEdicao = (id: string) => {
    const a = anotacoes.find(x => x.id === id)
    if (!a) return
    setForm({ titulo: a.titulo, conteudo: a.conteudo, projetoId: a.projetoId })
    setEditId(id)
  }
  const cancelar = () => setEditId(null)

  const salvar = () => {
    if (!form.titulo.trim() && !form.conteudo.trim()) {
      toast.error('Escreva um título ou um conteúdo')
      return
    }
    const dados = { titulo: form.titulo.trim() || 'Sem título', conteudo: form.conteudo, projetoId: form.projetoId }
    if (editId === 'novo') {
      addAnotacao(dados)
      toast.success('Anotação criada!')
    } else if (editId) {
      updateAnotacao(editId, dados)
      toast.success('Anotação atualizada!')
    }
    setEditId(null)
  }

  const excluir = (id: string) => {
    deleteAnotacao(id)
    setConfirmDeleteId(null)
    toast.success('Anotação excluída')
  }

  const FIELD = 'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition'

  const Editor = (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/40 dark:bg-indigo-950/10 p-4 space-y-3">
      <input
        autoFocus
        value={form.titulo}
        onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
        placeholder="Título da anotação"
        className={cn(FIELD, 'font-semibold')}
      />
      <textarea
        value={form.conteudo}
        onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
        placeholder={'Escreva aqui…\nDica: use tópicos, um por linha.'}
        rows={6}
        className={cn(FIELD, 'resize-y leading-relaxed')}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Projeto:</span>
        <select
          value={form.projetoId}
          onChange={e => setForm(f => ({ ...f, projetoId: e.target.value }))}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-400"
        >
          <option value="">— Geral (sem projeto) —</option>
          {projetosDisponiveis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={cancelar} className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
        <button onClick={salvar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-indigo-600 text-white hover:bg-indigo-700">
          <Save size={12} /> Salvar
        </button>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Anotações</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Notas dos projetos — sem precisar virar tarefa</p>
        </div>
        {editId !== 'novo' && (
          <button
            onClick={abrirNova}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Nova anotação
          </button>
        )}
      </div>

      {/* Filtro de projeto */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setProjetoSelecionado(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            projetoSelecionado === null
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600'
          )}
        >
          Todos os projetos
        </button>
        {projetosDisponiveis.map(p => (
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

      {/* Editor de nova anotação */}
      {editId === 'novo' && Editor}

      {/* Lista */}
      {notas.length === 0 && editId !== 'novo' ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <StickyNote size={26} className="text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhuma anotação ainda{projetoSelecionado ? ' neste projeto' : ''}.</p>
          <button onClick={abrirNova} className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">Criar a primeira</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {notas.map(a => {
            const info = projInfo(a.projetoId)
            if (editId === a.id) {
              return <div key={a.id} className="md:col-span-2 xl:col-span-3">{Editor}</div>
            }
            return (
              <div key={a.id} className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex flex-col gap-2 hover:shadow-card transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug break-words">{a.titulo}</h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => abrirEdicao(a.id)} title="Editar" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmDeleteId(a.id)} title="Excluir" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {a.conteudo && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed break-words">{a.conteudo}</p>
                )}

                <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: info.cor }} />
                    <span className="truncate">{info.nome}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 flex-shrink-0">{formatRelative(a.atualizadoEm)}</span>
                </div>

                {confirmDeleteId === a.id && (
                  <div className="absolute inset-0 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <p className="text-sm text-slate-700 dark:text-slate-200">Excluir esta anotação?</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
                      <button onClick={() => excluir(a.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-600 text-white hover:bg-red-700">
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
