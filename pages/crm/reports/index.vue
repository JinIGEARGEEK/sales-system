<template>
  <div class="p-5">
    <!-- Glass hero: same bg/blur/border vocabulary as GLASS_PANEL_UI (used
         by every filter bar in the app), so this page's very first element
         already reads as "glass" rather than a plain heading. Surfaces the
         one number that matters most — total items needing a look across
         every "Needs Attention" report — before anyone scrolls to the cards. -->
    <UCard class="mb-5" :ui="GLASS_PANEL_UI">
      <div class="flex items-center gap-4">
        <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[rgba(198,158,82,0.35)] to-[rgba(45,114,167,0.25)] ring-1 ring-white/50 backdrop-blur-sm">
          <UIcon name="material-symbols:insights" class="size-6 text-[var(--color-primary)]" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-xl font-black">{{ t('crm.reports.heading') }}</h2>
          <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.subheading') }}</p>
        </div>
        <div v-if="canViewReports" class="hidden shrink-0 text-right sm:block">
          <p class="text-2xl font-black" :class="totalAttentionCount ? 'text-[var(--color-warning-hover)]' : 'text-[var(--color-gray)]'">
            <USkeleton v-if="totalAttentionCount === undefined" class="ml-auto h-7 w-10" />
            <template v-else>{{ totalAttentionCount }}</template>
          </p>
          <p class="text-xs text-[var(--color-gray)]">{{ t('crm.reports.summaryHint') }}</p>
        </div>
      </div>
    </UCard>

    <UAlert
      v-if="!canViewReports"
      color="error"
      variant="subtle"
      icon="material-symbols:lock-outline"
      :title="t('crm.reports.accessDeniedTitle')"
      :description="t('crm.reports.accessDeniedMessage')"
    />

    <template v-else>
      <!-- Problem-list reports first, each surfacing a live count badge so
           which ones actually need a look is visible without opening every
           card. The section chip repeats the same warm glass tone as every
           card beneath it — color carries the grouping, the label just
           names it. -->
      <div class="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(198,158,82,0.35)] bg-[rgba(198,158,82,0.12)] px-3 py-1 backdrop-blur-sm">
        <span class="size-2 rounded-full bg-[var(--color-warning-hover)]" aria-hidden="true" />
        <span class="text-xs font-semibold tracking-wide text-[var(--color-warning-hover)] uppercase">{{ t('crm.reports.sectionNeedsAttention') }}</span>
      </div>
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink v-for="card in attentionCards" :key="card.path" :to="card.path">
          <!-- Real glass card: translucent white + heavy blur (matching
               GLASS_PANEL_UI) instead of an opaque white tile, a translucent
               warm border + glow, and a frosted icon chip. Lifts slightly
               and brightens on hover for tactile feedback. -->
          <UCard
            class="h-full border border-white/70 border-l-4 border-l-[rgba(198,158,82,0.8)] bg-white/55 backdrop-blur-xl ring-[var(--color-card-border)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/75"
            :style="{ boxShadow: '-3px 0 18px -4px rgba(198,158,82,0.6)' }"
          >
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[rgba(198,158,82,0.4)] to-[rgba(198,158,82,0.1)] ring-1 ring-[rgba(198,158,82,0.4)] backdrop-blur-sm">
                <UIcon :name="card.icon" class="size-5 text-[var(--color-warning-hover)]" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="truncate text-lg font-medium">{{ card.title }}</h3>
                  <UBadge
                    v-if="counts[card.key] !== undefined"
                    :color="badgeColor(counts[card.key])"
                    variant="subtle"
                    size="sm"
                  >
                    {{ counts[card.key] }}
                  </UBadge>
                  <USkeleton v-else class="h-5 w-10 shrink-0 rounded-full" />
                </div>
                <p class="mt-1 text-sm text-[var(--color-gray)]">{{ card.description }}</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>
      </div>

      <div class="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(45,114,167,0.35)] bg-[rgba(45,114,167,0.12)] px-3 py-1 backdrop-blur-sm">
        <span class="size-2 rounded-full bg-[var(--color-info-toast)]" aria-hidden="true" />
        <span class="text-xs font-semibold tracking-wide text-[var(--color-info-toast)] uppercase">{{ t('crm.reports.sectionAnalytics') }}</span>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink v-for="card in analyticsCards" :key="card.path" :to="card.path">
          <!-- Cool glass variant, same treatment as above just a different
               hue — these are breakdowns to read, not problems to act on. -->
          <UCard
            class="h-full border border-white/70 border-l-4 border-l-[rgba(45,114,167,0.8)] bg-white/55 backdrop-blur-xl ring-[var(--color-card-border)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/75"
            :style="{ boxShadow: '-3px 0 18px -4px rgba(45,114,167,0.6)' }"
          >
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[rgba(45,114,167,0.4)] to-[rgba(45,114,167,0.1)] ring-1 ring-[rgba(45,114,167,0.4)] backdrop-blur-sm">
                <UIcon :name="card.icon" class="size-5 text-[var(--color-info-toast)]" />
              </div>
              <div>
                <h3 class="text-lg font-medium">{{ card.title }}</h3>
                <p class="mt-1 text-sm text-[var(--color-gray)]">{{ card.description }}</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.reports.pageTitle') })

