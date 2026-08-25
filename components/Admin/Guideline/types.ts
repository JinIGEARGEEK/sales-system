// Shared shapes for the Admin Guideline page and its subcomponents
// (components/Admin/Guideline/*). Kept as a plain module (not a .vue file)
// so it can be imported from the page and from sibling components without
// being picked up by Nuxt's component auto-import.

export interface GuidelineStep {
  nav: string
  text: string
  restriction?: string
}

export interface GuidelineTopic {
  key: string
  title: string
  description: string
  flow: string[]
  flowIcons: string[]
  steps: GuidelineStep[]
}

export interface SearchPreviewResult {
  id: string
  icon: string
  title: string
  topicTitle: string
  roleLabel: string
  topicKey: string
}
