// Barrel re-export so existing `import { X } from '~/constants/mockData'` call sites
// across the codebase don't need to change — the domain split lives entirely in here.
export * from './admin'
export * from './companies'
export * from './contacts'
export * from './tags'
export * from './leads'
export * from './deals'
export * from './team'
export * from './activities'
export * from './quotes'
