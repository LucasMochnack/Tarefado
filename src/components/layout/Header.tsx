import { useState } from 'react'
import { Search, Plus, Sun, Moon, LogOut, User } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { VoiceInputButton } from '@/components/shared/VoiceInputButton'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { ProjectFormModal } from '@/components/projects/ProjectFormModal'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Header() {
  const { darkMode, toggleDarkMode, logout, usuarioNome } = useStore()
  const [taskOpen, setTaskOpen] = useState(false)
  const [projectOpen, setProjectOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate(`/tarefas?busca=${encodeURIComponent(search.trim())}`)
  }

  return (
    <>
      <header className="h-16 flex items-center gap-3 px-6 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              type="text"
              placeholder="Buscar tarefas, projetos..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto">
          <VoiceInputButton size="sm" />

          <button
            onClick={() => setTaskOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Tarefa</span>
          </button>

          <button
            onClick={() => setProjectOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            <span className="hidden md:inline">Projeto</span>
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'Modo claro' : 'Modo escuro'}
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Avatar + logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700 ml-1">
            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <User size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="hidden lg:inline font-medium text-[13px]">{usuarioNome}</span>
            </div>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <TaskFormModal open={taskOpen} onOpenChange={setTaskOpen} />
      <ProjectFormModal open={projectOpen} onOpenChange={setProjectOpen} />
    </>
  )
}
