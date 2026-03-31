import { Tarefa, Projeto, NivelPrioridade, Time } from '@/types'
import { isOverdue, daysUntilDue, daysSinceUpdate } from './dates'

interface ScoreResult {
  score: number
  nivel: NivelPrioridade
  motivo: string
}

export function calcularScore(tarefa: Tarefa, projeto?: Projeto): ScoreResult {
  let score = 0
  const motivos: string[] = []
  const time = tarefa.time as Time

  // Prazo vencido
  if (tarefa.status !== 'concluido' && isOverdue(tarefa.prazo)) {
    const days = Math.abs(daysUntilDue(tarefa.prazo))
    const bonus = time === 'b2c' ? 50 : 40
    score += bonus
    motivos.push(`Prazo vencido há ${days}d`)
  }

  // Vence em até 2 dias
  const diasParaVencer = daysUntilDue(tarefa.prazo)
  if (tarefa.status !== 'concluido' && diasParaVencer >= 0 && diasParaVencer <= 2) {
    const bonus = time === 'b2c' ? 30 : 25
    score += bonus
    motivos.push(`Vence em ${diasParaVencer === 0 ? 'hoje' : diasParaVencer + 'd'}`)
  }

  // Tarefa parada — sem atualização há mais de 7 dias
  const diasSemUpdate = daysSinceUpdate(tarefa.ultimaAtualizacao)
  if (diasSemUpdate > 7 && tarefa.status !== 'concluido') {
    const bonus = time === 'campinas' ? 25 : 20
    score += bonus
    motivos.push(`Sem atualização há ${diasSemUpdate}d`)
  }

  // Sem responsável
  if (!tarefa.responsavel || tarefa.responsavel === '') {
    const bonus = time === 'campinas' ? 20 : 15
    score += bonus
    motivos.push('Sem responsável')
  }

  // Projeto importante e urgente
  if (projeto?.quadranteEisenhower === 'importante-urgente') {
    score += 30
    motivos.push('Projeto urgente e importante')
  } else if (projeto?.quadranteEisenhower === 'importante-nao-urgente') {
    score += 15
    motivos.push('Projeto importante')
  }

  // Projeto com prazo próximo e baixo progresso
  if (projeto && projeto.progresso < 30 && daysUntilDue(projeto.prazoFinal) <= 14) {
    const bonus = time === 'produtos' ? 25 : 20
    score += bonus
    motivos.push('Projeto com prazo próximo e baixo progresso')
  }

  // Bloqueada por outra tarefa
  if (tarefa.bloqueadaPor) {
    score += 20
    motivos.push('Bloqueada por outra tarefa')
  }

  // Aguardando há muito tempo
  if (tarefa.status === 'aguardando' && diasSemUpdate > 5) {
    score += 15
    motivos.push('Aguardando há muito tempo')
  }

  // Pesos específicos por time
  if (time === 'b2c') {
    // Follow-up sem retorno (tags)
    if (tarefa.tags.some(t => ['follow-up', 'cliente', 'conversão', 'proposta'].includes(t))) {
      score += 10
      motivos.push('Atividade comercial crítica')
    }
  }

  if (time === 'produtos') {
    // Campanha ou lançamento
    if (tarefa.tags.some(t => ['campanha', 'lançamento', 'material', 'comercial'].includes(t))) {
      score += 10
      motivos.push('Tarefa que destranca vendas')
    }
  }

  if (time === 'campinas') {
    // Impacto operacional
    if (tarefa.tags.some(t => ['estratégia', 'operacional', 'bloqueio'].includes(t))) {
      score += 10
      motivos.push('Impacto operacional local')
    }
  }

  const nivel = scoreToNivel(score)
  const motivo = motivos.length > 0 ? motivos.slice(0, 2).join(' · ') : 'Prioridade normal'

  return { score: Math.min(score, 100), nivel, motivo }
}

export function scoreToNivel(score: number): NivelPrioridade {
  if (score >= 80) return 'critica'
  if (score >= 60) return 'alta'
  if (score >= 40) return 'media'
  return 'baixa'
}

export function calcularProgressoProjeto(tarefas: Tarefa[], projetoId: string): number {
  const tarefasDoProjeto = tarefas.filter(t => t.projetoId === projetoId)
  if (tarefasDoProjeto.length === 0) return 0
  const concluidas = tarefasDoProjeto.filter(t => t.status === 'concluido').length
  return Math.round((concluidas / tarefasDoProjeto.length) * 100)
}
