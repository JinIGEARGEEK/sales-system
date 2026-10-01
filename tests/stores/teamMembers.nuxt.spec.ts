import { describe, it, expect, beforeEach } from 'vitest'

const member = (id: number, role?: Role): TeamMember => ({ id, name: `M${id}`, email: `m${id}@example.com`, role })

describe('teamMembers store', () => {
  beforeEach(() => {
    useTeamMembersStore().items = [member(1, 'Admin'), member(2, 'Production'), member(3, 'Marketing'), member(4)]
  })

  it('leaves Production out of assignee pickers (the API 422s on assigned_to) but not out of filters', () => {
    const store = useTeamMembersStore()

    expect(store.assigneeOptions.map(o => o.value)).toEqual(['1', '3', '4'])
    expect(store.bulkReassignOptions.map(o => o.value)).toEqual(['unassigned', '1', '3', '4'])
    expect(store.options.map(o => o.value)).toEqual(['1', '2', '3', '4'])
    expect(store.filterOptions.map(o => o.value)).toEqual(['all', 'unassigned', '1', '2', '3', '4'])
  })
})
