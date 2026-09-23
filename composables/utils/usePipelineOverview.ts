// Pure helpers behind the Overview Pipeline page (FR-CRM-123), kept out of the
// page so they can be unit-tested without mounting it.

export type OverviewPeriodPreset = 'week' | 'lastWeek' | 'month' | 'quarter'

export const OVERVIEW_PERIOD_PRESETS: OverviewPeriodPreset[] = ['week', 'lastWeek', 'month', 'quarter']

// Inclusive local-date bounds, exactly as GET /pipeline/overview takes them.
export type OverviewDateRange = { date_from: string, date_to: string }

type CardTiming = Pick<PipelineOverviewCard, 'stage_entered_at' | 'created_at'>

// A card that has sat in one open lane longer than this (two weeks without a
// move) gets the "stale" flag. A fixed review heuristic, deliberately not tied
// to any Admin-configured notification rule's threshold.
export const OVERVIEW_STALE_DAYS = 14

const DAY_MS = 24 * 60 * 60 * 1000

const toIsoDate = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Local midnight of a YYYY-MM-DD string (new Date('YYYY-MM-DD') would parse
// it as UTC midnight instead, a day off for anyone west of UTC).
const fromIsoDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

// Weeks start on Monday (Thai business convention, and ISO 8601).
const startOfWeek = (d: Date) => {
  const day = startOfDay(d)
  const offset = (day.getDay() + 6) % 7
  day.setDate(day.getDate() - offset)
  return day
}

// Inclusive YYYY-MM-DD bounds for a preset, in the viewer's local time —
// exactly what GET /pipeline/overview's date_from/date_to expect. "This …"
// presets run up to today, not to the end of the week/month/quarter.
export const overviewPeriodRange = (preset: OverviewPeriodPreset, now = new Date()): OverviewDateRange => {
  const today = startOfDay(now)
  switch (preset) {
    case 'lastWeek': {
      const end = startOfWeek(today)
      end.setDate(end.getDate() - 1)
      const start = new Date(end)
      start.setDate(start.getDate() - 6)
      return { date_from: toIsoDate(start), date_to: toIsoDate(end) }
    }
    case 'month':
      return { date_from: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)), date_to: toIsoDate(today) }
    case 'quarter':
      return { date_from: toIsoDate(new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)), date_to: toIsoDate(today) }
    case 'week':
    default:
      return { date_from: toIsoDate(startOfWeek(today)), date_to: toIsoDate(today) }
  }
}

// Inclusive day count of a YYYY-MM-DD range (e.g. Mon–Wed = 3).
export const overviewPeriodLength = (range: OverviewDateRange) =>
  Math.round((fromIsoDate(range.date_to).getTime() - fromIsoDate(range.date_from).getTime()) / DAY_MS) + 1

// Whole days since the card entered its lane (0 on the day it moved).
export const daysInStage = (card: CardTiming, now = new Date()) => {
  const entered = new Date(card.stage_entered_at ?? card.created_at)
  return Math.max(0, Math.floor((startOfDay(now).getTime() - startOfDay(entered).getTime()) / DAY_MS))
}

export const isStaleCard = (card: CardTiming, now = new Date()) =>
  daysInStage(card, now) > OVERVIEW_STALE_DAYS

// "Moved" = changed lanes inside the period. A record created in the period
// and never moved also has stage_entered_at inside it, so that alone isn't
// enough: its lane entry must also come meaningfully after its creation.
export const movedInPeriod = (card: CardTiming, range: OverviewDateRange) => {
  if (!card.stage_entered_at) return false
  const entered = new Date(card.stage_entered_at)
  const from = fromIsoDate(range.date_from)
  const to = fromIsoDate(range.date_to)
  to.setDate(to.getDate() + 1)
  if (entered < from || entered >= to) return false
  return entered.getTime() - new Date(card.created_at).getTime() > 60 * 1000
}

// Conversion from one funnel step to the next, as a whole percent, or null
// when there's nothing to convert from.
export const conversionPercent = (from: number, to: number) => (from > 0 ? Math.round((to / from) * 100) : null)
