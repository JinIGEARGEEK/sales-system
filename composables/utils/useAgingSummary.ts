// Outstanding Balance report: roll the rows up by the API's aging_bucket
// (days since the oldest overdue, not-fully-covered installment).

export const AGING_BUCKETS = ['current', '1_30', '31_60', '61_90', '90_plus'] as const
export type AgingBucket = typeof AGING_BUCKETS[number]

export interface AgingBucketSummary {
  bucket: AgingBucket
  count: number
  outstanding: number
}

export const summarizeAging = (rows: Pick<OutstandingBalanceRow, 'aging_bucket' | 'outstanding_amount'>[]): AgingBucketSummary[] => {
  const byBucket = new Map<AgingBucket, AgingBucketSummary>(AGING_BUCKETS.map(bucket => [bucket, { bucket, count: 0, outstanding: 0 }]))
  for (const row of rows) {
    const entry = byBucket.get(row.aging_bucket) ?? byBucket.get('current')!
    entry.count += 1
    entry.outstanding += row.outstanding_amount
  }
  return AGING_BUCKETS.map(bucket => byBucket.get(bucket)!)
}

// Severity, not "has a value" (design-system §5.7): current is neutral, the
// first month amber, anything older red.
export const agingBucketColor = (bucket: AgingBucket) => {
  if (bucket === 'current') return 'neutral' as const
  if (bucket === '1_30') return 'warning' as const
  return 'error' as const
}
