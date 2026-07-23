import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { arrayMove } from '@dnd-kit/sortable'
import { Tarefa, Projeto, StatusTarefa, TarefaRecorrente, DiaSemana, Anotacao } from '@/types'
import { TAREFAS_INICIAIS, PROJETOS_INICIAIS } from '@/data/mockData'
import { calcularScore, calcularProgressoProjeto } from '@/utils/priority'
import { todayISO, addDaysISO } from '@/utils/dates'

export interface Usuario {
  id: string
  nome: string
  email: string
  senha: string
  admin: boolean
  cor?: string
  foto?: string     // base64 da foto de perfil
  cargo?: string    // cargo/time principal — vira default ao criar tarefa
  times?: string[]  // times que o usuário pode ver; vazio/undefined = vê tudo
  projetosPermitidos?: string[]  // projetos que pode ver; vazio/undefined = vê todos
}

const USUARIO_PADRAO: Usuario = {
  id: 'admin',
  nome: 'Administrador',
  email: 'admin@tarefado.com',
  senha: 'admin123',
  admin: true,
}

// Usuários que sempre existem independente do localStorage
const USUARIOS_INICIAIS: Usuario[] = [
  USUARIO_PADRAO,
  {
    id: 'usr-leonardo',
    nome: 'Leonardo Teixeira',
    email: 'leonardo.teixeira@altovalorinvestimentos.com.br',
    senha: 'cachorro67',
    admin: true,   // vê todos os times
    times: undefined,
  },
]

// Projeto "Pessoais" — sempre existe; suas tarefas ficam ocultas em "Todos os projetos"
const PROJETO_PESSOAIS: Projeto = {
  id: 'proj-pessoais',
  nome: 'Pessoais',
  descricao: 'Tarefas pessoais — ocultas na visão "Todos os projetos".',
  quadranteEisenhower: 'importante-nao-urgente',
  prazoFinal: addDaysISO(365),
  status: 'ativo',
  progresso: 0,
  cor: '#14b8a6',
  time: 'geral',
  criadoEm: todayISO(),
  atualizadoEm: todayISO(),
  ocultarEmTodos: true,
}

interface AppStore {
  tarefas: Tarefa[]
  projetos: Projeto[]
  usuarios: Usuario[]
  tarefasRecorrentes: TarefaRecorrente[]
  anotacoes: Anotacao[]
  darkMode: boolean
  autenticado: boolean
  authInicializado: boolean
  usuarioNome: string
  usuarioEmail: string
  projetoSelecionado: string | null

  garantirProjetosPadrao: () => void
  garantirPerfilUsuario: (email: string) => boolean
  setProjetoSelecionado: (id: string | null) => void
  aplicarSessao: (email: string | null) => void
  login: (email: string, senha: string) => boolean
  logout: () => void
  addUsuario: (usuario: Omit<Usuario, 'id'>) => void
  updateUsuario: (id: string, data: Partial<Omit<Usuario, 'id'>>) => void
  deleteUsuario: (id: string) => void

  addTarefa: (tarefa: Omit<Tarefa, 'id' | 'criadoEm' | 'atualizadoEm' | 'ultimaAtualizacao' | 'scorePrioridade' | 'nivelPrioridade' | 'motivoPrioridade'>) => void
  updateTarefa: (id: string, data: Partial<Tarefa>) => void
  deleteTarefa: (id: string) => void
  moveTarefa: (id: string, novoStatus: StatusTarefa) => void
  reorderTarefas: (activeId: string, overId: string) => void
  reordenarManual: (orderedIds: string[]) => void
  recalcularPrioridades: () => void

  addTarefaRecorrente: (dados: Omit<TarefaRecorrente, 'id' | 'criadoEm' | 'ultimaCriacao'>) => void
  updateTarefaRecorrente: (id: string, data: Partial<TarefaRecorrente>) => void
  deleteTarefaRecorrente: (id: string) => void
  processarRecorrentes: () => void

  addAnotacao: (dados: Omit<Anotacao, 'id' | 'criadoEm' | 'atualizadoEm'>) => void
  updateAnotacao: (id: string, data: Partial<Omit<Anotacao, 'id' | 'criadoEm'>>) => void
  deleteAnotacao: (id: string) => void

  addProjeto: (projeto: Omit<Projeto, 'id' | 'criadoEm' | 'atualizadoEm' | 'progresso'>) => void
  updateProjeto: (id: string, data: Partial<Projeto>) => void
  deleteProjeto: (id: string) => void
  reordenarProjetos: (orderedIds: string[]) => void

