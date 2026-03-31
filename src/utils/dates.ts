import {
  format,
  formatDistanceToNow,
  isPast,
  isToday,
  isTomorrow,
  differenceInDays,
  addDays,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(date: string): string {
  try {
    return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return date
  }
}

export function formatDateTime(date: string): string {
  try {
    return format(parseISO(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return date
  }
}

export function formatRelative(date: string): string {
  try {
    return formatDistanceToNow(parseISO(date), { locale: ptBR, addSuffix: true })
  } catch {
    return date
  }
}

export function isOverdue(date: string): boolean {
  try {
    const d = parseISO(date)
    return isPast(d) && !isToday(d)
  } catch {
    return false
  }
}

export function isDueToday(date: string): boolean {
  try {
    return isToday(parseISO(date))
  } catch {
    return false
  }
}

export function isDueTomorrow(date: string): boolean {
  try {
    return isTomorrow(parseISO(date))
  } catch {
    return false
  }
}

export function daysUntilDue(date: string): number {
  try {
    return differenceInDays(parseISO(date), new Date())
  } catch {
    return 0
  }
}

export function daysSinceUpdate(date: string): number {
  try {
    return Math.abs(differenceInDays(new Date(), parseISO(date)))
  } catch {
    return 0
  }
}

export function todayISO(): string {
  return new Date().toISOString()
}

export function addDaysISO(days: number): string {
  return addDays(new Date(), days).toISOString()
}

export function subtractDaysISO(days: number): string {
  return addDays(new Date(), -days).toISOString()
}

export function prazoLabel(date: string, status: string): string {
  if (status === 'concluido') return formatDate(date)
  if (isOverdue(date)) {
    const days = Math.abs(daysUntilDue(date))
    return `Atrasada ${days}d`
  }
  if (isDueToday(date)) return 'Hoje'
  if (isDueTomorrow(date)) return 'Amanhã'
  const days = daysUntilDue(date)
  if (days <= 7) return `${days}d`
  return formatDate(date)
}
