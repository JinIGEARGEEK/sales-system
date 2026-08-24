import dayjs, { extend } from 'dayjs'
import numeric from 'numeral'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'

extend(buddhistEra)

export const useFormatter = () => {
  const dateFormat = (value: Date | string) => dayjs(value).format('DD/MM/BBBB')
  const dateTimeFormat = (value: Date | string) => dayjs(value).format('DD/MM/YY HH:mm')

  // Normalizes to a consistent `xxx-xxx-xxxx` (or `xx-xxx-xxxx` for a 9-digit
  // landline number) regardless of how the raw value was entered/stored —
  // digits only, spaces, or already dashed (e.g. "083 869 8659", "063-126-9999",
  // "0832759760" all render identically). Strips every non-digit first since the
  // previous version's regex only matched already-contiguous digits, so any
  // number with existing spaces/dashes silently passed through unformatted.
  const phoneFormat = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    if (digits.length === 9) return digits.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3')
    return value
  }

  const priceFormat = (value: number) => numeric(value).format('0,0.00')

  // Thousands-grouped, no decimals — for whole-number figures that aren't
  // currency (sales quotas/targets, lead-scoring thresholds), as opposed to
  // priceFormat's fixed 2-decimal money formatting.
  const numberFormat = (value: number) => numeric(value).format('0,0')

  // Abbreviated form (77.8M, 1.6K) for dashboard-style at-a-glance figures —
  // exact precision belongs in a detail view/export, not a stat tile.
  const priceFormatCompact = (value: number) => numeric(value).format('0,0.[0]a').toUpperCase()

  const toBadge = (title: string, color = 'neutral') => ({ title, color, isNoData: false })

  // Escalates a day-count based badge color neutral -> warning -> error as it
  // crosses warnAt/criticalAt — used across the Reports section (Stalled
  // Deals, Contracts Stuck, Quotes Expiring Soon, Projects at Risk) so how
  // urgent a "days" figure is reads at a glance instead of every row looking
  // identical regardless of severity.
  const severityColor = (days: number, warnAt: number, criticalAt: number) => {
    if (days >= criticalAt) return 'error'
    if (days >= warnAt) return 'warning'
    return 'neutral'
  }

  // Splits a comma-separated tags input (e.g. "Tier 1, Priority") into a clean string[],
  // trimming whitespace and dropping empty entries from trailing/double commas.
  const parseTags = (value: string) => value.split(',').map(tag => tag.trim()).filter(Boolean)

  // Converts a Date to the plain 'YYYY-MM-DD' string InputDatePicker's
  // v-model expects — shared by every Add*Modal that prefills a date field
  // from an existing record (Project, CustomerProduct, Task, ...).
  const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10)

  return {
    dateFormat,
    dateTimeFormat,
    phoneFormat,
    priceFormat,
    priceFormatCompact,
    numberFormat,
    toBadge,
    severityColor,
    parseTags,
    toDateInputValue,
  }
}
