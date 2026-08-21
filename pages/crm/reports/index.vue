<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black">{{ t('crm.reports.heading') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.subheading') }}</p>
    </div>

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
           card — the previous flat grid gave every report equal visual
           weight regardless of whether it had anything to report. -->
      <h3 class="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-gray)] uppercase">
        <span class="size-2 rounded-full bg-[var(--color-warning-hover)]" aria-hidden="true" />
        {{ t('crm.reports.sectionNeedsAttention') }}
      </h3>
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink v-for="card in attentionCards" :key="card.path" :to="card.path">
          <!-- Warm accent (left border + icon chip) ties every card in this
               section back to the amber dot in its header — colour carries
               the grouping, not just the section label text. -->
          <UCard class="h-full border-l-4 border-l-[var(--color-warning-hover)] ring-[var(--color-card-border)] transition hover:bg-[var(--color-light-gray-1)]">
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-warning-hover)]/15">
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
                    {{ counts[card.key] === 0 ? t('crm.reports.allClear') : counts[card.key] }}
                  </UBadge>
                  <USkeleton v-else class="h-5 w-10 shrink-0 rounded-full" />
                </div>
                <p class="mt-1 text-sm text-[var(--color-gray)]">{{ card.description }}</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>
      </div>

      <h3 class="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-gray)] uppercase">
        <span class="size-2 rounded-full bg-[var(--color-info-toast)]" aria-hidden="true" />
        {{ t('crm.reports.sectionAnalytics') }}
      </h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink v-for="card in analyticsCards" :key="card.path" :to="card.path">
          <!-- Cool accent, deliberately distinct from the warm "Needs
               Attention" one above — these are breakdowns to read, not
               problems to act on, and the color says so before the label
               does. -->
          <UCard class="h-full border-l-4 border-l-[var(--color-info-toast)] ring-[var(--color-card-border)] transition hover:bg-[var(--color-light-gray-1)]">
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-info-toast)]/15">
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
