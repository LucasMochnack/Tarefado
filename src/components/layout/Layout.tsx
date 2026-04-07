import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Toaster } from 'react-hot-toast'
import { useStore } from '@/store/useStore'

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const darkMode = useStore(s => s.darkMode)
  const processarRecorrentes = useStore(s => s.processarRecorrentes)

  useEffect(() => {
    processarRecorrentes()
  }, [])

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: darkMode ? 'dark' : '',
          style: {
            background: darkMode ? '#1e293b' : '#fff',
            color: darkMode ? '#e2e8f0' : '#1e293b',
            border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '14px',
          },
        }}
      />
    </div>
  )
}
