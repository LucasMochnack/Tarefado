import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Tarefa, Projeto, StatusTarefa, TarefaRecorrente, DiaSemana } from '@/types'
import { TAREFAS_INICIAIS, PROJETOS_INICIAIS } from '@/data/mockData'
import { calcularScore, calcularProgressoProjeto } from '@/utils/priority'
import { todayISO } from '@/utils/dates'

export interface Usuario {
  id: string
  nome: string
  email: string
  senha: string
  admin: boolean
  cor?: string
  times?: string[]  // times que o usuário pode ver; vazio/undefined = vê tudo
}

const USUARIO_PADRAO: Usuario = {
  id: 'admin',
  nome: 'Administrador',
  email: 'admin@tarefado.com',
  senha: 'admin123',
  admin: true,
}

interface AppStore {
  tarefas: Tarefa[]
  projetos: Projeto[]
  usuarios: Usuario[]
  tarefasRecorrentes: TarefaRecorrente[]
  darkMode: boolean
  autenticado: boolean
  usuarioNome: string
  usuarioEmail: string

  login: (email: string, senha: string) => boolean
  logout: () => void
  addUsuario: (usuario: Omit<Usuario, 'id'>) => void
  updateUsuario: (id: string, data: Partial<Omit<Usuario, 'id'>>) => void
  deleteUsuario: (id: string) => void

  addTarefa: (tarefa: Omit<Tarefa, 'id' | 'criadoEm' | 'atualizadoEm' | 'ultimaAtualizacao' | 'scorePrioridade' | 'nivelPrioridade' | 'motivoPrioridade'>) => void
  updateTarefa: (id: string, data: Partial<Tarefa>) => void
  deleteTarefa: (id: string) => void
  moveTarefa: (id: string, novoStatus: StatusTarefa) => void
  recalcularPrioridades: () => void

  addTarefaRecorrente: (dados: Omit<TarefaRecorrente, 'id' | 'criadoEm' | 'ultimaCriacao'>) => void
  updateTarefaRecorrente: (id: string, data: Partial<TarefaRecorrente>) => void
  deleteTarefaRecorrente: (id: string) => void
  processarRecorrentes: () => void

  addProjeto: (projeto: Omit<Projeto, 'id' | 'criadoEm' | 'atualizadoEm' | 'progresso'>) => void
  updateProjeto: (id: string, data: Partial<Projeto>) => void
  deleteProjeto: (id: string) => void

  toggleDarkMode: () => void
}

function gerarId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function recalcularTarefa(tarefa: Tarefa, projetos: Projeto[]): Tarefa {
  const projeto = projetos.find(p => p.id === tarefa.projetoId)
  const { score, nivel, motivo } = calcularScore(tarefa, projeto)
  return { ...tarefa, scorePrioridade: score, nivelPrioridade: nivel, motivoPrioridade: motivo }
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
      usuarios: [USUARIO_PADRAO],
      tarefasRecorrentes: [],
      darkMode: false,
      autenticado: false,
      usuarioNome: '',
      usuarioEmail: '',

      login: (email, senha) => {
        const { usuarios } = get()
        const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha)
        if (usuario) {
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
        set(state => {
          const novasTarefas = state.tarefas.map(t => {
            if (t.id !== id) return t
            const atualizada = { ...t, ...data, atualizadoEm: todayISO(), ultimaAtualizacao: todayISO() }
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
        get().updateTarefa(id, { status: novoStatus })
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
        set(state => {
          const novasTarefas = state.tarefas.filter(t => t.projetoId !== id)
          return {
            projetos: state.projetos.filter(p => p.id !== id),
            tarefas: novasTarefas,
          }
        })
      },

      toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'tarefado-storage',
      partialize: (state) => ({
        tarefas: state.tarefas,
        projetos: state.projetos,
        usuarios: state.usuarios,
        tarefasRecorrentes: state.tarefasRecorrentes,
        darkMode: state.darkMode,
        autenticado: state.autenticado,
        usuarioNome: state.usuarioNome,
        usuarioEmail: state.usuarioEmail,
      }),
    }
  )
)
