// Installment math for CrmGeneratePaymentScheduleModal — plain functions (no
// refs), kept here so they're unit-tested apart from the modal. The split is
// done in whole satang: every row but the last is rounded DOWN, and the LAST
// row absorbs the remainder, so the rows sum to exactly the total and none
// goes negative (rounding each row up could overshoot — ฿0.10 over 15 rows).
// A row can still be 0 when there are more rows than satang; the modal
// blocks saving that (hasEmptyInstallment).

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
  const totalSatang = Math.round(total * 100)
  const perInstallment = Math.floor(totalSatang / count)
  const rows: PaymentSplitRow[] = []
  for (let i = 0; i < count; i++) {
    // From the first due date each time, clamped to month end (Jan 31 →
    // Feb 28 → Mar 31), not setMonth's overflow (Jan 31 → Mar 3).
    const dueDate = addMonths(firstDue, i * intervalMonths)
    const satang = i === count - 1 ? totalSatang - perInstallment * (count - 1) : perInstallment
    rows.push({ amount: satang / 100, due_date: dueDate, note: '' })
  }
  return rows
}

// Sum of the rows' percentages, rounded to hide float noise (33.3 + 33.3 + 33.4).
export const percentTotal = (rows: { percent: number }[]) => roundSatang(rows.reduce((sum, row) => sum + (Number(row.percent) || 0), 0))

export const isPercentageSplitValid = (rows: { percent: number }[]) =>
  rows.length > 0 && rows.every(row => Number(row.percent) > 0) && percentTotal(rows) === 100

// floor(totalSatang × percent / 100), first rounded to 1/10000 satang so
// float noise (10000 × 33.33 = 333299.99…) can't floor a row a satang short.
const floorShare = (totalSatang: number, percent: number) => Math.floor(Math.round(totalSatang * percent * 100) / 10000)

export const splitByPercentage = (total: number, rows: PercentageSplitInput[]): PaymentSplitRow[] => {
  if (total <= 0 || rows.length === 0) return []
  const totalSatang = Math.round(total * 100)
  let allocated = 0
  return rows.map((row, i) => {
    const satang = i === rows.length - 1
      ? Math.max(0, totalSatang - allocated)
      : Math.min(totalSatang - allocated, floorShare(totalSatang, Number(row.percent) || 0))
    allocated += satang
    return { amount: satang / 100, due_date: row.due_date, note: row.label.trim() }
  })
}

// A split row of ฿0 — more installments than the total has satang. The API
// rejects a 0 amount, so the modal asks for fewer rows instead.
export const hasEmptyInstallment = (rows: { amount: number }[]) => rows.some(row => row.amount <= 0)

// The usual milestone split for a custom software project: deposit, delivery,
// acceptance.
export const DEFAULT_MILESTONE_PERCENTS = [30, 40, 30]
