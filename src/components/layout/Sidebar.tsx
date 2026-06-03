import { NavLink } from 'react-router-dom'
import {
  Kanban, Target, ListTodo, Settings, ChevronRight, Zap, ChevronLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/tarefas', icon: ListTodo, label: 'Tarefas' },
  { to: '/kanban', icon: Kanban, label: 'Kanban' },
  { to: '/prioridades', icon: Target, label: 'Prioridades' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const linkClass = (na: boolean) => cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
    na
      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
    collapsed && 'justify-center'
  )

  return (
    <aside className={cn(
      'flex flex-col h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-slate-200 dark:border-slate-800 px-4', collapsed ? 'justify-center' : 'justify-between')}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          {!collapsed && <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Tarefado</span>}
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

      {/* Nav principal */}
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
    </aside>
  )
}
