import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Kanban } from '@/pages/Kanban'
import { Projetos } from '@/pages/Projetos'
import { ProjetoDetalhe } from '@/pages/ProjetoDetalhe'
import { Times } from '@/pages/Times'
import { TimeDetalhe } from '@/pages/TimeDetalhe'
import { Prioridades } from '@/pages/Prioridades'
import { Tarefas } from '@/pages/Tarefas'
import { Configuracoes } from '@/pages/Configuracoes'
import { Planejamento } from '@/pages/Planejamento'
import { useStore } from '@/store/useStore'

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const autenticado = useStore(s => s.autenticado)
  if (!autenticado) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RotaProtegida>
              <Layout />
            </RotaProtegida>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/projetos" element={<Projetos />} />
          <Route path="/projetos/:id" element={<ProjetoDetalhe />} />
          <Route path="/times" element={<Times />} />
          <Route path="/times/:slug" element={<TimeDetalhe />} />
          <Route path="/planejamento" element={<Planejamento />} />
          <Route path="/prioridades" element={<Prioridades />} />
          <Route path="/tarefas" element={<Tarefas />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
