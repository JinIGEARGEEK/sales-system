<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('crm.reports.heading') }}</h2>
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
      <NuxtLink to="/crm/reports/lead-source">
        <UCard class="h-full ring-[var(--color-card-border)] transition hover:bg-[var(--color-light-gray-1)]">
          <div class="flex items-start gap-3">
            <UIcon name="material-symbols:person-search-outline" class="mt-1 size-6 shrink-0 text-[var(--color-primary)]" />
            <div>
              <h3 class="text-lg font-medium">{{ t('crm.reports.leadSource.cardTitle') }}</h3>
              <p class="mt-1 text-sm text-[var(--color-gray)]">{{ t('crm.reports.leadSource.cardDescription') }}</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink to="/crm/reports/customer-product-status">
        <UCard class="h-full ring-[var(--color-card-border)] transition hover:bg-[var(--color-light-gray-1)]">
          <div class="flex items-start gap-3">
            <UIcon name="material-symbols:inventory-2-outline" class="mt-1 size-6 shrink-0 text-[var(--color-primary)]" />
            <div>
              <h3 class="text-lg font-medium">{{ t('crm.reports.customerProductStatus.cardTitle') }}</h3>
              <p class="mt-1 text-sm text-[var(--color-gray)]">{{ t('crm.reports.customerProductStatus.cardDescription') }}</p>
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
</script>
