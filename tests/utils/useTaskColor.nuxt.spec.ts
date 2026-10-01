import { describe, it, expect } from 'vitest'
import { taskDueColor, taskPriorityColor } from '~/composables/utils/useTaskColor'

const NOW = new Date(2026, 8, 25, 10, 0)
const pending = (due_date: Date) => ({ status: 'pending' as TaskStatus, due_date })

describe('taskDueColor', () => {
  it('is red only once a pending task is past its due day', () => {
    expect(taskDueColor(pending(new Date(2026, 8, 24, 23, 59)), NOW)).toBe('error')
  })

  it('uses the primary accent for a task due today, even earlier today', () => {
    expect(taskDueColor(pending(new Date(2026, 8, 25, 7, 0)), NOW)).toBe('primary')
  })

  it('stays neutral for an upcoming or a done task', () => {
    expect(taskDueColor(pending(new Date(2026, 8, 26)), NOW)).toBe('neutral')
    expect(taskDueColor({ status: 'done', due_date: new Date(2026, 8, 1) }, NOW)).toBe('neutral')
  })
})

describe('taskPriorityColor', () => {
  it('flags only High priority', () => {
    expect(taskPriorityColor('high')).toBe('error')
    expect(taskPriorityColor('medium')).toBe('neutral')
    expect(taskPriorityColor('low')).toBe('neutral')
  })
})
