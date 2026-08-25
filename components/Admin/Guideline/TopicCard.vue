<template>
  <UCard
    :id="`guideline-topic-${topic.key}`"
    class="transition-shadow duration-700"
    :class="isHighlighted ? 'ring-2 ring-[var(--color-warning-toast)] shadow-[0_0_24px_rgba(248,196,14,0.45)]' : ''"
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
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GLASS_PANEL_UI } from '~/constants/ui'
import type { GuidelineStep, GuidelineTopic } from './types'

const props = defineProps<{
  topic: GuidelineTopic
  activeTab: string
  isHighlighted: boolean
}>()

const { t } = useI18n()

// Mirrors layouts/default.vue's nav icons/paths so the chip a step points to
// looks exactly like the sidebar entry it's naming. (The page keeps its own
// copy of this map too, for resolving a search result's icon.)
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
// topicKeysByTab on the page) even when a specific step's own restriction
// text says it's off-limits — e.g. projectMilestones' Contract/Quote/Payment
// step is "not available to Production." Previously the chip still linked
// there regardless, contradicting the very text next to it. This only needs
// to check the Production tab specifically: restriction text is free-form
// prose, not a structured role list, so matching the one phrasing this
// codebase actually uses for "excluded" is more robust than trying to parse
// arbitrary restriction strings into role sets.
const isStepBlockedForActiveTab = (step: GuidelineStep) =>
  props.activeTab === 'production' && /not available to Production|ไม่รวม Production/.test(step.restriction ?? '')

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
