<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black">{{ t('admin.guideline.title') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('admin.guideline.subtitle') }}</p>
    </div>

    <AdminGuidelineSearchBar v-model="searchQuery" :results="searchPreviewResults" @select="goToSearchResult" />

    <AdminGuidelineRoleTabs v-model="activeTab" />

    <AdminGuidelineRoleFocusBanner :active-tab="activeTab" />

    <div class="flex flex-col gap-4">
      <AdminGuidelineTopicCard
        v-for="topic in topics"
        :key="topic.key"
        :topic="topic"
        :active-tab="activeTab"
        :is-highlighted="topic.key === highlightedTopicKey"
      />
    </div>

    <p class="mt-5 flex items-center gap-1.5 text-xs text-[var(--color-gray)]">
      <UIcon name="material-symbols:info-outline" class="size-3.5 shrink-0" />
      {{ t('admin.guideline.legendHint') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { GuidelineStep, GuidelineTopic, SearchPreviewResult } from '~/components/Admin/Guideline/types'

const { t, tm } = useI18n()

useHead({ title: t('admin.guideline.title') })

const { role } = storeToRefs(useUserStore())

const roleTabValueByRole: Record<Role, string> = {
  'Sales Rep': 'salesRep',
  'Sales Manager': 'salesManager',
  Admin: 'admin',
  Production: 'production',
}

const activeTab = ref(roleTabValueByRole[role.value] ?? 'salesRep')

const searchQuery = ref('')
const normalizedQuery = computed(() => searchQuery.value.trim().toLowerCase())
const isSearching = computed(() => normalizedQuery.value !== '')
const matchesQuery = (text: string) => text.toLowerCase().includes(normalizedQuery.value)
const stepMatchesQuery = (step: GuidelineStep) =>
  matchesQuery(step.text) || matchesQuery(step.restriction ?? '') || matchesQuery(t(`layout.nav.${step.nav}`))

// Which guideline topics are relevant per role — Production only touches
// project delivery milestones, everyone else sees the full sales workflow.
const ALL_TOPIC_KEYS = ['leadToDeal', 'subscriptionFollowup', 'projectMilestones', 'loyaltyUpsell']
const topicKeysByTab: Record<string, string[]> = {
  salesRep: ALL_TOPIC_KEYS,
  salesManager: ALL_TOPIC_KEYS,
  admin: ALL_TOPIC_KEYS,
  production: ['projectMilestones'],
}

// One icon per flow step, keyed by topic — independent of locale text.
const flowIconsByTopic: Record<string, string[]> = {
  leadToDeal: ['material-symbols:person-search-outline', 'material-symbols:handshake-outline', 'material-symbols:trophy-outline'],
  subscriptionFollowup: ['material-symbols:autorenew', 'material-symbols:checklist', 'material-symbols:event-repeat-outline'],
  projectMilestones: ['material-symbols:engineering-outline', 'material-symbols:flag-outline', 'material-symbols:payments-outline'],
  loyaltyUpsell: ['material-symbols:apartment-outline', 'material-symbols:favorite-outline', 'material-symbols:trending-up'],
}

const buildTopic = (key: string): GuidelineTopic => {
  const base = `admin.guideline.topics.${key}`
  return {
    key,
    title: t(`${base}.title`),
    description: t(`${base}.description`),
    flow: tm(`${base}.flow`) as string[],
    flowIcons: flowIconsByTopic[key] ?? [],
    steps: tm(`${base}.steps`) as GuidelineStep[],
  }
}

const currentTopicKeys = computed(() => topicKeysByTab[activeTab.value] ?? [])

// The page below the search box always browses by role tab — search is a
// separate live-preview dropdown layered on top, not a page replacement.
const topics = computed<GuidelineTopic[]>(() => currentTopicKeys.value.map(buildTopic))

// Mirrors layouts/default.vue's nav icons/paths — used here only to resolve
// a search result's icon; AdminGuidelineTopicCard keeps its own copy for
// rendering the step chips themselves.
const NAV_META: Record<string, { path: string, icon: string }> = {
  leads: { path: '/crm/leads', icon: 'material-symbols:person-search-outline' },
  deals: { path: '/crm/deals', icon: 'material-symbols:handshake-outline' },
  tasks: { path: '/crm/tasks', icon: 'material-symbols:checklist' },
  projects: { path: '/crm/projects', icon: 'material-symbols:engineering-outline' },
  companies: { path: '/crm/companies', icon: 'material-symbols:apartment-outline' },
  contacts: { path: '/crm/contacts', icon: 'material-symbols:contacts-outline' },
  tags: { path: '/crm/tags', icon: 'material-symbols:sell-outline' },
}

// The default/unrestricted phrasing used across the locale files whenever a
// step has no special role limits — used here as the fallback role label for
// a search result.
const OPEN_TO_ALL_SALES_ROLES = 'Sales Rep, Sales Manager, Admin'

const MAX_SEARCH_RESULTS = 8

// One pass over every topic (not per role tab) so a step shared by Sales
// Rep/Sales Manager/Admin shows up once, with its restriction text doing the
// "which roles" job instead of three near-identical rows.
const searchPreviewResults = computed<SearchPreviewResult[]>(() => {
  if (!isSearching.value) return []
  const results: SearchPreviewResult[] = []

  for (const key of ALL_TOPIC_KEYS) {
    const topic = buildTopic(key)
    const matchingSteps = topic.steps.filter(stepMatchesQuery)

    if (matchingSteps.length > 0) {
      matchingSteps.forEach((step, index) => {
        results.push({
          id: `${key}-step-${index}`,
          icon: NAV_META[step.nav]?.icon ?? 'material-symbols:menu-open-rounded',
          title: step.text,
          topicTitle: topic.title,
          roleLabel: step.restriction ?? OPEN_TO_ALL_SALES_ROLES,
          topicKey: key,
        })
      })
      continue
    }

    if (matchesQuery(topic.title) || matchesQuery(topic.description) || topic.flow.some(matchesQuery)) {
      results.push({
        id: `${key}-topic`,
        icon: topic.flowIcons[0] ?? 'material-symbols:info-outline',
        title: topic.title,
        topicTitle: topic.description,
        roleLabel: topic.steps[0]?.restriction ?? OPEN_TO_ALL_SALES_ROLES,
        topicKey: key,
      })
    }
  }

  return results.slice(0, MAX_SEARCH_RESULTS)
})

// Briefly rings the card a jump landed on so it's obvious at a glance which
// one matched, then fades back to normal on its own.
const highlightedTopicKey = ref<string | null>(null)
const HIGHLIGHT_DURATION_MS = 3000

const goToSearchResult = (result: SearchPreviewResult) => {
  if (!currentTopicKeys.value.includes(result.topicKey)) {
    const fallbackTab = Object.keys(topicKeysByTab).find(tab => (topicKeysByTab[tab] ?? []).includes(result.topicKey))
    if (fallbackTab) activeTab.value = fallbackTab
  }
  searchQuery.value = ''
  nextTick(() => {
    document.getElementById(`guideline-topic-${result.topicKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  highlightedTopicKey.value = result.topicKey
  setTimeout(() => {
    if (highlightedTopicKey.value === result.topicKey) highlightedTopicKey.value = null
  }, HIGHLIGHT_DURATION_MS)
}
</script>
