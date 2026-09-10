<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black">{{ t('crm.reports.heading') }}</h2>
      <p class="text-sm text-(--color-gray)">{{ t('crm.reports.subheading') }}</p>
    </div>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <!-- Problem-list reports first, each surfacing a live count badge so
           which ones actually need a look is visible without opening every
           card. The section chip repeats the same warm glass tone as every
           card beneath it — color carries the grouping, the label just
           names it. -->
      <div class="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(198,158,82,0.35)] bg-[rgba(198,158,82,0.12)] px-3 py-1 backdrop-blur-sm">
        <span class="size-2 rounded-full bg-(--color-warning-hover)" aria-hidden="true" />
        <span class="text-xs font-semibold tracking-wide text-(--color-black) uppercase">{{ t('crm.reports.sectionNeedsAttention') }}</span>
      </div>
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink v-for="card in attentionCards" :key="card.path" :to="card.path">
          <!-- Real glass card: translucent white + heavy blur + saturation
               (matching GLASS_PANEL_UI, pushed further) instead of an opaque
               white tile, a wide warm accent border + glow, an inset sheen
               ring for a liquid highlight, and a frosted icon chip. Lifts
               slightly and brightens on hover for tactile feedback. -->
          <UCard
            class="relative h-full overflow-hidden border border-white/70 bg-linear-to-br from-white/80 to-white/45 ring-1 ring-white/50 ring-inset backdrop-blur-2xl backdrop-saturate-150 transition duration-200 hover:-translate-y-0.5 hover:to-white/60"
            :style="{ boxShadow: '-4px 0 20px -4px rgba(198,158,82,0.65)' }"
          >
            <div
              class="pointer-events-none absolute inset-y-0 left-0 w-3"
              :style="{
                background: 'linear-gradient(to bottom, rgba(198,158,82,0.32), rgba(198,158,82,0.12) 50%, rgba(198,158,82,0.28))',
                maskImage: 'linear-gradient(to right, rgba(0,0,0,0.9), transparent)',
                WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.9), transparent)',
              }"
              aria-hidden="true"
            />
            <div class="flex items-start gap-2.5">
              <div class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[rgba(198,158,82,0.4)] to-[rgba(198,158,82,0.1)] ring-1 ring-[rgba(198,158,82,0.4)] backdrop-blur-sm">
                <UIcon :name="card.icon" class="size-4 text-(--color-warning-hover)" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="min-w-0 truncate text-sm font-medium">{{ card.title }}</h3>
                  <USkeleton v-if="counts[card.key] === null" class="h-5 w-6 rounded-full" />
                  <UBadge
                    v-else
                    class="shrink-0 font-semibold"
                    :color="badgeColor(counts[card.key])"
                    :variant="counts[card.key] ? 'solid' : 'subtle'"
                    size="sm"
                  >
                    {{ counts[card.key] }}
                  </UBadge>
                </div>
                <p class="mt-0.5 pr-4 text-xs text-(--color-gray)">{{ card.description }}</p>
              </div>
            </div>
            <UIcon name="material-symbols:chevron-right-rounded" class="absolute right-3 bottom-3 size-4 text-(--color-gray)/50" aria-hidden="true" />
          </UCard>
        </NuxtLink>
      </div>

      <div class="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(45,114,167,0.35)] bg-[rgba(45,114,167,0.12)] px-3 py-1 backdrop-blur-sm">
        <span class="size-2 rounded-full bg-(--color-info-toast)" aria-hidden="true" />
        <span class="text-xs font-semibold tracking-wide text-(--color-black) uppercase">{{ t('crm.reports.sectionAnalytics') }}</span>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink v-for="card in analyticsCards" :key="card.path" :to="card.path">
          <!-- Cool glass variant, same treatment as above just a different
               hue — these are breakdowns to read, not problems to act on. -->
          <UCard
            class="relative h-full overflow-hidden border border-white/70 bg-linear-to-br from-white/80 to-white/45 ring-1 ring-white/50 ring-inset backdrop-blur-2xl backdrop-saturate-150 transition duration-200 hover:-translate-y-0.5 hover:to-white/60"
            :style="{ boxShadow: '-4px 0 20px -4px rgba(45,114,167,0.65)' }"
          >
            <div
              class="pointer-events-none absolute inset-y-0 left-0 w-3"
              :style="{
                background: 'linear-gradient(to bottom, rgba(45,114,167,0.32), rgba(45,114,167,0.12) 50%, rgba(45,114,167,0.28))',
                maskImage: 'linear-gradient(to right, rgba(0,0,0,0.9), transparent)',
                WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.9), transparent)',
              }"
              aria-hidden="true"
            />
            <div class="flex items-start gap-2.5">
              <div class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[rgba(45,114,167,0.4)] to-[rgba(45,114,167,0.1)] ring-1 ring-[rgba(45,114,167,0.4)] backdrop-blur-sm">
                <UIcon :name="card.icon" class="size-4 text-(--color-info-toast)" />
              </div>
              <div class="pr-4">
                <h3 class="text-sm font-medium">{{ card.title }}</h3>
                <p class="mt-0.5 text-xs text-(--color-gray)">{{ card.description }}</p>
              </div>
            </div>
            <UIcon name="material-symbols:chevron-right-rounded" class="absolute right-3 bottom-3 size-4 text-(--color-gray)/50" aria-hidden="true" />
          </UCard>
        </NuxtLink>
      </div>
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'