const { $api } = useNuxtApp()
const { hasRole } = useRole()
const canViewReports = computed(() => hasRole('Admin', 'Sales Manager'))

// "Needs Attention" reports are all a bounded, already-filtered problem list
// (rows.length is literally "how many need a look") — Lead Source/Customer-
// Product-Status/Win-Loss are breakdowns, not counts of at-risk items, so a
// badge on them wouldn't mean the same thing and is deliberately left off.
const attentionCards = computed(() => [
  { key: 'stalledDeals', path: '/crm/reports/stalled-deals', icon: 'material-symbols:hourglass-empty', title: t('crm.reports.stalledDeals.cardTitle'), description: t('crm.reports.stalledDeals.cardDescription') },
  { key: 'outstandingBalance', path: '/crm/reports/outstanding-balance', icon: 'material-symbols:request-quote-outline', title: t('crm.reports.outstandingBalance.cardTitle'), description: t('crm.reports.outstandingBalance.cardDescription') },
  { key: 'quotesExpiringSoon', path: '/crm/reports/quotes-expiring-soon', icon: 'material-symbols:schedule-outline', title: t('crm.reports.quotesExpiringSoon.cardTitle'), description: t('crm.reports.quotesExpiringSoon.cardDescription') },
  { key: 'contractsStuck', path: '/crm/reports/contracts-stuck', icon: 'material-symbols:draft-outline', title: t('crm.reports.contractsStuck.cardTitle'), description: t('crm.reports.contractsStuck.cardDescription') },
  { key: 'projectsAtRisk', path: '/crm/reports/projects-at-risk', icon: 'material-symbols:engineering-outline', title: t('crm.reports.projectsAtRisk.cardTitle'), description: t('crm.reports.projectsAtRisk.cardDescription') },
])

const analyticsCards = computed(() => [
  { path: '/crm/reports/lead-source', icon: 'material-symbols:person-search-outline', title: t('crm.reports.leadSource.cardTitle'), description: t('crm.reports.leadSource.cardDescription') },
  { path: '/crm/reports/customer-product-status', icon: 'material-symbols:inventory-2-outline', title: t('crm.reports.customerProductStatus.cardTitle'), description: t('crm.reports.customerProductStatus.cardDescription') },
  { path: '/crm/reports/win-loss', icon: 'material-symbols:balance-outline', title: t('crm.reports.winLoss.cardTitle'), description: t('crm.reports.winLoss.cardDescription') },
])

// key -> report endpoint, for the live count fetch below.
const ATTENTION_ENDPOINTS: Record<string, string> = {
  stalledDeals: '/reports/stalled-deals',
  outstandingBalance: '/reports/outstanding-balance',
  quotesExpiringSoon: '/reports/quotes-expiring-soon',
  contractsStuck: '/reports/contracts-stuck',
  projectsAtRisk: '/reports/projects-at-risk',
}

// undefined = still loading (renders a skeleton) so the badges don't all
// flash "0" before their real count arrives.
const counts = ref<Record<string, number | undefined>>({})

// Sum of every resolved count — undefined until every one of the 5 requests
// below has answered, so the hero number never flashes a partial total.
const totalAttentionCount = computed(() => {
  const values = Object.values(counts.value)
  if (values.length < Object.keys(ATTENTION_ENDPOINTS).length || values.some(v => v === undefined)) return undefined
  return values.reduce((sum: number, v) => sum + (v ?? 0), 0)
})

// Takes `number | undefined` (rather than narrowing via the template's
// `v-if="counts[card.key] !== undefined"`) since vue-tsc doesn't carry that
// narrowing through an indexed-access expression into the bound prop.
const badgeColor = (count: number | undefined) => {
  if (!count) return 'neutral'
  if (count >= 5) return 'error'
  return 'warning'
}

onMounted(() => {
  if (!canViewReports.value) return
  for (const [key, path] of Object.entries(ATTENTION_ENDPOINTS)) {
    $api.get<ApiResponse<unknown[]>>(path)
      .then((response) => { counts.value[key] = response.data.data.length })
      .catch(() => { /* leave as loading — a failed count isn't worth a toast on a landing page */ })
  }
})
</script>
