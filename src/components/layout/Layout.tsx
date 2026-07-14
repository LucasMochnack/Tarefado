import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Toaster } from 'react-hot-toast'
import { useStore } from '@/store/useStore'
import { iniciarSync } from '@/lib/cloudSync'

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const darkMode = useStore(s => s.darkMode)
  const processarRecorrentes = useStore(s => s.processarRecorrentes)
  const garantirProjetosPadrao = useStore(s => s.garantirProjetosPadrao)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      // 1) puxa os dados da nuvem (ou sobe o local se a nuvem estiver vazia)
      await iniciarSync()
      if (cancel) return
      // 2) garante o projeto Pessoais e gera as tarefas recorrentes do dia
      garantirProjetosPadrao()
      processarRecorrentes()
    })()

    const onFocus = () => processarRecorrentes()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      cancel = true
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [processarRecorrentes, garantirProjetosPadrao])

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(1100px_650px_at_80%_-10%,#e3f3ec_0%,transparent_55%)] dark:bg-[radial-gradient(1200px_700px_at_78%_-8%,#0f1a17_0%,transparent_60%)]">
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
