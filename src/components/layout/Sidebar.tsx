import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Kanban, FolderKanban, Users, Target, ListTodo,
  Settings, ChevronRight, Zap, ChevronLeft, TrendingUp, ShoppingCart, GanttChart, BarChart2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projetos', icon: FolderKanban, label: 'Projetos' },
  {
    to: '/times', icon: Users, label: 'Times', children: [
      { to: '/times/alta-renda', icon: TrendingUp, label: 'Alta Renda' },
      { to: '/times/varejo', icon: ShoppingCart, label: 'Varejo' },
      { to: '/times/on-demand', icon: Zap, label: 'On Demand' },
      { to: '/times/performance', icon: BarChart2, label: 'Performance' },
    ]
  },
  { to: '/planejamento', icon: GanttChart, label: 'Planejamento' },
  { to: '/prioridades', icon: Target, label: 'Prioridades' },
  { to: '/kanban', icon: Kanban, label: 'Kanban' },
  { to: '/tarefas', icon: ListTodo, label: 'Tarefas' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const [timesOpen, setTimesOpen] = useState(location.pathname.startsWith('/times'))

  return (
    <aside className={cn(
      'flex flex-col h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-slate-200 dark:border-slate-800 px-4', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Tarefado</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
        )}
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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to + '/'))
          const isTimesParent = item.to === '/times'

          if (item.children) {
            return (
              <div key={item.to}>
                <button
                  onClick={() => !collapsed && setTimesOpen(o => !o)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    (isActive || timesOpen)
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
                    collapsed && 'justify-center'
                  )}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight size={14} className={cn('transition-transform', timesOpen && 'rotate-90')} />
                    </>
                  )}
                </button>
                {!collapsed && timesOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                    {item.children.map(child => {
                      const ChildIcon = child.icon
                      const childActive = location.pathname === child.to
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={cn(
                            'flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-colors',
                            childActive
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                          )}
                        >
                          <ChildIcon size={14} />
                          {child.label}
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive: na }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                na
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
                collapsed && 'justify-center'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Collapse toggle (when collapsed) */}
      {collapsed && (
        <div className="border-t border-slate-200 dark:border-slate-800 p-2">
          <button
            onClick={onToggle}
            className="w-full p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-center"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </aside>
  )
}
