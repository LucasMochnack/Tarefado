import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Kanban, Target, ListTodo, Settings, ChevronRight, Check, ChevronLeft, Plus, Folder, Layers, Pencil, CalendarRange
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { Projeto } from '@/types'
import { ProjectFormModal } from '@/components/projects/ProjectFormModal'

const navItems = [
  { to: '/tarefas', icon: ListTodo, label: 'Tarefas' },
  { to: '/kanban', icon: Kanban, label: 'Kanban' },
  { to: '/prioridades', icon: Target, label: 'Prioridades' },
  { to: '/resumo', icon: CalendarRange, label: 'Resumo' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { projetos, projetoSelecionado, setProjetoSelecionado } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [projModalOpen, setProjModalOpen] = useState(false)
  const [projetoEdit, setProjetoEdit] = useState<Projeto | undefined>(undefined)

  const abrirNovoProjeto = () => { setProjetoEdit(undefined); setProjModalOpen(true) }
  const abrirEditarProjeto = (e: React.MouseEvent, p: Projeto) => {
    e.stopPropagation()
    setProjetoEdit(p)
    setProjModalOpen(true)
  }

  const linkClass = (na: boolean) => cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
    na
      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
    collapsed && 'justify-center'
  )

  const selecionarProjeto = (id: string | null) => {
    setProjetoSelecionado(id)
    // Se estiver fora das telas de tarefas, leva para a lista filtrada
    if (location.pathname.startsWith('/configuracoes')) navigate('/tarefas')
  }

  const projItemClass = (ativo: boolean) => cn(
    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
    ativo
      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
    collapsed && 'justify-center px-0'
  )

  return (
    <aside className={cn(
      'flex flex-col h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-slate-200 dark:border-slate-800 px-4', collapsed ? 'justify-center' : 'justify-between')}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-[0_6px_16px_-8px_theme(colors.indigo.500)]">
            <Check size={19} strokeWidth={3} className="text-indigo-950" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-none">
              <div className="font-display font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">Tarefado</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 mt-1">Alto Valor</div>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className={cn(
            'p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
            collapsed && 'hidden'
          )}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Nav principal + Projetos */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) => linkClass(isActive)}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}

        {/* ── Projetos ── */}
        <div className="pt-4 mt-3 border-t border-slate-200 dark:border-slate-800">
          {!collapsed && (
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Projetos</span>
              <button
                onClick={abrirNovoProjeto}
                title="Novo projeto"
                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          )}

          {/* Todos os projetos */}
          <button
            onClick={() => selecionarProjeto(null)}
            title={collapsed ? 'Todos os projetos' : undefined}
            className={projItemClass(projetoSelecionado === null)}
          >
            <Layers size={16} className="flex-shrink-0" />
            {!collapsed && <span className="flex-1 truncate">Todos os projetos</span>}
          </button>

          {/* Lista de projetos */}
          {projetos.map(p => {
            const ativo = projetoSelecionado === p.id
            if (collapsed) {
              return (
                <button
                  key={p.id}
                  onClick={() => selecionarProjeto(p.id)}
                  title={p.nome}
                  className={projItemClass(ativo)}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10 dark:ring-white/10"
                    style={{ backgroundColor: p.cor }}
                  />
                </button>
              )
            }
            return (
              <div
                key={p.id}
                className={cn(
                  'group flex items-center rounded-lg transition-colors',
                  ativo ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <button
                  onClick={() => selecionarProjeto(p.id)}
                  className={cn(
                    'flex-1 min-w-0 flex items-center gap-2.5 pl-3 pr-1 py-2 text-sm font-medium text-left transition-colors',
                    ativo ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100'
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10 dark:ring-white/10"
                    style={{ backgroundColor: p.cor }}
                  />
                  <span className="flex-1 truncate">{p.nome}</span>
                </button>
                <button
                  onClick={e => abrirEditarProjeto(e, p)}
                  title="Editar projeto (nome, cor…)"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 mr-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-all flex-shrink-0"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )
          })}

          {/* Novo projeto (quando recolhido) */}
          {collapsed && (
            <button
              onClick={abrirNovoProjeto}
              title="Novo projeto"
              className="w-full flex justify-center py-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus size={16} />
            </button>
          )}

          {projetos.length === 0 && !collapsed && (
            <p className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 italic flex items-center gap-1.5">
              <Folder size={12} /> Nenhum projeto
            </p>
          )}
        </div>
      </nav>

      {/* Configurações — discreto no rodapé */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-2 space-y-0.5">
        <NavLink
          to="/configuracoes"
          title={collapsed ? 'Configurações' : undefined}
          className={({ isActive }) => linkClass(isActive)}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </NavLink>
        {collapsed && (
          <button
            onClick={onToggle}
            className="w-full p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-center"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      <ProjectFormModal
        key={projetoEdit?.id ?? 'novo'}
        open={projModalOpen}
        onOpenChange={setProjModalOpen}
        projeto={projetoEdit}
      />
    </aside>
  )
}
