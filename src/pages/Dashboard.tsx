import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ListTodo, PlayCircle, CheckCircle2, AlertTriangle,
  Clock, FolderOpen, Flame, PauseCircle, TrendingUp,
  ArrowRight, Calendar, Users, UserPlus, Trash2, Eye, EyeOff, ShieldCheck, Shield
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Usuario } from '@/store/useStore'
import { StatCard } from '@/components/shared/StatCard'
import { PriorityBadge, ScoreBadge } from '@/components/shared/PriorityBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TimeBadge } from '@/components/shared/TimeBadge'
import { TaskDetailsDrawer } from '@/components/tasks/TaskDetailsDrawer'
import { Tarefa, Time } from '@/types'
import { isOverdue, daysSinceUpdate, formatDate, formatRelative, prazoLabel } from '@/utils/dates'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { cn } from '@/lib/utils'

const TIME_COLORS: Record<Time, string> = {
  b2c: '#8b5cf6',
  campinas: '#3b82f6',
  produtos: '#10b981',
  geral: '#6b7280',
}

export function Dashboard() {
  const { tarefas, projetos, usuarios, addUsuario, deleteUsuario, usuarioEmail } = useStore()
  const navigate = useNavigate()
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null)

  // Stats
  const pendentes = tarefas.filter(t => t.status === 'a-fazer').length
  const andamento = tarefas.filter(t => t.status === 'em-andamento').length
  const concluidasHoje = tarefas.filter(t => {
    if (t.status !== 'concluido') return false
    const d = new Date(t.atualizadoEm)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }).length
  const atrasadas = tarefas.filter(t => isOverdue(t.prazo) && t.status !== 'concluido').length
  const aguardando = tarefas.filter(t => t.status === 'aguardando').length
  const projetosAtivos = projetos.filter(p => p.status === 'ativo').length
  const criticas = tarefas.filter(t => t.nivelPrioridade === 'critica' && t.status !== 'concluido').length
  const paradas = tarefas.filter(t => daysSinceUpdate(t.ultimaAtualizacao) > 7 && t.status !== 'concluido').length

  // Próximas entregas
  const proximasEntregas = tarefas
    .filter(t => t.status !== 'concluido' && !isOverdue(t.prazo))
    .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime())
    .slice(0, 5)

  // Atrasadas
  const tarefasAtrasadas = tarefas
    .filter(t => isOverdue(t.prazo) && t.status !== 'concluido')
    .sort((a, b) => b.scorePrioridade - a.scorePrioridade)
    .slice(0, 5)

  // Prioridades críticas
  const prioridadesCriticas = tarefas
    .filter(t => t.nivelPrioridade === 'critica' && t.status !== 'concluido')
    .sort((a, b) => b.scorePrioridade - a.scorePrioridade)
    .slice(0, 5)

  // Recentemente atualizadas
  const recentementeAtualizadas = [...tarefas]
    .sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime())
    .slice(0, 6)

  // Chart data
  const statusData = [
    { name: 'A Fazer', value: pendentes, fill: '#94a3b8' },
    { name: 'Andamento', value: andamento, fill: '#3b82f6' },
    { name: 'Aguardando', value: aguardando, fill: '#f59e0b' },
    { name: 'Concluído', value: tarefas.filter(t => t.status === 'concluido').length, fill: '#10b981' },
  ]

  const priorityData = [
    { name: 'Crítica', value: tarefas.filter(t => t.nivelPrioridade === 'critica').length, fill: '#ef4444' },
    { name: 'Alta', value: tarefas.filter(t => t.nivelPrioridade === 'alta').length, fill: '#f97316' },
    { name: 'Média', value: tarefas.filter(t => t.nivelPrioridade === 'media').length, fill: '#f59e0b' },
    { name: 'Baixa', value: tarefas.filter(t => t.nivelPrioridade === 'baixa').length, fill: '#94a3b8' },
  ]

  // Team stats
  const times: Time[] = ['b2c', 'campinas', 'produtos']
  const timeStats = times.map(time => {
    const tt = tarefas.filter(t => t.time === time)
    const total = tt.length
    const concluidas = tt.filter(t => t.status === 'concluido').length
    return {
      time,
      label: time === 'b2c' ? 'B2C' : time === 'campinas' ? 'Campinas' : 'Produtos',
      pendentes: tt.filter(t => t.status === 'a-fazer').length,
      atrasadas: tt.filter(t => isOverdue(t.prazo) && t.status !== 'concluido').length,
      criticas: tt.filter(t => t.nivelPrioridade === 'critica' && t.status !== 'concluido').length,
      pct: total > 0 ? Math.round((concluidas / total) * 100) : 0,
      color: TIME_COLORS[time],
    }
  })

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Visão executiva da operação comercial</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Pendentes" value={pendentes} icon={ListTodo} color="slate" onClick={() => navigate('/tarefas')} />
        <StatCard label="Em Andamento" value={andamento} icon={PlayCircle} color="blue" onClick={() => navigate('/kanban')} />
        <StatCard label="Concluídas hoje" value={concluidasHoje} icon={CheckCircle2} color="green" />
        <StatCard label="Atrasadas" value={atrasadas} icon={AlertTriangle} color="red" onClick={() => navigate('/tarefas')} />
        <StatCard label="Aguardando" value={aguardando} icon={Clock} color="amber" />
        <StatCard label="Proj. Ativos" value={projetosAtivos} icon={FolderOpen} color="violet" onClick={() => navigate('/projetos')} />
        <StatCard label="Críticas" value={criticas} icon={Flame} color="red" onClick={() => navigate('/prioridades')} />
        <StatCard label="Paradas" value={paradas} icon={PauseCircle} color="orange" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Próximas entregas */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <SectionHeader title="Próximas Entregas" icon={Calendar} onViewAll={() => navigate('/tarefas')} />
          <div className="space-y-2 mt-4">
            {proximasEntregas.length === 0 && <EmptyState text="Nenhuma entrega próxima" />}
            {proximasEntregas.map(t => (
              <TaskRow key={t.id} tarefa={t} projetos={projetos} onClick={() => setSelectedTarefa(t)} />
            ))}
          </div>
        </div>

        {/* Atrasadas */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/40 p-5">
          <SectionHeader title="Tarefas Atrasadas" icon={AlertTriangle} iconColor="text-red-500" onViewAll={() => navigate('/tarefas')} />
          <div className="space-y-2 mt-4">
            {tarefasAtrasadas.length === 0 && <EmptyState text="Nenhuma tarefa atrasada 🎉" />}
            {tarefasAtrasadas.map(t => (
              <TaskRow key={t.id} tarefa={t} projetos={projetos} onClick={() => setSelectedTarefa(t)} highlight="red" />
            ))}
          </div>
        </div>

        {/* Prioridades críticas */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-orange-200 dark:border-orange-900/40 p-5">
          <SectionHeader title="Prioridades Críticas" icon={Flame} iconColor="text-orange-500" onViewAll={() => navigate('/prioridades')} />
          <div className="space-y-2 mt-4">
            {prioridadesCriticas.length === 0 && <EmptyState text="Sem prioridades críticas 🎉" />}
            {prioridadesCriticas.map(t => (
              <div key={t.id} className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors" onClick={() => setSelectedTarefa(t)}>
                <ScoreBadge score={t.scorePrioridade} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{t.titulo}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t.motivoPrioridade}</p>
                </div>
                <TimeBadge time={t.time} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts + Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Status chart */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Tarefas por Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority chart */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Distribuição de Prioridade</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recently updated */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <SectionHeader title="Recentemente Atualizadas" icon={TrendingUp} onViewAll={() => navigate('/tarefas')} />
          <div className="space-y-2 mt-4">
            {recentementeAtualizadas.map(t => (
              <div key={t.id} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg px-2 transition-colors" onClick={() => setSelectedTarefa(t)}>
                <StatusBadge status={t.status} size="xs" />
                <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 truncate">{t.titulo}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{formatRelative(t.atualizadoEm)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Summary */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users size={18} className="text-indigo-500" />
            Resumo dos Times
          </h2>
          <button onClick={() => navigate('/times')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
            Ver times <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {timeStats.map(ts => (
            <div
              key={ts.time}
              onClick={() => navigate(`/times/${ts.time}`)}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ts.color }} />
                <h3 className="font-bold text-slate-900 dark:text-white">{ts.label}</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-700 dark:text-slate-200">{ts.pendentes}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">Pendentes</div>
                </div>
                <div className="text-center">
                  <div className={cn('text-xl font-bold', ts.atrasadas > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200')}>{ts.atrasadas}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">Atrasadas</div>
                </div>
                <div className="text-center">
                  <div className={cn('text-xl font-bold', ts.criticas > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-200')}>{ts.criticas}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">Críticas</div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Concluído na semana</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{ts.pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${ts.pct}%`, backgroundColor: ts.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gerenciamento de Usuários */}
      <GerenciarUsuarios
        usuarios={usuarios}
        usuarioAtualEmail={usuarioEmail}
        onAdd={addUsuario}
        onDelete={deleteUsuario}
      />

      <TaskDetailsDrawer tarefa={selectedTarefa} onClose={() => setSelectedTarefa(null)} />
    </div>
  )
}

function GerenciarUsuarios({
  usuarios, usuarioAtualEmail, onAdd, onDelete
}: {
  usuarios: Usuario[]
  usuarioAtualEmail: string
  onAdd: (u: Omit<Usuario, 'id'>) => void
  onDelete: (id: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [admin, setAdmin] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !email.trim() || !senha.trim()) { setErro('Preencha todos os campos.'); return }
    if (usuarios.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) { setErro('E-mail já cadastrado.'); return }
    onAdd({ nome: nome.trim(), email: email.trim().toLowerCase(), senha: senha.trim(), admin })
    setNome(''); setEmail(''); setSenha(''); setAdmin(false); setErro(''); setAberto(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users size={18} className="text-emerald-500" />
          Usuários do Sistema
        </h2>
        <button
          onClick={() => setAberto(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
        >
          <UserPlus size={13} /> Adicionar usuário
        </button>
      </div>

      {/* Formulário de adição */}
      {aberto && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/50 p-5 mb-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Novo Usuário</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Nome</label>
              <input
                value={nome} onChange={e => { setNome(e.target.value); setErro('') }}
                placeholder="João Silva"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">E-mail</label>
              <input
                type="email" value={email} onChange={e => { setEmail(e.target.value); setErro('') }}
                placeholder="joao@email.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={e => { setSenha(e.target.value); setErro('') }}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button type="button" onClick={() => setMostrarSenha(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Permissão</label>
              <div className="flex items-center gap-4 mt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={admin} onChange={e => setAdmin(e.target.checked)} className="rounded accent-emerald-500" />
                  <span className="text-xs text-slate-700 dark:text-slate-300">Administrador</span>
                </label>
                <button type="submit" className="ml-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">
                  Salvar
                </button>
              </div>
            </div>
          </form>
          {erro && <p className="text-xs text-red-500 mt-2">{erro}</p>}
        </div>
      )}

      {/* Tabela de usuários */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">E-mail</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Perfil</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold flex-shrink-0">
                      {u.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{u.nome}</span>
                    {u.email === usuarioAtualEmail && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium">você</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  {u.admin
                    ? <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium"><ShieldCheck size={13} /> Admin</span>
                    : <span className="flex items-center gap-1 text-xs text-slate-400 font-medium"><Shield size={13} /> Usuário</span>
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  {u.email !== usuarioAtualEmail && (
                    <button
                      onClick={() => { if (confirm(`Remover ${u.nome}?`)) onDelete(u.id) }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Remover usuário"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SectionHeader({ title, icon: Icon, iconColor = 'text-slate-500', onViewAll }: {
  title: string; icon: React.ElementType; iconColor?: string; onViewAll?: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
        <Icon size={15} className={iconColor} />
        {title}
      </h3>
      {onViewAll && (
        <button onClick={onViewAll} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
          Ver todos <ArrowRight size={11} />
        </button>
      )}
    </div>
  )
}

function TaskRow({ tarefa, projetos, onClick, highlight }: {
  tarefa: Tarefa; projetos: any[]; onClick: () => void; highlight?: 'red'
}) {
  const projeto = projetos.find((p: any) => p.id === tarefa.projetoId)
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors',
        highlight === 'red'
          ? 'hover:bg-red-50 dark:hover:bg-red-950/20'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
      )}
      onClick={onClick}
    >
      <PriorityBadge nivel={tarefa.nivelPrioridade} size="xs" showIcon={false} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{tarefa.titulo}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {projeto?.nome} · {prazoLabel(tarefa.prazo, tarefa.status)}
        </p>
      </div>
      <TimeBadge time={tarefa.time} />
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">{text}</p>
}