  toggleDarkMode: () => void
}

function gerarId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function recalcularTarefa(tarefa: Tarefa, projetos: Projeto[]): Tarefa {
  const projeto = projetos.find(p => p.id === tarefa.projetoId)
  const { score, nivel, motivo } = calcularScore(tarefa, projeto)
  // A criticidade (nível) segue a escolha manual do usuário (prioridade);
  // o Score continua sendo o indicador de urgência automático.
  const nivelFinal = tarefa.prioridade ?? nivel
  return { ...tarefa, scorePrioridade: score, nivelPrioridade: nivelFinal, motivoPrioridade: motivo }
}

function atualizarProgressos(tarefas: Tarefa[], projetos: Projeto[]): Projeto[] {
  return projetos.map(p => ({
    ...p,
    progresso: calcularProgressoProjeto(tarefas, p.id),
    atualizadoEm: todayISO(),
  }))
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      tarefas: TAREFAS_INICIAIS,
      projetos: PROJETOS_INICIAIS,
      usuarios: USUARIOS_INICIAIS,
      tarefasRecorrentes: [],
      anotacoes: [],
      darkMode: true,
      projetoSelecionado: null,
      autenticado: false,
      authInicializado: false,
      usuarioNome: '',
      usuarioEmail: '',

      login: (email, senha) => {
        const emailNorm = email.trim().toLowerCase()
        const senhaTrim = senha.trim()
        const { usuarios } = get()

        // Garante que os usuários seed sempre existam e tenham as permissões corretas
        const idsExistentes = new Set(usuarios.map(u => u.id))
        const faltando = USUARIOS_INICIAIS.filter(u => !idsExistentes.has(u.id))
        // Sincroniza admin/times do seed nos usuários já existentes
        const sincronizados = usuarios.map(u => {
          const seed = USUARIOS_INICIAIS.find(s => s.id === u.id)
          if (!seed) return u
          return { ...u, admin: seed.admin, times: seed.times }
        })
        const lista = faltando.length > 0 ? [...faltando, ...sincronizados] : sincronizados

        const usuario = lista.find(
          u => u.email.toLowerCase() === emailNorm && u.senha === senhaTrim
        )
        if (usuario) {
          // Persiste sempre que houve mudança (novos usuários ou permissões sincronizadas)
          set({ usuarios: lista })
          set({ autenticado: true, usuarioNome: usuario.nome, usuarioEmail: usuario.email })
          return true
        }
        return false
      },

      logout: () => set({ autenticado: false, usuarioNome: '', usuarioEmail: '' }),

      addUsuario: (dados) => {
        const novo: Usuario = { ...dados, id: `usr-${Math.random().toString(36).slice(2, 8)}` }
        set(state => ({ usuarios: [...state.usuarios, novo] }))
      },

      updateUsuario: (id, data) => {
        set(state => ({ usuarios: state.usuarios.map(u => u.id === id ? { ...u, ...data } : u) }))
      },

      deleteUsuario: (id) => {
        set(state => ({ usuarios: state.usuarios.filter(u => u.id !== id) }))
      },

      addTarefa: (dados) => {
        const { projetos } = get()
        const novaTarefa: Tarefa = {
          ...dados,
          id: `tar-${gerarId()}`,
          checklist: dados.checklist || [],
          comentarios: dados.comentarios || [],
          tags: dados.tags || [],
          criadoEm: todayISO(),
          atualizadoEm: todayISO(),
          ultimaAtualizacao: todayISO(),
          scorePrioridade: 0,
          nivelPrioridade: 'baixa',
          motivoPrioridade: '',
        }
        const comScore = recalcularTarefa(novaTarefa, projetos)
        set(state => {
          const novasTarefas = [...state.tarefas, comScore]
          return {
            tarefas: novasTarefas,
            projetos: atualizarProgressos(novasTarefas, state.projetos),
          }
        })
      },

      updateTarefa: (id, data) => {
        const { projetos } = get()
        // Ao concluir: sai da Matriz de Eisenhower e do ranking manual
        // (reabrir traz a tarefa de volta como não-ranqueada, no fim — sem colidir índices)
        if (data.status === 'concluido') {
          if (!('quadranteEisenhower' in data)) data = { ...data, quadranteEisenhower: undefined }
          data = { ...data, ordemManual: undefined }
        }
        set(state => {
          const novasTarefas = state.tarefas.map(t => {
            if (t.id !== id) return t
            const atualizada = { ...t, ...data, atualizadoEm: todayISO(), ultimaAtualizacao: todayISO() }
            // Carimbo de conclusão: marca ao ENTRAR em "concluído" (não re-carimba em
            // edições posteriores); limpa ao reabrir, pra o contador de 24h reiniciar
            // numa próxima conclusão.
            if (atualizada.status === 'concluido' && t.status !== 'concluido') {
              atualizada.concluidoEm = todayISO()
            } else if (atualizada.status !== 'concluido') {
              atualizada.concluidoEm = undefined
            }
            return recalcularTarefa(atualizada, projetos)
          })
          return {
            tarefas: novasTarefas,
            projetos: atualizarProgressos(novasTarefas, state.projetos),
          }
        })
      },

      deleteTarefa: (id) => {
        set(state => {
          const novasTarefas = state.tarefas.filter(t => t.id !== id)
          return {
            tarefas: novasTarefas,
            projetos: atualizarProgressos(novasTarefas, state.projetos),
          }
        })
      },

      moveTarefa: (id, novoStatus) => {
        // Ao concluir, remove da Matriz de Eisenhower
        const extra = novoStatus === 'concluido' ? { quadranteEisenhower: undefined } : {}
        get().updateTarefa(id, { status: novoStatus, ...extra })
      },

      reorderTarefas: (activeId, overId) => {
        set(state => {
          const oldIndex = state.tarefas.findIndex(t => t.id === activeId)
          const newIndex = state.tarefas.findIndex(t => t.id === overId)
          if (oldIndex === -1 || newIndex === -1) return state
          return { tarefas: arrayMove(state.tarefas, oldIndex, newIndex) }
        })
      },

      // Ranking manual: grava a posição (ordemManual) de cada tarefa na lista ordenada
      reordenarManual: (orderedIds) => {
        const posicao = new Map(orderedIds.map((id, i) => [id, i]))
        set(state => ({
          tarefas: state.tarefas.map(t =>
            posicao.has(t.id) ? { ...t, ordemManual: posicao.get(t.id) } : t
          ),
        }))
      },

      addTarefaRecorrente: (dados) => {
        const nova: TarefaRecorrente = {
          ...dados,
          id: `rec-${gerarId()}`,
          ultimaCriacao: '',
          criadoEm: todayISO(),
        }
        set(state => ({ tarefasRecorrentes: [...state.tarefasRecorrentes, nova] }))
      },

      updateTarefaRecorrente: (id, data) => {
        set(state => ({
          tarefasRecorrentes: state.tarefasRecorrentes.map(r => r.id === id ? { ...r, ...data } : r),
        }))
      },

      deleteTarefaRecorrente: (id) => {
        set(state => ({ tarefasRecorrentes: state.tarefasRecorrentes.filter(r => r.id !== id) }))
      },

      processarRecorrentes: () => {
        const today = new Date()
        const todayStr = todayISO()
        const diaSemana = today.getDay() as DiaSemana
        const diaMes = today.getDate()
        const { tarefasRecorrentes } = get()

        tarefasRecorrentes.forEach(tr => {
          if (!tr.ativa) return
          if (tr.ultimaCriacao === todayStr) return

          let deveCriar = false
          if (tr.tipoRecorrencia === 'diaria') {
            deveCriar = true
          } else if (tr.tipoRecorrencia === 'semanal') {
            deveCriar = tr.diasSemana.includes(diaSemana)
          } else if (tr.tipoRecorrencia === 'mensal') {
            deveCriar = tr.diaMes === diaMes
          }

          if (deveCriar) {
            get().addTarefa({
              titulo: tr.titulo,
              descricao: tr.descricao,
              prioridade: tr.prioridade,
              nivelPrioridade: tr.prioridade,
              time: tr.time,
              responsavel: tr.responsavel,
              projetoId: tr.projetoId,
              tags: tr.tags,
              status: 'a-fazer',
              prazo: todayStr,
              horaAgenda: tr.horaAgenda,
              checklist: [],
              comentarios: [],
              cor: undefined,
              dataInicio: todayStr,
              quadranteEisenhower: undefined,
              scorePrioridade: 0,
              motivoPrioridade: '',
            } as any)
            get().updateTarefaRecorrente(tr.id, { ultimaCriacao: todayStr })
          }
        })
      },

      recalcularPrioridades: () => {
        const { projetos } = get()
        set(state => ({
          tarefas: state.tarefas.map(t => recalcularTarefa(t, projetos)),
        }))
      },

      addProjeto: (dados) => {
        const novoProjeto: Projeto = {
          ...dados,
          id: `proj-${gerarId()}`,
          progresso: 0,
          criadoEm: todayISO(),
          atualizadoEm: todayISO(),
        }
        set(state => ({ projetos: [...state.projetos, novoProjeto] }))
      },

      updateProjeto: (id, data) => {
        set(state => ({
          projetos: state.projetos.map(p =>
            p.id === id ? { ...p, ...data, atualizadoEm: todayISO() } : p
          ),
        }))
      },

      deleteProjeto: (id) => {
        set(state => ({
          projetos: state.projetos.filter(p => p.id !== id),
          // Mantém as tarefas — apenas desvincula do projeto (principal e extras)
          tarefas: state.tarefas.map(t => {
            const extras = t.projetosExtra?.filter(pid => pid !== id)
            return {
              ...t,
              projetoId: t.projetoId === id ? '' : t.projetoId,
              projetosExtra: extras && extras.length ? extras : undefined,
            }
          }),
          // Se o projeto excluído estava filtrado, volta para "Todos os projetos"
          projetoSelecionado: state.projetoSelecionado === id ? null : state.projetoSelecionado,
        }))
      },

      // Reordena os projetos conforme a lista de ids (ordem da sidebar)
      reordenarProjetos: (orderedIds) => {
        set(state => {
          const pos = new Map(orderedIds.map((id, i) => [id, i]))
          const projetos = [...state.projetos].sort(
            (a, b) => (pos.get(a.id) ?? 999) - (pos.get(b.id) ?? 999)
          )
          return { projetos }
        })
      },

      toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),

      setProjetoSelecionado: (id) => set({ projetoSelecionado: id }),

      // Reflete a sessão do Supabase Auth no estado do app (chamado pelo listener de auth)
      aplicarSessao: (email) => {
        if (!email) {
          set({ autenticado: false, usuarioEmail: '', usuarioNome: '', authInicializado: true })
          return
        }
        const perfil = get().usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())
        set({
          autenticado: true,
          usuarioEmail: email,
          usuarioNome: perfil?.nome || email.split('@')[0],
          authInicializado: true,
        })
      },

      addAnotacao: (dados) => {
        const agora = todayISO()
        const nova: Anotacao = { ...dados, id: `ano-${gerarId()}`, criadoEm: agora, atualizadoEm: agora }
        set(state => ({ anotacoes: [nova, ...state.anotacoes] }))
      },

      updateAnotacao: (id, data) => {
        set(state => ({
          anotacoes: state.anotacoes.map(a =>
            a.id === id ? { ...a, ...data, atualizadoEm: todayISO() } : a
          ),
        }))
      },

      deleteAnotacao: (id) => {
        set(state => ({ anotacoes: state.anotacoes.filter(a => a.id !== id) }))
      },

      // Garante que o projeto "Pessoais" exista (mesmo em localStorage antigo)
      garantirProjetosPadrao: () => {
        set(state => state.projetos.some(p => p.id === PROJETO_PESSOAIS.id)
          ? state
          : { projetos: [...state.projetos, PROJETO_PESSOAIS] })
      },

      // Garante que quem entra tenha um perfil na lista de usuários — assim o admin
      // consegue vê-lo e definir os projetos. Novos cadastros entram como não-admin
      // sem projetos (= vê todos) até o admin restringir. Retorna true se criou.
      garantirPerfilUsuario: (email) => {
        const existe = get().usuarios.some(u => u.email.toLowerCase() === email.toLowerCase())
        if (existe) return false
        const novo: Usuario = {
          id: `usr-${gerarId()}`,
          nome: email.split('@')[0],
          email: email.toLowerCase(),
          senha: '',
          admin: false,
          projetosPermitidos: [],
        }
        set(state => ({ usuarios: [...state.usuarios, novo] }))
        return true
      },
    }),
    {
      name: 'tarefado-storage',
      partialize: (state) => ({
        tarefas: state.tarefas,
        projetos: state.projetos,
        usuarios: state.usuarios,
        tarefasRecorrentes: state.tarefasRecorrentes,
        anotacoes: state.anotacoes,
        darkMode: state.darkMode,
      }),
    }
  )
)
