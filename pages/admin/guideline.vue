<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black">{{ t('admin.guideline.title') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('admin.guideline.subtitle') }}</p>
    </div>

    <!-- Sticks below the layout's own sticky header, then turns to glass once it's actually floating -->
    <div ref="searchBarSentinelRef" />
    <UCard
      class="sticky top-3 z-20 mb-4 transition-[background-color,backdrop-filter,box-shadow] duration-200 md:top-[calc(var(--layout-header-height)+12px)]"
      :ui="searchBarCardUi"
    >
      <div
        v-if="isSearchBarStuck"
        class="pointer-events-none absolute inset-x-4 -bottom-px h-px bg-linear-to-r from-transparent via-(--color-secondary) to-transparent opacity-80 shadow-[0_0_8px_1px_var(--color-secondary)]"
      />
      <div class="relative">
        <UInput
          v-model="searchQuery"
          icon="material-symbols:search"
          :placeholder="t('admin.guideline.searchPlaceholder')"
          class="w-full"
          autocomplete="off"
          @focus="isSearchFocused = true"
          @blur="onSearchBlur"
          @keydown.escape="searchQuery = ''"
        >
          <template v-if="searchQuery" #trailing>
            <UButton
              icon="material-symbols:close"
              variant="ghost"
              color="neutral"
              size="xs"
              :aria-label="t('admin.guideline.clearSearch')"
              @click="searchQuery = ''"
            />
          </template>
        </UInput>

        <!-- Live search preview: a command-palette-style dropdown, not a page replacement -->
        <div
          v-if="showSearchPreview"
          class="absolute inset-x-0 top-full z-20 mt-1.5 max-h-96 overflow-y-auto rounded-lg border border-[rgba(96,165,250,0.45)] bg-white shadow-xl"
        >
          <button
            v-for="result in searchPreviewResults"
            :key="result.id"
            type="button"
            class="flex w-full items-start gap-3 border-b border-[var(--color-gray)]/10 px-3 py-2.5 text-left last:border-b-0 hover:bg-[var(--color-primary-bg)]"
            @click="goToSearchResult(result)"
          >
            <UIcon :name="result.icon" class="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium">{{ result.title }}</span>
              <span class="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--color-gray)]">
                {{ result.topicTitle }}
                <UIcon name="material-symbols:chevron-right" class="size-3.5 shrink-0" />
                <span class="text-[var(--color-accent-green)]">{{ result.roleLabel }}</span>
              </span>
            </span>
          </button>

          <p v-if="searchPreviewResults.length === 0" class="px-3 py-4 text-center text-sm text-[var(--color-gray)]">
            {{ t('admin.guideline.noResultsTitle') }}
          </p>
        </div>
      </div>
    </UCard>

    <UTabs v-model="activeTab" :items="tabItems" class="mb-4" />

    <UCard :ui="{ root: `${GLASS_PANEL_UI.root} border-l-4 border-l-[var(--color-primary)]` }" class="mb-4">
      <div class="flex items-start gap-2.5">
        <UIcon :name="roleFocusIcon" class="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]" />
        <p class="text-sm">{{ roleFocus }}</p>
      </div>
    </UCard>

    <div class="flex flex-col gap-4">
      <UCard v-for="topic in topics" :id="`guideline-topic-${topic.key}`" :key="topic.key" :ui="GLASS_PANEL_UI">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon :name="topic.flowIcons[0] ?? 'material-symbols:info-outline'" class="size-4 text-[var(--color-primary)]" />
            <h3 class="text-sm font-bold">{{ topic.title }}</h3>
          </div>
        </template>

        <!-- Flow diagram: the record types this guideline moves through, left to right -->
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <template v-for="(step, index) in topic.flow" :key="step">
            <div class="flex items-center gap-1.5 rounded-full bg-[var(--color-primary-bg)] px-3 py-1.5">
              <UIcon :name="topic.flowIcons[index] ?? 'material-symbols:circle'" class="size-4 text-[var(--color-primary)]" />
              <span class="text-xs font-semibold text-[var(--color-primary)]">{{ step }}</span>
            </div>
            <UIcon
              v-if="index < topic.flow.length - 1"
              name="material-symbols:arrow-forward-rounded"
              class="size-4 shrink-0 text-[var(--color-gray)]"
            />
          </template>
        </div>

        <p class="mb-4 text-sm leading-relaxed text-[var(--color-gray)]">{{ topic.description }}</p>

        <div class="flex flex-col">
          <div v-for="(step, index) in topic.steps" :key="index" class="flex gap-3">
            <div class="flex flex-col items-center">
              <div class="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
                {{ index + 1 }}
              </div>
              <div v-if="index < topic.steps.length - 1" class="my-1 w-px flex-1 bg-[var(--color-gray)]/15" />
            </div>

            <div class="flex-1 space-y-1.5 pb-4">
              <NuxtLink
                :to="NAV_META[step.nav]?.path ?? '/'"
                class="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gray)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-gray)] transition-colors hover:bg-[var(--color-primary-bg)] hover:text-[var(--color-primary)]"
              >
                <UIcon :name="NAV_META[step.nav]?.icon ?? 'material-symbols:menu-open-rounded'" class="size-3.5" />
                <span>{{ t(`layout.nav.${step.nav}`) }}</span>
                <UIcon name="material-symbols:chevron-right-rounded" class="size-3.5" />
              </NuxtLink>

              <!-- eslint-disable-next-line vue/no-v-html -->
              <p class="text-sm leading-relaxed" v-html="highlightKeyTerms(step.text)" />

              <p
                v-if="step.restriction"
                class="flex items-start gap-1 text-xs"
                :class="isOpenToAllSalesRoles(step.restriction) ? 'text-[var(--color-gray)]' : 'font-medium text-amber-600'"
              >
                <UIcon
                  :name="isOpenToAllSalesRoles(step.restriction) ? 'material-symbols:check-circle-outline' : 'material-symbols:lock-outline'"
                  class="mt-0.5 size-3.5 shrink-0"
                />
                <span>{{ step.restriction }}</span>
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <p class="mt-5 flex items-center gap-1.5 text-xs text-[var(--color-gray)]">
      <UIcon name="material-symbols:info-outline" class="size-3.5 shrink-0" />
      {{ t('admin.guideline.legendHint') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GLASS_PANEL_UI } from '~/constants/ui'

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

// Same sticky-then-glass mechanism as the dashboard filter bar (pages/index.vue):
// a zero-height sentinel right above the sticky card flips this ref the instant
// the card starts floating, so it can pick up the frosted look at that point.
const isSearchBarStuck = ref(false)
const searchBarSentinelRef = ref<HTMLElement | null>(null)
onMounted(() => {
  const sentinelEl = searchBarSentinelRef.value
  const mainEl = sentinelEl?.closest('main') ?? null
  if (!sentinelEl || !mainEl) return
  const observer = new IntersectionObserver(
    ([entry]) => { isSearchBarStuck.value = !entry.isIntersecting },
    { root: mainEl, threshold: 0 },
  )
  observer.observe(sentinelEl)
  onUnmounted(() => observer.disconnect())
})

const searchBarCardUi = computed(() => ({
  root: isSearchBarStuck.value
    ? 'bg-white/10 backdrop-blur-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(96,165,250,0.4)] ring-1 ring-[rgba(96,165,250,0.4)]'
    : '',
  body: 'p-2 sm:p-3',
}))

const tabItems = computed(() => [
  { label: t('admin.guideline.roleTabs.salesRep'), value: 'salesRep' },
  { label: t('admin.guideline.roleTabs.salesManager'), value: 'salesManager' },
  { label: t('admin.guideline.roleTabs.admin'), value: 'admin' },
  { label: t('admin.guideline.roleTabs.production'), value: 'production' },
])

const roleFocus = computed(() => t(`admin.guideline.roleFocus.${activeTab.value}`))

const roleFocusIconByTab: Record<string, string> = {
  salesRep: 'material-symbols:person-outline',
  salesManager: 'material-symbols:supervisor-account-outline',
  admin: 'material-symbols:shield-person-outline',
  production: 'material-symbols:precision-manufacturing-outline',
}
const roleFocusIcon = computed(() => roleFocusIconByTab[activeTab.value] ?? 'material-symbols:person-outline')

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

interface GuidelineStep {
  nav: string
  text: string
  restriction?: string
}

// Mirrors layouts/default.vue's nav icons/paths so the chip a step points to
// looks exactly like the sidebar entry it's naming.
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
// step has no special role limits — anything else describes a real
// restriction and gets the amber "limited" treatment instead.
const OPEN_TO_ALL_SALES_ROLES = 'Sales Rep, Sales Manager, Admin'
const isOpenToAllSalesRoles = (restriction: string) => restriction === OPEN_TO_ALL_SALES_ROLES

interface GuidelineTopic {
  key: string
  title: string
  description: string
  flow: string[]
  flowIcons: string[]
  steps: GuidelineStep[]
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

// The page below the search box always browses by role tab — search is a
// separate live-preview dropdown layered on top, not a page replacement.
const topics = computed<GuidelineTopic[]>(() => (topicKeysByTab[activeTab.value] ?? []).map(buildTopic))

interface SearchPreviewResult {
  id: string
  icon: string
  title: string
  topicTitle: string
  roleLabel: string
  topicKey: string
}

const isSearchFocused = ref(false)
const onSearchBlur = () => {
  // Delay so a click on a dropdown row registers before the dropdown unmounts.
  setTimeout(() => { isSearchFocused.value = false }, 150)
}

const MAX_SEARCH_RESULTS = 8

// One pass over every topic (not per role tab) so a step shared by Sales
// Rep/Sales Manager/Admin shows up once, with its restriction text doing the
// "which roles" job instead of three near-identical rows.
const searchPreviewResults = computed<SearchPreviewResult[]>(() => {
  if (!isSearching.value) return []
  const results: SearchPreviewResult[] = []

  for (const key of ALL_TOPIC_KEYS) {
    const topic = buildTopic(key)
    const matchingSteps = topic.steps.filter(step =>
      matchesQuery(step.text)
      || matchesQuery(step.restriction ?? '')
      || matchesQuery(t(`layout.nav.${step.nav}`)),
    )

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

const showSearchPreview = computed(() => isSearchFocused.value && isSearching.value)

const goToSearchResult = (result: SearchPreviewResult) => {
  if (!(topicKeysByTab[activeTab.value] ?? []).includes(result.topicKey)) {
    const fallbackTab = Object.keys(topicKeysByTab).find(tab => (topicKeysByTab[tab] ?? []).includes(result.topicKey))
    if (fallbackTab) activeTab.value = fallbackTab
  }
  searchQuery.value = ''
  nextTick(() => {
    document.getElementById(`guideline-topic-${result.topicKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// The CRM record types these guidelines talk about — highlighted inline so
// they stand out from the surrounding instruction text. Longer phrases must
// come before the single words they contain (e.g. "Lead Score" before "Lead")
// so the regex alternation matches the full phrase first.
const KEY_TERMS = [
  'Lead Score', 'Sales Rep', 'Sales Manager', 'Pipeline Stage', 'Reminder Task',
  'Payment Milestone', 'Upsell Deal', 'Company History',
  'Leads', 'Lead', 'Deals', 'Deal', 'Tasks', 'Task', 'Projects', 'Project',
  'Contracts', 'Contract', 'Quotes', 'Quote', 'Payments', 'Payment',
  'Activities', 'Activity', 'Tags', 'Tag', 'Milestones', 'Milestone',
  'Subscriptions', 'Subscription', 'Companies', 'Company', 'Contacts', 'Contact',
  'Pipeline', 'Won', 'Renewed', 'Touchpoint',
]
const KEY_TERMS_REGEX = new RegExp(`\\b(${KEY_TERMS.join('|')})\\b`, 'g')

const escapeHtml = (text: string) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const highlightKeyTerms = (text: string) => escapeHtml(text).replace(
  KEY_TERMS_REGEX,
  '<mark class="bg-transparent text-inherit underline decoration-[var(--color-warning-toast)] decoration-2 underline-offset-2">$1</mark>',
)
</script>
