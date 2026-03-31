import { Sun, Moon, Trash2, RefreshCw, Database, Zap } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { TAREFAS_INICIAIS, PROJETOS_INICIAIS } from '@/data/mockData'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export function Configuracoes() {
  const { darkMode, toggleDarkMode, tarefas, projetos, recalcularPrioridades } = useStore()
  const [resetOpen, setResetOpen] = useState(false)

  const handleReset = () => {
    useStore.setState({ tarefas: TAREFAS_INICIAIS, projetos: PROJETOS_INICIAIS })
    toast.success('Dados resetados para os valores iniciais!')
  }

  const handleClearAll = () => {
    useStore.setState({ tarefas: [], projetos: [] })
    toast.success('Todos os dados foram limpos!')
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

      {/* Dados */}
      <Section title="Dados e Persistência">
        <div className="space-y-3">
          <InfoRow label="Total de tarefas" value={tarefas.length.toString()} />
          <InfoRow label="Total de projetos" value={projetos.length.toString()} />
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
