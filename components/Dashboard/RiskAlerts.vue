<template>
  <div class="mb-8">
    <h3 class="mb-3 border-b border-(--color-light-gray-2) pb-2 text-sm font-semibold text-(--color-black)">
      {{ t('crm.dashboard.sectionRiskAlerts') }}
    </h3>

    <UCard :ui="{ body: 'p-0 divide-y divide-[var(--color-light-gray-2)]' }">
      <NuxtLink
        v-for="item in items"
        :key="item.key"
        :to="item.path"
        class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-(--color-light-gray-1)"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-warning-hover)/15">
            <UIcon :name="item.icon" class="size-4 text-(--color-warning-hover)" />
          </div>
          <span class="truncate text-sm font-medium">{{ item.title }}</span>
        </div>
        <USkeleton v-if="counts[item.key] === null" class="h-5 w-6 shrink-0 rounded-full" />
        <UBadge
          v-else
          class="shrink-0 font-semibold"
          :color="badgeColor(counts[item.key])"
          :variant="counts[item.key] ? 'solid' : 'subtle'"
          size="sm"
        >
          {{ counts[item.key] }}
        </UBadge>
      </NuxtLink>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  counts: Record<string, number | null>
}>()

// Same 5 metrics as pages/crm/reports/index.vue's own "Needs Attention"
// section, just condensed into single rows for the Dashboard — labels reuse
// the Reports page's own i18n strings so the two never drift apart.
const items = [
  { key: 'stalledDeals', path: '/crm/reports/stalled-deals', icon: 'material-symbols:hourglass-empty', title: t('crm.reports.stalledDeals.cardTitle') },
  { key: 'outstandingBalance', path: '/crm/reports/outstanding-balance', icon: 'material-symbols:request-quote-outline', title: t('crm.reports.outstandingBalance.cardTitle') },
  { key: 'quotesExpiringSoon', path: '/crm/reports/quotes-expiring-soon', icon: 'material-symbols:schedule-outline', title: t('crm.reports.quotesExpiringSoon.cardTitle') },
  { key: 'contractsStuck', path: '/crm/reports/contracts-stuck', icon: 'material-symbols:draft-outline', title: t('crm.reports.contractsStuck.cardTitle') },
  { key: 'projectsAtRisk', path: '/crm/reports/projects-at-risk', icon: 'material-symbols:engineering-outline', title: t('crm.reports.projectsAtRisk.cardTitle') },
]
</script>
