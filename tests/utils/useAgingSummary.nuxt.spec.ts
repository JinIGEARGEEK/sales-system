import { describe, it, expect } from 'vitest'

describe('summarizeAging', () => {
  it('rolls rows up into the five buckets in fixed order, counting and summing', () => {
    const summary = summarizeAging([
      { aging_bucket: 'current', outstanding_amount: 100 },
      { aging_bucket: '31_60', outstanding_amount: 250 },
      { aging_bucket: '31_60', outstanding_amount: 50 },
      { aging_bucket: '90_plus', outstanding_amount: 1000 },
    ])
    expect(summary.map(s => s.bucket)).toEqual(['current', '1_30', '31_60', '61_90', '90_plus'])
    expect(summary.map(s => s.count)).toEqual([1, 0, 2, 0, 1])
    expect(summary.map(s => s.outstanding)).toEqual([100, 0, 300, 0, 1000])
  })

  it('treats a row with an unknown bucket as current', () => {
    const summary = summarizeAging([{ aging_bucket: undefined as unknown as 'current', outstanding_amount: 5 }])
    expect(summary[0]).toEqual({ bucket: 'current', count: 1, outstanding: 5 })
  })

  it('colours by severity', () => {
    expect(agingBucketColor('current')).toBe('neutral')
    expect(agingBucketColor('1_30')).toBe('warning')
    expect(agingBucketColor('61_90')).toBe('error')
  })
})
