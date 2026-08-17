import dayjs, { extend } from 'dayjs'
import numeric from 'numeral'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/th'

extend(buddhistEra)
extend(utc)

export const useFormatter = () => {
  const dateFormat = (value: Date | string) => dayjs(value).format('DD/MM/BBBB')
  const timeFormat = (value: Date | string) => dayjs(value).format('HH:mm')
  const dateTimeFormat = (value: Date | string) => dayjs(value).format('DD/MM/YY HH:mm')
  const utcFormat = (value: Date | string) => dayjs(value).utc().format()

  const phoneFormat = (value: string) => value.replace(/(\d{3})(\d{3})(\d{3,4})/, '$1-$2-$3')
  const idCardFormat = (value: string) => value.replace(/(\d)(?=(\d{4})+$)/g, '$1-')

  const numberFormat = (value: number) => numeric(value).format('0,0')
  const priceFormat = (value: number) => numeric(value).format('0,0.00')

  // Abbreviated form (77.8M, 1.6K) for dashboard-style at-a-glance figures —
  // exact precision belongs in a detail view/export, not a stat tile.
  const priceFormatCompact = (value: number) => numeric(value).format('0,0.[0]a').toUpperCase()

  const mbToBytes = (mb: number) => mb * 1024 * 1024

  const toBadge = (title: string, color = 'neutral') => ({ title, color, isNoData: false })

  // Splits a comma-separated tags input (e.g. "Tier 1, Priority") into a clean string[],
  // trimming whitespace and dropping empty entries from trailing/double commas.
  const parseTags = (value: string) => value.split(',').map(tag => tag.trim()).filter(Boolean)

  return {
    dateFormat,
    timeFormat,
    dateTimeFormat,
    utcFormat,
    phoneFormat,
    idCardFormat,
    numberFormat,
    priceFormat,
    priceFormatCompact,
    mbToBytes,
    toBadge,
    parseTags,
  }
}
