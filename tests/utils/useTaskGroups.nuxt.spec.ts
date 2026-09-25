import { describe, it, expect } from 'vitest'
import { taskDueBucket, taskGroupQuery, taskGroupsForStatus } from '~/composables/utils/useTaskGroups'

// Friday 25 Sep 2026, mid-afternoon local time.
const NOW = new Date(2026, 8, 25, 15, 30)
const localMidnight = (day: number) => new Date(2026, 8, day).toISOString()

describe('useTaskGroups helpers', () => {
  it('maps the Status filter to the groups it shows', () => {
    expect(taskGroupsForStatus('pending')).toEqual(['overdue', 'today', 'upcoming'])
    expect(taskGroupsForStatus('done')).toEqual(['done'])
    expect(taskGroupsForStatus('all')).toEqual(['overdue', 'today', 'upcoming', 'done'])
  })

  it('bounds each pending group by the viewer\'s local midnights', () => {
    expect(taskGroupQuery('overdue', NOW)).toEqual({ status: 'pending', due_before: localMidnight(25), sort: 'due_date' })
    expect(taskGroupQuery('today', NOW)).toEqual({ status: 'pending', due_from: localMidnight(25), due_before: localMidnight(26), sort: 'due_date' })
    expect(taskGroupQuery('upcoming', NOW)).toEqual({ status: 'pending', due_from: localMidnight(26), sort: 'due_date' })
    expect(taskGroupQuery('done', NOW)).toEqual({ status: 'done', sort: '-due_date' })
  })

  it('buckets a single task on the same boundaries', () => {
    const pending = (due: Date) => ({ status: 'pending' as const, due_date: due })
    expect(taskDueBucket(pending(new Date(2026, 8, 24, 23, 59)), NOW)).toBe('overdue')
    // Due earlier today is "today", not overdue, until the day is over.
    expect(taskDueBucket(pending(new Date(2026, 8, 25, 7, 0)), NOW)).toBe('today')
    expect(taskDueBucket(pending(new Date(2026, 8, 26)), NOW)).toBe('upcoming')
    expect(taskDueBucket({ status: 'done', due_date: new Date(2026, 8, 1) }, NOW)).toBe('done')
  })
})
