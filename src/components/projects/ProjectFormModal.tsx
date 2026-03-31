import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Projeto, QuadranteEisenhower, StatusProjeto, Time } from '@/types'
import { addDaysISO } from '@/utils/dates'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface ProjectFormModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  projeto?: Projeto
}

const CORES = ['#ef4444','#f97316','#f59e0b','#10b981','#3b82f6','#8b5cf6','#06b6d4','#ec4899','#6b7280']

export function ProjectFormModal({ open, onOpenChange, projeto }: ProjectFormModalProps) {
  const { addProjeto, updateProjeto } = useStore()
  const isEdit = !!projeto

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    quadranteEisenhower: 'importante-urgente' as QuadranteEisenhower,
    prazoFinal: addDaysISO(30).slice(0, 10),
    status: 'ativo' as StatusProjeto,
    cor: '#3b82f6',
    time: 'b2c' as Time,
  })

  useEffect(() => {
    if (projeto) {
      setForm({
        nome: projeto.nome,
        descricao: projeto.descricao,
        quadranteEisenhower: projeto.quadranteEisenhower,
        prazoFinal: projeto.prazoFinal.slice(0, 10),
        status: projeto.status,
        cor: projeto.cor,
        time: projeto.time,
      })
    } else {
      setForm({
        nome: '',
        descricao: '',
        quadranteEisenhower: 'importante-urgente',
        prazoFinal: addDaysISO(30).slice(0, 10),
        status: 'ativo',
        cor: '#3b82f6',
        time: 'b2c',
      })
    }
  }, [projeto, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form, prazoFinal: new Date(form.prazoFinal).toISOString() }
    if (isEdit && projeto) {
      updateProjeto(projeto.id, data)
      toast.success('Projeto atualizado!')
    } else {
      addProjeto(data)
      toast.success('Projeto criado!')
    }
    onOpenChange(false)
  }

  const inputClass = 'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors'
  const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <Dialog.Title className="font-bold text-slate-900 dark:text-white text-lg">
              {isEdit ? 'Editar Projeto' : 'Novo Projeto'}
            </Dialog.Title>
            <Dialog.Close className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className={labelClass}>Nome do projeto *</label>
              <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputClass} placeholder="Ex: Expansão Carteira Premium" />
            </div>
            <div>
              <label className={labelClass}>Descrição</label>
              <textarea rows={3} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} className={cn(inputClass, 'resize-none')} placeholder="Objetivo e contexto do projeto..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Quadrante Eisenhower</label>
                <select value={form.quadranteEisenhower} onChange={e => setForm(f => ({ ...f, quadranteEisenhower: e.target.value as QuadranteEisenhower }))} className={inputClass}>
                  <option value="importante-urgente">🔴 Importante + Urgente</option>
                  <option value="importante-nao-urgente">🟡 Importante + Não Urgente</option>
                  <option value="nao-importante-urgente">🟠 Não Importante + Urgente</option>
                  <option value="nao-importante-nao-urgente">⚪ Não Importante + Não Urgente</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Time</label>
                <select value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value as Time }))} className={inputClass}>
                  <option value="b2c">B2C</option>
                  <option value="campinas">Campinas</option>
                  <option value="produtos">Produtos</option>
                  <option value="geral">Geral</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prazo final</label>
                <input type="date" value={form.prazoFinal} onChange={e => setForm(f => ({ ...f, prazoFinal: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as StatusProjeto }))} className={inputClass}>
                  <option value="ativo">Ativo</option>
                  <option value="pausado">Pausado</option>
                  <option value="concluido">Concluído</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Cor do projeto</label>
              <div className="flex gap-2 flex-wrap mt-1">
                {CORES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, cor: c }))}
                    className={cn('w-7 h-7 rounded-full transition-all', form.cor === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : '')}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
              </Dialog.Close>
              <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                {isEdit ? 'Salvar alterações' : 'Criar projeto'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
