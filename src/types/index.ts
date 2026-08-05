export type StatusTarefa = 'a-fazer' | 'em-andamento' | 'aguardando' | 'em-testes' | 'concluido'
export type TipoRecorrencia = 'diaria' | 'semanal' | 'mensal'
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type NivelPrioridade = 'critica' | 'alta' | 'media' | 'baixa'
export type Time = 'on-demand' | 'alta-renda' | 'varejo' | 'b2c' | 'campinas' | 'produtos' | 'geral' | 'performance'
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
  projetoId: string          // projeto principal (home, usado no score)
  projetosExtra?: string[]   // projetos adicionais em que a MESMA tarefa aparece
  time: Time
  tags: string[]
  checklist: ChecklistItem[]
  comentarios: Comentario[]
  criadoEm: string
  atualizadoEm: string
  ultimaAtualizacao: string
  concluidoEm?: string   // quando entrou em "Concluído" (some do board 24h depois)
  horaAgenda?: string
  horaFim?: string
  cor?: string
  dataInicio?: string
  bloqueadaPor?: string
  quadranteEisenhower?: QuadranteEisenhower
  ordemManual?: number   // posição no ranking manual (por projeto)
  scorePrioridade: number
  nivelPrioridade: NivelPrioridade
  motivoPrioridade: string
}

export interface Anotacao {
  id: string
  projetoId: string   // '' = anotação geral (sem projeto específico)
  titulo: string
  conteudo: string
  criadoEm: string
  atualizadoEm: string
}

/** Project Model Canvas (modelo FGV). Um projeto pode ter vários. */
export interface CanvasProjeto {
  id: string
  nome: string               // nome do canvas (ex.: "Triagem de candidatos")
  objetivo?: string          // topo, largura total
  justificativas?: string    // Por quê? (passado)
  objetivoSmart?: string     // Por quê?
  beneficios?: string        // Por quê? (futuro)
  produto?: string           // O quê?
  requisitos?: string        // O quê?
  fatoresExternos?: string   // Quem?
  equipe?: string            // Quem?
  premissas?: string         // Como?
  entregas?: string          // Como? (grupo de entregas)
  restricoes?: string        // Como?
  riscos?: string            // Quando e quanto?
  linhaDoTempo?: string      // Quando e quanto?
  custos?: string            // Quando e quanto?
  pendencias?: string        // rodapé, largura total
  criadoEm?: string
  atualizadoEm?: string
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
  ocultarEmTodos?: boolean   // tarefas não aparecem na visão "Todos os projetos"
  canvases?: CanvasProjeto[] // Project Model Canvas do projeto (pode ter vários)
  /** @deprecated formato antigo (um canvas só) — normalizado para `canvases` */
  canvas?: Partial<CanvasProjeto>
}

export interface TarefaRecorrente {
  id: string
  titulo: string
  descricao: string
  prioridade: NivelPrioridade
  time: Time
  responsavel: string
  projetoId: string
  tags: string[]
  tipoRecorrencia: TipoRecorrencia
  diasSemana: DiaSemana[]
  diaMes: number
  horaAgenda?: string
  ativa: boolean
  ultimaCriacao: string
  criadoEm: string
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
