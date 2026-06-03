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
    // Processa ao abrir o app e sempre que a aba volta ao foco
    // (cobre o caso de deixar o app aberto e virar o dia)
    processarRecorrentes()
    const onFocus = () => processarRecorrentes()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [processarRecorrentes])

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(110%_80%_at_100%_0%,rgba(11,156,117,0.06),transparent_55%),radial-gradient(90%_70%_at_0%_100%,rgba(212,145,47,0.05),transparent_50%)]">
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
