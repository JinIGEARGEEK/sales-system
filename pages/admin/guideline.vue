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
        class="pointer-events-none absolute inset-x-4 -bottom-px h-px bg-linear-to-r from-transparent via-[rgba(250,204,21,0.8)] to-[rgba(96,165,250,0.8)] opacity-80 shadow-[0_0_8px_1px_rgba(96,165,250,0.5)]"
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
      <UCard
        v-for="topic in topics"
        :id="`guideline-topic-${topic.key}`"
        :key="topic.key"
        class="transition-shadow duration-700"
        :class="topic.key === highlightedTopicKey ? 'ring-2 ring-[var(--color-warning-toast)] shadow-[0_0_24px_rgba(248,196,14,0.45)]' : ''"
        :ui="GLASS_PANEL_UI"
      >
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
                v-if="!isStepBlockedForActiveTab(step)"
                :to="NAV_META[step.nav]?.path ?? '/'"
                class="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gray)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-gray)] transition-colors hover:bg-[var(--color-primary-bg)] hover:text-[var(--color-primary)]"
              >
                <UIcon :name="NAV_META[step.nav]?.icon ?? 'material-symbols:menu-open-rounded'" class="size-3.5" />
                <span>{{ t(`layout.nav.${step.nav}`) }}</span>
                <UIcon name="material-symbols:chevron-right-rounded" class="size-3.5" />
              </NuxtLink>
              <!-- Same chip, but non-navigable: this step's own restriction text says
              it isn't available to the active tab's role, so linking there anyway
              would contradict what the chip is telling the reader. -->
              <span
                v-else
                class="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gray)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-gray)] opacity-60"
              >
                <UIcon :name="NAV_META[step.nav]?.icon ?? 'material-symbols:menu-open-rounded'" class="size-3.5" />
                <span>{{ t(`layout.nav.${step.nav}`) }}</span>
              </span>

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
const stepMatchesQuery = (step: GuidelineStep) =>
  matchesQuery(step.text) || matchesQuery(step.restriction ?? '') || matchesQuery(t(`layout.nav.${step.nav}`))

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

// UCard's root defaults to `overflow-hidden`, which clips the search preview
// dropdown below it — override that so the dropdown can extend past the card.
// The stuck state picks up the same yellow-to-blue gradient ring used on the
// sidebar nav items (see .guideline-search-card below), instead of a plain
// blue ring.
const searchBarCardUi = computed(() => ({
  root: `overflow-visible guideline-search-card ${isSearchBarStuck.value
    ? 'is-stuck bg-white/10 backdrop-blur-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]'
    : ''}`,
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

// The Production tab renders every step of a topic assigned to it (see
// topicKeysByTab below) even when a specific step's own restriction text
// says it's off-limits — e.g. projectMilestones' Contract/Quote/Payment
// step is "not available to Production." Previously the chip still linked
// there regardless, contradicting the very text next to it. This only needs
// to check the Production tab specifically: restriction text is free-form
// prose, not a structured role list, so matching the one phrasing this
// codebase actually uses for "excluded" is more robust than trying to parse
// arbitrary restriction strings into role sets.
const isStepBlockedForActiveTab = (step: GuidelineStep) =>
  activeTab.value === 'production' && /not available to Production|ไม่รวม Production/.test(step.restriction ?? '')

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

const currentTopicKeys = computed(() => topicKeysByTab[activeTab.value] ?? [])

// The page below the search box always browses by role tab — search is a
// separate live-preview dropdown layered on top, not a page replacement.
const topics = computed<GuidelineTopic[]>(() => currentTopicKeys.value.map(buildTopic))

interface SearchPreviewResult {
  id: string
  icon: string
  title: string
  topicTitle: string
  roleLabel: string
  topicKey: string
}

const isSearchFocused = ref(false)
const BLUR_CLOSE_DELAY_MS = 150
const onSearchBlur = () => {
  // Delay so a click on a dropdown row registers before the dropdown unmounts.
  setTimeout(() => { isSearchFocused.value = false }, BLUR_CLOSE_DELAY_MS)
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

const showSearchPreview = computed(() => isSearchFocused.value && isSearching.value)

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

<style scoped>
/*
 * Search bar stuck border: same yellow-to-blue gradient ring treatment as
 * the sidebar nav items (.sidebar-nav-link in layouts/default.vue), drawn
 * via a mask-clipped ::before since border-color can't take a gradient.
 * Only shown once the bar is actually floating (is-stuck).
 *
 * No `position: relative` here on purpose: this class lives on the same
 * element as the `sticky` Tailwind utility (merged in via UCard's root ui +
 * the component's own `class`). Both are single-class selectors of equal
 * specificity, so adding `position: relative` here risked the cascade
 * flipping `position: sticky` back to `relative` and breaking the float —
 * `position: sticky` already establishes a positioning context for the
 * absolutely-positioned ::before below, so it isn't needed anyway.
 */
.guideline-search-card.is-stuck {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 0 12px rgba(250, 204, 21, 0.25), 0 0 18px rgba(96, 165, 250, 0.25);
}

.guideline-search-card.is-stuck::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.9), rgba(96, 165, 250, 0.9));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
</style>