const { t } = useI18n()

useHead({ title: t('crm.reports.pageTitle') })

const { canAccess: canViewReports, guardMounted } = usePageAccess(...MANAGER_ROLES)

// "Needs Attention" reports are all a bounded, already-filtered problem list
// (rows.length is literally "how many need a look") — Lead Source/Customer-
// Product-Status/Win-Loss are breakdowns, not counts of at-risk items, so a
// badge on them wouldn't mean the same thing and is deliberately left off.
// Derived from the shared ATTENTION_ITEMS catalog (stores/attentionCounts.ts)
// — title/description come from `crm.reports.<key>.cardTitle`/`cardDescription`,
// the key doubling as the i18n namespace segment, so this and the Dashboard's
// Risk Alerts widget can never drift out of sync on which metrics exist.
const attentionCards = computed(() => ATTENTION_ITEMS.map(item => ({
  key: item.key,
  path: item.path,
  icon: item.icon,
  title: t(`crm.reports.${item.key}.cardTitle`),
  description: t(`crm.reports.${item.key}.cardDescription`),
})))

const analyticsCards = computed(() => [
  { path: '/crm/reports/lead-source', icon: 'material-symbols:person-search-outline', title: t('crm.reports.leadSource.cardTitle'), description: t('crm.reports.leadSource.cardDescription') },
  // Marketing's own report — shown here too since Admin/Sales Manager (who
  // can reach this page) are also in PROSPECT_ROLES; Marketing itself never
  // reaches this page at all (this page is MANAGER_ROLES-only), so discovers
  // it instead via the "View Report" button on pages/crm/prospects/index.vue.
  { path: '/crm/reports/prospect-source', icon: 'material-symbols:campaign-outline', title: t('crm.reports.prospectSource.cardTitle'), description: t('crm.reports.prospectSource.cardDescription') },
  { path: '/crm/reports/customer-product-status', icon: 'material-symbols:inventory-2-outline', title: t('crm.reports.customerProductStatus.cardTitle'), description: t('crm.reports.customerProductStatus.cardDescription') },
  { path: '/crm/reports/win-loss', icon: 'material-symbols:balance-outline', title: t('crm.reports.winLoss.cardTitle'), description: t('crm.reports.winLoss.cardDescription') },
  { path: '/crm/reports/sales-cycle', icon: 'material-symbols:schedule-outline', title: t('crm.reports.salesCycle.cardTitle'), description: t('crm.reports.salesCycle.cardDescription') },
  { path: '/crm/reports/forecast-accuracy', icon: 'material-symbols:target', title: t('crm.reports.forecastAccuracy.cardTitle'), description: t('crm.reports.forecastAccuracy.cardDescription') },
])

const attentionCountsStore = useAttentionCountsStore()
const counts = computed(() => attentionCountsStore.counts)

guardMounted(() => attentionCountsStore.fetchCounts())
</script>
