// Date-only API fields (CustomerProduct.renewal_date, Contract.end_date) come
// back as "2027-01-15T00:00:00Z". Keep just the "YYYY-MM-DD" prefix and never
// run it through new Date() + a local-time formatter, which can shift the day
// west of UTC. dayjs('YYYY-MM-DD') (useFormatter's dateFormat) parses it as a
// local calendar date, so it displays the same day everywhere.

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}/

export const toDateOnly = (value: string | null | undefined): string | null => {
  if (!value) return null
  const match = DATE_ONLY.exec(value)
  return match ? match[0] : null
}

const dayNumber = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day) / 86_400_000

// Whole calendar days from `today` (its LOCAL date) to the date-only value:
// 0 = today, negative = already past.
export const daysUntilDateOnly = (value: string, today: Date = new Date()): number => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return dayNumber(year!, month!, day!) - dayNumber(today.getFullYear(), today.getMonth() + 1, today.getDate())
}

export type RenewalTone = 'overdue' | 'today' | 'soon' | 'later'

// "Renews in N days" / overdue badge. `soonDays` matches the seeded 30-day
// renewal / contract-expiry notification rules.
export const dateOnlyCountdown = (value: string | null | undefined, today: Date = new Date(), soonDays = 30): { days: number, tone: RenewalTone } | null => {
  const date = toDateOnly(value)
  if (!date) return null
  const days = daysUntilDateOnly(date, today)
  if (days < 0) return { days, tone: 'overdue' }
  if (days === 0) return { days, tone: 'today' }
  return { days, tone: days <= soonDays ? 'soon' : 'later' }
}

export const countdownColor = (tone: RenewalTone) => {
  if (tone === 'overdue') return 'error' as const
  if (tone === 'today' || tone === 'soon') return 'warning' as const
  return 'neutral' as const
}
