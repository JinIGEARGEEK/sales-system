// Installment math for CrmGeneratePaymentScheduleModal — plain functions (no
// refs), kept here so they're unit-tested apart from the modal. Every row is
// rounded to 2 decimals and the LAST row absorbs whatever rounding remainder
// is left, so the rows always sum to exactly the total instead of drifting a
// few satang through independent rounding.

export interface PaymentSplitRow {
  amount: number
  due_date: Date
  note: string
}

export interface PercentageSplitInput {
  label: string
  percent: number
  due_date: Date
}

export const splitEqually = (total: number, count: number, firstDue: Date, intervalMonths: number): PaymentSplitRow[] => {
  if (count < 1 || total <= 0 || Number.isNaN(firstDue.getTime())) return []
  const perInstallment = roundSatang(total / count)
  const rows: PaymentSplitRow[] = []
  let allocated = 0
  for (let i = 0; i < count; i++) {
    const dueDate = new Date(firstDue)
    dueDate.setMonth(dueDate.getMonth() + i * intervalMonths)
    const amount = i === count - 1 ? roundSatang(total - allocated) : perInstallment
    allocated += amount
    rows.push({ amount, due_date: dueDate, note: '' })
  }
  return rows
}

// Sum of the rows' percentages, rounded to hide float noise (33.3 + 33.3 + 33.4).
export const percentTotal = (rows: { percent: number }[]) => roundSatang(rows.reduce((sum, row) => sum + (Number(row.percent) || 0), 0))

export const isPercentageSplitValid = (rows: { percent: number }[]) =>
  rows.length > 0 && rows.every(row => Number(row.percent) > 0) && percentTotal(rows) === 100

export const splitByPercentage = (total: number, rows: PercentageSplitInput[]): PaymentSplitRow[] => {
  if (total <= 0 || rows.length === 0) return []
  let allocated = 0
  return rows.map((row, i) => {
    const amount = i === rows.length - 1 ? roundSatang(total - allocated) : roundSatang(total * (Number(row.percent) || 0) / 100)
    allocated += amount
    return { amount, due_date: row.due_date, note: row.label.trim() }
  })
}

// The usual milestone split for a custom software project: deposit, delivery,
// acceptance.
export const DEFAULT_MILESTONE_PERCENTS = [30, 40, 30]
