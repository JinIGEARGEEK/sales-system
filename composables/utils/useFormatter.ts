import dayjs, { extend } from 'dayjs'
import numeric from 'numeral'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'

extend(buddhistEra)

export const BUDDHIST_ERA_OFFSET = 543

export const useFormatter = () => {
  // Both use the Buddhist era with a 4-digit year (`BBBB`, from the dayjs
  // buddhistEra plugin: Gregorian year + 543) so a date reads the same with
  // or without a time — dateTimeFormat used to print a 2-digit Gregorian
  // year ('DD/MM/YY'), i.e. "25/09/26 14:30" next to "25/09/2569".
  const dateFormat = (value: Date | string) => dayjs(value).format('DD/MM/BBBB')
  const dateTimeFormat = (value: Date | string) => dayjs(value).format('DD/MM/BBBB HH:mm')

  // A bare Gregorian calendar year (e.g. a SalesTarget's `year`) as shown and
  // typed in the UI: Buddhist era (+543), in every locale, like the dates
  // above. Display only — stored/sent years always stay Gregorian.
  const buddhistYear = (year: number) => year + BUDDHIST_ERA_OFFSET
  const fromBuddhistYear = (year: number) => year - BUDDHIST_ERA_OFFSET

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

  // Money with the currency symbol in front ("฿1,234.00" / "฿1.2M"). The
  // symbol is read at call time off the app's i18n instance, so this works
  // anywhere useFormatter does (no setup-only useI18n()).
  const currencySymbol = () => useNuxtApp().$i18n.t('global.currencySymbol')
  const currency = (value: number) => `${currencySymbol()}${priceFormat(value)}`
  const currencyCompact = (value: number) => `${currencySymbol()}${priceFormatCompact(value)}`

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
  // Built from the browser's LOCAL date parts, not toISOString() (UTC): in
  // Bangkok (UTC+7) toISOString() reports the previous day before 07:00, so
  // a "today" default would silently show yesterday. Stored dates saved at
  // 00:00 UTC still read as the same calendar day in UTC+7.
  const toDateInputValue = (date: Date | string) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return {
    dateFormat,
    dateTimeFormat,
    buddhistYear,
    fromBuddhistYear,
    phoneFormat,
    priceFormat,
    priceFormatCompact,
    currency,
    currencyCompact,
    numberFormat,
    toBadge,
    severityColor,
    parseTags,
    toDateInputValue,
  }
}
