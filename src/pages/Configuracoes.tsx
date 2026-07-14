import { Sun, Moon, Trash2, RefreshCw, Database, Zap, Plus, Edit2, Camera, Save, X, Download, Upload } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Usuario } from '@/store/useStore'
import { TAREFAS_INICIAIS, PROJETOS_INICIAIS } from '@/data/mockData'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useState, useRef } from 'react'
import { Time } from '@/types'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const CORES_USUARIO = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#64748b',
]

const TODOS_TIMES: { value: Time; label: string }[] = [
  { value: 'alta-renda', label: 'Alta Renda' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'on-demand', label: 'On Demand' },
  { value: 'b2c', label: 'B2C' },
  { value: 'campinas', label: 'Campinas' },
  { value: 'produtos', label: 'Produtos' },
  { value: 'performance', label: 'Performance ★' },
  { value: 'geral', label: 'Geral' },
]


export function Configuracoes() {
  const {
    darkMode, toggleDarkMode,
    tarefas,
    recalcularPrioridades,
    usuarios, updateUsuario, addUsuario,
    tarefasRecorrentes,
  } = useStore()

  const [resetOpen, setResetOpen] = useState(false)
  const [editandoUsuarioId, setEditandoUsuarioId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', email: '', senha: '', cargo: '' })
  const [novoUsuarioOpen, setNovoUsuarioOpen] = useState(false)
  const [novoForm, setNovoForm] = useState({ nome: '', email: '', senha: '', cargo: '', admin: false })

  const iCls = 'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30'

  const [restaurarOpen, setRestaurarOpen] = useState(false)
  const [importData, setImportData] = useState<any | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleReset = () => {
    useStore.setState({ tarefas: TAREFAS_INICIAIS, projetos: PROJETOS_INICIAIS })
    toast.success('Dados de demonstração restaurados.')
    setRestaurarOpen(false)
  }

  const handleClearAll = () => {
    useStore.setState({ tarefas: [], projetos: [] })
    toast.success('Todos os dados foram limpos!')
  }

  // ── Backup ──────────────────────────────────────────────
  const handleExport = () => {
    const s = useStore.getState()
    const dump = {
      _app: 'tarefado',
      _versao: 1,
      _exportadoEm: new Date().toISOString(),
      tarefas: s.tarefas,
      projetos: s.projetos,
      usuarios: s.usuarios,
      tarefasRecorrentes: s.tarefasRecorrentes,
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tarefado-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup exportado!')
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        if (!Array.isArray(data.tarefas)) throw new Error('formato inválido')
        setImportData(data)
      } catch {
        toast.error('Arquivo de backup inválido.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleImportConfirm = () => {
    const d = importData
    if (!d) return
    useStore.setState({
      tarefas: Array.isArray(d.tarefas) ? d.tarefas : [],
      projetos: Array.isArray(d.projetos) ? d.projetos : [],
      usuarios: Array.isArray(d.usuarios) && d.usuarios.length ? d.usuarios : useStore.getState().usuarios,
      tarefasRecorrentes: Array.isArray(d.tarefasRecorrentes) ? d.tarefasRecorrentes : [],
    })
    setImportData(null)
    toast.success('Backup restaurado com sucesso!')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Personalize a experiência do Tarefado</p>
      </div>

      {/* Aparência */}
      <Section title="Aparência">
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-500" />}
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Modo {darkMode ? 'Escuro' : 'Claro'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Alterna entre tema claro e escuro</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors duration-300',
              darkMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
            )}
          >
            <div className={cn(
              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300',
              darkMode ? 'left-6' : 'left-0.5'
            )} />
          </button>
        </div>
      </Section>

      {/* Usuários e Cores */}
      <Section title="Usuários" action={
        <button
          onClick={() => { setNovoUsuarioOpen(o => !o); setEditandoUsuarioId(null) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
        >
          <Plus size={13} /> Novo usuário
        </button>
      }>
        <div className="space-y-4">

          {/* Formulário novo usuário */}
          {novoUsuarioOpen && (
            <div className="border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4 space-y-3 bg-indigo-50/50 dark:bg-indigo-950/10">
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">Novo usuário</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Nome *</label>
                  <input value={novoForm.nome} onChange={e => setNovoForm(f => ({ ...f, nome: e.target.value }))} className={iCls} placeholder="Nome completo" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">E-mail *</label>
                  <input type="email" value={novoForm.email} onChange={e => setNovoForm(f => ({ ...f, email: e.target.value }))} className={iCls} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Senha *</label>
                  <input type="password" value={novoForm.senha} onChange={e => setNovoForm(f => ({ ...f, senha: e.target.value }))} className={iCls} placeholder="Senha de acesso" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Cargo / Time principal</label>
                  <select value={novoForm.cargo} onChange={e => setNovoForm(f => ({ ...f, cargo: e.target.value }))} className={iCls}>
                    <option value="">— Sem cargo —</option>
                    <option value="Administrador">Administrador</option>
                    {TODOS_TIMES.map(t => <option key={t.value} value={t.label.replace(' ★', '')}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={novoForm.admin} onChange={e => setNovoForm(f => ({ ...f, admin: e.target.checked }))} className="accent-indigo-600" />
                <span className="text-xs text-slate-600 dark:text-slate-300">Administrador (acesso total)</span>
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => { setNovoUsuarioOpen(false); setNovoForm({ nome: '', email: '', senha: '', cargo: '', admin: false }) }} className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
                <button
                  onClick={() => {
                    if (!novoForm.nome.trim()) { toast.error('Nome obrigatório'); return }
                    if (!novoForm.email.trim()) { toast.error('E-mail obrigatório'); return }
                    if (!novoForm.senha.trim()) { toast.error('Senha obrigatória'); return }
                    addUsuario({ nome: novoForm.nome.trim(), email: novoForm.email.trim(), senha: novoForm.senha, cargo: novoForm.cargo || undefined, admin: novoForm.admin, cor: '#6366f1' })
                    toast.success('Usuário criado!')
                    setNovoUsuarioOpen(false)
                    setNovoForm({ nome: '', email: '', senha: '', cargo: '', admin: false })
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Save size={12} /> Criar usuário
                </button>
              </div>
            </div>
          )}
          {usuarios.map(u => {
            const timesUsuario: string[] = u.times ?? []
            const toggleTime = (time: Time) => {
              const novos = timesUsuario.includes(time)
                ? timesUsuario.filter(t => t !== time)
                : [...timesUsuario, time]
              updateUsuario(u.id, { times: novos })
              toast.success('Times atualizados!')
            }
            const veeTudo = u.admin || timesUsuario.includes('performance') || timesUsuario.length === 0
            const isEditando = editandoUsuarioId === u.id

            const startEdit = () => {
              setEditandoUsuarioId(u.id)
              setEditForm({ nome: u.nome, email: u.email, senha: u.senha, cargo: u.cargo ?? '' })
            }
            const cancelEdit = () => setEditandoUsuarioId(null)
            const saveEdit = () => {
              if (!editForm.nome.trim()) { toast.error('Nome obrigatório'); return }
              if (!editForm.email.trim()) { toast.error('E-mail obrigatório'); return }
              updateUsuario(u.id, { nome: editForm.nome.trim(), email: editForm.email.trim(), senha: editForm.senha || u.senha, cargo: editForm.cargo || undefined })
              toast.success('Usuário atualizado!')
              setEditandoUsuarioId(null)
            }

            return (
            <div key={u.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
              {/* Linha superior: avatar + nome + editar */}
              <div className="flex items-center gap-3">
                {/* Avatar com upload */}
                <label className="relative cursor-pointer group flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: u.foto ? undefined : (u.cor ?? '#6366f1') }}
                  >
                    {u.foto
                      ? <img src={u.foto} alt={u.nome} className="w-full h-full object-cover" />
                      : u.nome.charAt(0).toUpperCase()
                    }
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={14} className="text-white" />
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return
                    const reader = new FileReader()
                    reader.onload = ev => { updateUsuario(u.id, { foto: ev.target?.result as string }); toast.success('Foto atualizada!') }
                    reader.readAsDataURL(file)
                  }} />
                </label>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{u.nome}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                    {u.cargo && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        {u.cargo}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={isEditando ? cancelEdit : startEdit}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition-colors flex-shrink-0"
                  title={isEditando ? 'Cancelar' : 'Editar usuário'}
                >
                  {isEditando ? <X size={15} /> : <Edit2 size={14} />}
                </button>
              </div>

              {/* Formulário de edição inline */}
              {isEditando && (
                <div className="border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-3 space-y-2.5 bg-white dark:bg-slate-900">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Nome</label>
                      <input value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} className={iCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">E-mail</label>
                      <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={iCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Nova senha</label>
                      <input type="password" placeholder="Deixe em branco para manter" value={editForm.senha} onChange={e => setEditForm(f => ({ ...f, senha: e.target.value }))} className={iCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Cargo / Time principal</label>
                      <select value={editForm.cargo} onChange={e => setEditForm(f => ({ ...f, cargo: e.target.value }))} className={iCls}>
                        <option value="">— Sem cargo —</option>
                        <option value="Administrador">Administrador</option>
                        {TODOS_TIMES.map(t => <option key={t.value} value={t.label.replace(' ★', '')}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
                    <button onClick={saveEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-indigo-600 text-white hover:bg-indigo-700">
                      <Save size={12} /> Salvar
                    </button>
                  </div>
                </div>
              )}

              {/* Cores */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs text-slate-400 mr-1">Cor:</p>
                {CORES_USUARIO.map(cor => (
                  <button key={cor} onClick={() => { updateUsuario(u.id, { cor }); toast.success('Cor atualizada!') }}
                    className={cn('w-4 h-4 rounded-full transition-transform hover:scale-110', u.cor === cor && 'ring-2 ring-offset-1 ring-slate-400 dark:ring-slate-600')}
                    style={{ backgroundColor: cor }} title={cor}
                  />
                ))}
              </div>

              {/* Times de acesso */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Times com acesso
                  </p>
                  {veeTudo && (
                    <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                      {u.admin ? 'Admin — vê tudo' : 'Vê todos os times'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TODOS_TIMES.map(t => {
                    const ativo = timesUsuario.includes(t.value)
                    return (
                      <button
                        key={t.value}
                        onClick={() => !u.admin && toggleTime(t.value)}
                        disabled={u.admin}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors',
                          ativo
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600',
                          u.admin && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                </div>
                {!u.admin && timesUsuario.length === 0 && (
                  <p className="text-[11px] text-slate-400 mt-1.5 italic">Nenhum time selecionado → acesso a todos</p>
                )}
              </div>
            </div>
            )
          })}
        </div>
      </Section>

      {/* Dados */}
      <Section title="Dados e Persistência">
        <div className="space-y-3">
          <InfoRow label="Total de tarefas" value={tarefas.length.toString()} />
          <InfoRow label="Tarefas recorrentes" value={tarefasRecorrentes.length.toString()} />
          <InfoRow label="Armazenamento" value="localStorage (local)" />
          <InfoRow label="Persistência" value="Automática" />
        </div>

        {/* Backup */}
        <div className="mt-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/20 p-4">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Backup dos seus dados</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
            Os dados ficam só neste navegador. Exporte um backup de vez em quando — e use-o para restaurar ou levar seus dados para outro computador.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
            >
              <Download size={14} /> Exportar backup
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              <Upload size={14} /> Importar backup
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImportFile} className="hidden" />
          </div>
        </div>
      </Section>

      {/* Ações */}
      <Section title="Ações">
        <div className="space-y-3">
          <ActionCard
            icon={RefreshCw}
            title="Recalcular prioridades"
            desc="Atualiza o score de prioridade de todas as tarefas com base nas regras de negócio."
            buttonLabel="Recalcular"
            buttonColor="indigo"
            onClick={() => { recalcularPrioridades(); toast.success('Prioridades recalculadas!') }}
          />
          <ActionCard
            icon={Database}
            title="Restaurar dados de demonstração"
            desc="⚠️ Apaga TODAS as suas tarefas e coloca dados fictícios de exemplo no lugar. Faça um backup antes."
            buttonLabel="Restaurar"
            buttonColor="amber"
            onClick={() => setRestaurarOpen(true)}
          />
          <ActionCard
            icon={Trash2}
            title="Limpar todos os dados"
            desc="Remove todas as tarefas e projetos permanentemente. Esta ação não pode ser desfeita."
            buttonLabel="Limpar tudo"
            buttonColor="red"
            onClick={() => setResetOpen(true)}
          />
        </div>
      </Section>

      {/* Sobre */}
      <Section title="Sobre o Tarefado">
        <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-indigo-800 dark:text-indigo-300">Tarefado v1.0</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Sistema de Gestão Comercial de Alta Performance</p>
            <p className="text-xs text-indigo-500 dark:text-indigo-500 mt-2">
              React · TypeScript · Tailwind CSS · dnd-kit · Zustand · Web Speech API
            </p>
          </div>
        </div>
      </Section>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Limpar todos os dados"
        description="Esta ação removerá TODAS as tarefas e projetos permanentemente. Tem certeza?"
        confirmLabel="Limpar tudo"
        onConfirm={handleClearAll}
      />

      <ConfirmDialog
        open={restaurarOpen}
        onOpenChange={setRestaurarOpen}
        title="Restaurar dados de demonstração"
        description="Isto vai APAGAR todas as suas tarefas e projetos atuais e colocar os dados fictícios de exemplo no lugar. Essa ação não pode ser desfeita. Tem certeza?"
        confirmLabel="Sim, restaurar exemplo"
        onConfirm={handleReset}
      />

      <ConfirmDialog
        open={!!importData}
        onOpenChange={v => !v && setImportData(null)}
        title="Importar backup"
        description={importData ? `Restaurar ${importData.tarefas?.length ?? 0} tarefa(s) e ${importData.projetos?.length ?? 0} projeto(s) deste arquivo? Isso substitui os dados atuais deste navegador.` : ''}
        confirmLabel="Importar"
        onConfirm={handleImportConfirm}
      />
    </div>
  )
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  )
}

function ActionCard({ icon: Icon, title, desc, buttonLabel, buttonColor, onClick }: {
  icon: React.ElementType; title: string; desc: string; buttonLabel: string; buttonColor: 'indigo' | 'amber' | 'red'; onClick: () => void
}) {
  const colors = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    amber: 'bg-amber-600 hover:bg-amber-700 text-white',
    red: 'bg-red-600 hover:bg-red-700 text-white',
  }
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      <div className="flex items-start gap-3">
        <Icon size={16} className="text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm">{desc}</p>
        </div>
      </div>
      <button onClick={onClick} className={cn('px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-shrink-0', colors[buttonColor])}>
        {buttonLabel}
      </button>
    </div>
  )
}
