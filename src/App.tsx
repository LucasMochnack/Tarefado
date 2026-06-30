import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Login } from '@/pages/Login'
import { Kanban } from '@/pages/Kanban'
import { Prioridades } from '@/pages/Prioridades'
import { Tarefas } from '@/pages/Tarefas'
import { Resumo } from '@/pages/Resumo'
import { Configuracoes } from '@/pages/Configuracoes'
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
          <Route index element={<Navigate to="/kanban" replace />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/prioridades" element={<Prioridades />} />
          <Route path="/tarefas" element={<Tarefas />} />
          <Route path="/resumo" element={<Resumo />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          {/* Rotas antigas redirecionam para o Kanban */}
          <Route path="*" element={<Navigate to="/kanban" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
