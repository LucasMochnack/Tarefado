import { Tarefa } from '@/types'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Monta o link "Adicionar à Google Agenda" (template do Google Calendar).
 * Abre o Google Calendar com o evento já preenchido — o usuário só confirma.
 *
 * - Com horário (horaAgenda): evento de 1h começando no horário escolhido.
 * - Sem horário: evento de dia inteiro na data do prazo.
 *
 * Usa horário "flutuante" (sem Z) para aparecer no fuso da agenda do usuário.
 */
export function googleCalendarUrl(tarefa: Tarefa): string {
  const datePart = (tarefa.prazo || '').slice(0, 10) // YYYY-MM-DD (sem conversão de fuso)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return ''
  const [Y, M, D] = datePart.split('-').map(Number)

  const hora = tarefa.horaAgenda
  let dates: string
  if (hora && /^\d{1,2}:\d{2}/.test(hora)) {
    const [h, mi] = hora.split(':').map(Number)
    const start = new Date(Y, M - 1, D, h, mi)
    const end = new Date(start.getTime() + 60 * 60 * 1000) // +1h
    const fmt = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
    dates = `${fmt(start)}/${fmt(end)}`
  } else {
    const start = new Date(Y, M - 1, D)
    const end = new Date(Y, M - 1, D + 1) // dia inteiro: fim no dia seguinte
    const fmt = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
    dates = `${fmt(start)}/${fmt(end)}`
  }

  const text = encodeURIComponent(tarefa.titulo || 'Tarefa')
  const details = encodeURIComponent(tarefa.descricao || 'Criado no Tarefado')
  // `dates` só tem dígitos/T/'/' — seguro sem encode (o '/' é permitido em query)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`
}
