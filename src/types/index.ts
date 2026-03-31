export type StatusTarefa = 'a-fazer' | 'em-andamento' | 'aguardando' | 'concluido'
export type NivelPrioridade = 'critica' | 'alta' | 'media' | 'baixa'
export type Time = 'on-demand' | 'alta-renda' | 'varejo' | 'b2c' | 'campinas' | 'produtos' | 'geral'
export type QuadranteEisenhower =
  | 'importante-urgente'
  | 'importante-nao-urgente'
  | 'nao-importante-urgente'
  | 'nao-importante-nao-urgente'
export type StatusProjeto = 'ativo' | 'pausado' | 'concluido' | 'atrasado'

export interface ChecklistItem {
  id: string
  texto: string
  concluido: boolean
}

export interface Comentario {
  id: string
  tarefaId: string
  autor: string
  texto: string
  criadoEm: string
}

export interface Tarefa {
  id: string
  titulo: string
  descricao: string
  status: StatusTarefa
  prioridade: NivelPrioridade
  prazo: string
  responsavel: string
  projetoId: string
  time: Time
  tags: string[]
  checklist: ChecklistItem[]
  comentarios: Comentario[]
  criadoEm: string
  atualizadoEm: string
  ultimaAtualizacao: string
  horaAgenda?: string
  horaFim?: string
  cor?: string
  dataInicio?: string
  bloqueadaPor?: string
  scorePrioridade: number
  nivelPrioridade: NivelPrioridade
  motivoPrioridade: string
}

export interface Projeto {
  id: string
  nome: string
  descricao: string
  quadranteEisenhower: QuadranteEisenhower
  prazoFinal: string
  status: StatusProjeto
  progresso: number
  cor: string
  time: Time
  criadoEm: string
  atualizadoEm: string
}

export interface HistoricoItem {
  id: string
  tarefaId: string
  acao: string
  de?: string
  para?: string
  autor: string
  criadoEm: string
}

export interface FiltrosTarefa {
  projeto?: string
  time?: Time | ''
  status?: StatusTarefa | ''
  prioridade?: NivelPrioridade | ''
  responsavel?: string
  somenteAtrasadas?: boolean
  somenteParadas?: boolean
  semResponsavel?: boolean
  busca?: string
}
