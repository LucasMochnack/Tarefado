import { Sun, Moon, Trash2, RefreshCw, Database, Zap, Plus, Edit2, ToggleLeft, ToggleRight, Camera } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { TAREFAS_INICIAIS, PROJETOS_INICIAIS } from '@/data/mockData'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { RecorrenteFormModal } from '@/components/tasks/RecorrenteFormModal'
import { useState } from 'react'
import { TarefaRecorrente, Time } from '@/types'
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

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function Configuracoes() {
  const {
    darkMode, toggleDarkMode,
    tarefas, projetos,
    recalcularPrioridades,
    usuarios, updateUsuario,
    tarefasRecorrentes, deleteTarefaRecorrente, updateTarefaRecorrente,
  } = useStore()

  const [resetOpen, setResetOpen] = useState(false)
  const [recorrenteModal, setRecorrenteModal] = useState(false)
  const [editandoRecorrente, setEditandoRecorrente] = useState<TarefaRecorrente | undefined>()

  const handleReset = () => {
    useStore.setState({ tarefas: TAREFAS_INICIAIS, projetos: PROJETOS_INICIAIS })
    toast.success('Dados resetados para os valores iniciais!')
  }

  const handleClearAll = () => {
    useStore.setState({ tarefas: [], projetos: [] })
    toast.success('Todos os dados foram limpos!')
  }

  const openNovaRecorrente = () => {
    setEditandoRecorrente(undefined)
    setRecorrenteModal(true)
  }

  const openEditarRecorrente = (r: TarefaRecorrente) => {
    setEditandoRecorrente(r)
    setRecorrenteModal(true)
  }

  const descRecorrencia = (r: TarefaRecorrente) => {
    if (r.tipoRecorrencia === 'diaria') return 'Todos os dias'
    if (r.tipoRecorrencia === 'mensal') return `Todo dia ${r.diaMes}`
    const dias = r.diasSemana.sort().map(d => DIAS_SEMANA[d]).join(', ')
    return `Toda ${dias}`
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
      <Section title="Usuários">
        <div className="space-y-4">
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

            return (
            <div key={u.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
              {/* Linha superior: avatar + nome + cores */}
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
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = ev => {
                        updateUsuario(u.id, { foto: ev.target?.result as string })
                        toast.success('Foto atualizada!')
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{u.nome}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {CORES_USUARIO.map(cor => (
                    <button
                      key={cor}
                      onClick={() => { updateUsuario(u.id, { cor }); toast.success('Cor atualizada!') }}
                      className={cn(
                        'w-4 h-4 rounded-full transition-transform hover:scale-110',
                        u.cor === cor && 'ring-2 ring-offset-1 ring-slate-400 dark:ring-slate-600'
                      )}
                      style={{ backgroundColor: cor }}
                      title={cor}
                    />
                  ))}
                </div>
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

      {/* Tarefas Recorrentes */}
      <Section title="Tarefas Recorrentes">
        <div className="space-y-2">
          {tarefasRecorrentes.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic py-2">Nenhuma tarefa recorrente configurada.</p>
          )}
          {tarefasRecorrentes.map(r => (
            <div key={r.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group">
              <div className={cn('mt-1 w-2 h-2 rounded-full flex-shrink-0', r.ativa ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600')} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{r.titulo}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {descRecorrencia(r)}
                  {r.horaAgenda && ` · ${r.horaAgenda}`}
                  {r.responsavel && ` · ${r.responsavel}`}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => updateTarefaRecorrente(r.id, { ativa: !r.ativa })}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition-colors"
                  title={r.ativa ? 'Desativar' : 'Ativar'}
                >
                  {r.ativa ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button
                  onClick={() => openEditarRecorrente(r)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => { deleteTarefaRecorrente(r.id); toast.success('Removida!') }}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={openNovaRecorrente}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            <Plus size={14} /> Nova tarefa recorrente
          </button>
        </div>
      </Section>

      {/* Dados */}
      <Section title="Dados e Persistência">
        <div className="space-y-3">
          <InfoRow label="Total de tarefas" value={tarefas.length.toString()} />
          <InfoRow label="Total de projetos" value={projetos.length.toString()} />
          <InfoRow label="Tarefas recorrentes" value={tarefasRecorrentes.length.toString()} />
          <InfoRow label="Armazenamento" value="localStorage (local)" />
          <InfoRow label="Persistência" value="Automática" />
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
            desc="Recarrega os dados fictícios iniciais. Dados atuais serão sobrescritos."
            buttonLabel="Restaurar"
            buttonColor="amber"
            onClick={handleReset}
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

      <RecorrenteFormModal
        open={recorrenteModal}
        onOpenChange={setRecorrenteModal}
        recorrente={editandoRecorrente}
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-4">{title}</h2>
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
