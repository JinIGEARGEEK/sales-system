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

  // Abbreviated form (77.8M, 1.6K) for dashboard-style at-a-glance figures —
  // exact precision belongs in a detail view/export, not a stat tile.
  const priceFormatCompact = (value: number) => numeric(value).format('0,0.[0]a').toUpperCase()

  const toBadge = (title: string, color = 'neutral') => ({ title, color, isNoData: false })

  // Splits a comma-separated tags input (e.g. "Tier 1, Priority") into a clean string[],
  // trimming whitespace and dropping empty entries from trailing/double commas.
  const parseTags = (value: string) => value.split(',').map(tag => tag.trim()).filter(Boolean)

  return {
    dateFormat,
    dateTimeFormat,
    phoneFormat,
    priceFormat,
    priceFormatCompact,
    toBadge,
    parseTags,
  }
}
