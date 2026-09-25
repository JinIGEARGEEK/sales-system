// Pure helpers behind InputText's `thousands` mode: an amount typed with
// thousands separators and, when `fractionDigits` > 0, one decimal point and
// up to that many fraction digits. With 0 (whole numbers, e.g. the int64
// sales targets) anything after a decimal point is dropped.

const DEFAULT_FRACTION_DIGITS = 2

// Raw input text (commas, stray characters, a pasted "฿1,234.56") -> the
// canonical typed string, e.g. "1,500." -> "1500.", "1,234.567" -> "1234.56".
// Keeps a trailing "." or "0" so a value can still be typed mid-way.
export const sanitizeThousandsInput = (raw: string, fractionDigits = DEFAULT_FRACTION_DIGITS): string => {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const dot = cleaned.indexOf('.')
  if (dot === -1) return cleaned.replace(/^0+(?=\d)/, '')
  const intPart = cleaned.slice(0, dot).replace(/^0+(?=\d)/, '')
  if (fractionDigits === 0) return intPart
  const fraction = cleaned.slice(dot + 1).replace(/\./g, '').slice(0, fractionDigits)
  return `${intPart}.${fraction}`
}

// Canonical string -> number for the model (null when empty).
export const parseThousandsInput = (canonical: string): number | null => {
  if (canonical === '' || canonical === '.') return null
  const num = Number(canonical)
  return Number.isNaN(num) ? null : num
}

// A model number, or a canonical string being typed, -> on-screen text with
// separators ("1500." -> "1,500.", 1500.5 -> "1,500.5").
export const formatThousands = (value: string | number | null | undefined, fractionDigits = DEFAULT_FRACTION_DIGITS): string => {
  if (value === '' || value === null || value === undefined) return ''
  if (typeof value === 'number') {
    return Number.isNaN(value) ? '' : value.toLocaleString('en-US', { maximumFractionDigits: fractionDigits })
  }
  const canonical = sanitizeThousandsInput(value, fractionDigits)
  if (!canonical) return ''
  const [intPart = '', fraction] = canonical.split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction === undefined ? grouped : `${grouped}.${fraction}`
}
