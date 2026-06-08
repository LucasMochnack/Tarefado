import { NavLink } from 'react-router-dom'
import {
  Kanban, Target, ListTodo, Settings, ChevronRight, Check, ChevronLeft
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
