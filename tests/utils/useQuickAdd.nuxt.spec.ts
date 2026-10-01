import { describe, it, expect } from 'vitest'
import { relatedTargetFromPath, useQuickAdd } from '~/composables/utils/useQuickAdd'

describe('relatedTargetFromPath', () => {
  it('maps a detail page (and its tabs) to its record', () => {
    expect(relatedTargetFromPath('/crm/deals/12')).toEqual({ type: 'deal', id: 12 })
    expect(relatedTargetFromPath('/crm/deals/12/tasks')).toEqual({ type: 'deal', id: 12 })
    expect(relatedTargetFromPath('/crm/companies/3')).toEqual({ type: 'company', id: 3 })
    expect(relatedTargetFromPath('/crm/contacts/4')).toEqual({ type: 'contact', id: 4 })
    expect(relatedTargetFromPath('/crm/leads/5')).toEqual({ type: 'lead', id: 5 })
    expect(relatedTargetFromPath('/crm/prospects/6')).toEqual({ type: 'prospect', id: 6 })
  })

  it('ignores lists, create pages and other entities', () => {
    expect(relatedTargetFromPath('/crm/deals')).toBeNull()
    expect(relatedTargetFromPath('/crm/deals/create')).toBeNull()
    expect(relatedTargetFromPath('/crm/quotes/7')).toBeNull()
    expect(relatedTargetFromPath('/')).toBeNull()
  })
})

describe('useQuickAdd', () => {
  it('records each request, so the same one twice still changes the state', () => {
    const { request, openTask, openActivity } = useQuickAdd()
    openTask({ type: 'deal', id: 1 })
    const first = request.value
    openTask({ type: 'deal', id: 1 })
    expect(request.value).not.toBe(first)
    expect(request.value).toMatchObject({ kind: 'task', target: { type: 'deal', id: 1 } })
    openActivity()
    expect(request.value).toMatchObject({ kind: 'activity', target: null })
  })
})
