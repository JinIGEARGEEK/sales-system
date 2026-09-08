export const ACTIVITY_TYPE_OPTIONS: Select[] = [
  { label: 'Call', value: 'call' },
  { label: 'Email', value: 'email' },
  { label: 'Meeting', value: 'meeting' },
]

// Shared by AddTaskModal and AddActivityModal's own "Relates To" picker —
// both Task and Activity related_type is the same ActivityRelatedType/
// TaskRelatedType union, minus 'lead' (neither modal exposes logging
// directly against a Lead; Leads only pick up Tasks/Activities today via
// bulk Campaign creation, not this manual picker).
export const RELATED_TYPE_OPTIONS: Select[] = [
  { label: 'Deal', value: 'deal' },
  { label: 'Contact', value: 'contact' },
  { label: 'Company', value: 'company' },
  { label: 'Prospect', value: 'prospect' },
]
