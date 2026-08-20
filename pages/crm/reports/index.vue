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

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NuxtLink v-for="card in reportCards" :key="card.path" :to="card.path">
        <UCard class="h-full ring-[var(--color-card-border)] transition hover:bg-[var(--color-light-gray-1)]">
          <div class="flex items-start gap-3">
            <UIcon :name="card.icon" class="mt-1 size-6 shrink-0 text-[var(--color-primary)]" />
            <div>
              <h3 class="text-lg font-medium">{{ card.title }}</h3>
              <p class="mt-1 text-sm text-[var(--color-gray)]">{{ card.description }}</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

useHead({ title: t('crm.reports.pageTitle') })

const { hasRole } = useRole()
const canViewReports = computed(() => hasRole('Admin', 'Sales Manager'))

const reportCards = computed(() => [
  { path: '/crm/reports/lead-source', icon: 'material-symbols:person-search-outline', title: t('crm.reports.leadSource.cardTitle'), description: t('crm.reports.leadSource.cardDescription') },
  { path: '/crm/reports/customer-product-status', icon: 'material-symbols:inventory-2-outline', title: t('crm.reports.customerProductStatus.cardTitle'), description: t('crm.reports.customerProductStatus.cardDescription') },
  { path: '/crm/reports/win-loss', icon: 'material-symbols:balance-outline', title: t('crm.reports.winLoss.cardTitle'), description: t('crm.reports.winLoss.cardDescription') },
  { path: '/crm/reports/stalled-deals', icon: 'material-symbols:hourglass-empty', title: t('crm.reports.stalledDeals.cardTitle'), description: t('crm.reports.stalledDeals.cardDescription') },
  { path: '/crm/reports/outstanding-balance', icon: 'material-symbols:request-quote-outline', title: t('crm.reports.outstandingBalance.cardTitle'), description: t('crm.reports.outstandingBalance.cardDescription') },
  { path: '/crm/reports/quotes-expiring-soon', icon: 'material-symbols:schedule-outline', title: t('crm.reports.quotesExpiringSoon.cardTitle'), description: t('crm.reports.quotesExpiringSoon.cardDescription') },
  { path: '/crm/reports/contracts-stuck', icon: 'material-symbols:draft-outline', title: t('crm.reports.contractsStuck.cardTitle'), description: t('crm.reports.contractsStuck.cardDescription') },
  { path: '/crm/reports/projects-at-risk', icon: 'material-symbols:engineering-outline', title: t('crm.reports.projectsAtRisk.cardTitle'), description: t('crm.reports.projectsAtRisk.cardDescription') },
])
</script>
