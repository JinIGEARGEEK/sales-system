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

// A date-input value ("YYYY-MM-DD") as local noon: "sometime that day", and
// safe from slipping to a neighbouring day in any timezone within ±12h —
// unlike new Date('YYYY-MM-DD'), which is 00:00 UTC (07:00 in Bangkok).
export const dateOnlyToLocalNoon = (value: string): Date => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year!, month! - 1, day!, 12)
}

// `date` plus `days` calendar days, same local time of day — through
// setDate, so a DST change in between doesn't shift it (unlike adding
// days × 24h of milliseconds). Doesn't mutate `date`.
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
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

// i18n keys for a countdown badge's three phrasings; `past` and `future`
// get a positive `{days}` param.
export interface CountdownLabelKeys {
  past: string
  today: string
  future: string
}

type Translate = (key: string, params?: Record<string, unknown>) => string

export const countdownLabel = (days: number, keys: CountdownLabelKeys, t: Translate): string => {
  if (days < 0) return t(keys.past, { days: -days })
  if (days === 0) return t(keys.today)
  return t(keys.future, { days })
}

export const countdownColor = (tone: RenewalTone) => {
  if (tone === 'overdue') return 'error' as const
  if (tone === 'today' || tone === 'soon') return 'warning' as const
  return 'neutral' as const
}

// Everything a countdown badge renders, worked out once per row: null when
// there's no date to count down to.
export const countdownBadge = (value: string | null | undefined, keys: CountdownLabelKeys, t: Translate, today: Date = new Date()) => {
  const countdown = dateOnlyCountdown(value, today)
  if (!countdown) return null
  return { color: countdownColor(countdown.tone), label: countdownLabel(countdown.days, keys, t) }
}
