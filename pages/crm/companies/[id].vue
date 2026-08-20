<template>
  <div class="p-5">
    <div v-if="company">
      <div class="mb-4 flex items-center gap-3">
        <UButton
          icon="material-symbols:arrow-back"
          variant="ghost"
          color="neutral"
          class="cursor-pointer p-0 hover:bg-transparent"
          :aria-label="t('global.back')"
          @click="goBack()"
        />
        <h2 class="text-xl font-black">{{ company.name }}</h2>
        <UBadge :color="company.status === 'active' ? 'success' : 'neutral'" variant="subtle">
          {{ company.status === 'active' ? t('crm.companies.detail.statusActive') : t('crm.companies.detail.statusArchived') }}
        </UBadge>
        <UBadge v-for="tag in company.tags" :key="tag" color="neutral" variant="outline">{{ tag }}</UBadge>
      </div>

      <UTabs :model-value="activeTab" :items="tabItems" class="mb-4" @update:model-value="onTabChange" />

      <NuxtPage />
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.companies.detail.companyNotFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { isTaskOverdue } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.companies.detail.pageTitle') })

const route = useRoute()
const { notifyApiError } = useApiErrorNotifier()
const companiesStore = useCompaniesStore()
const tasksStore = useTasksStore()

const { companyId, company } = useCurrentCompany()
const goBack = useBackNavigation('/crm/companies')

onMounted(() => {
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
})

// Tab navigation is route-driven: "overview" lives at the base
// `/crm/companies/:id` route (pages/crm/companies/[id]/index.vue), the rest
// are their own child routes rendered into <NuxtPage /> above — this file
// only owns the header + tab bar that persist across all of them. Mirrors
// pages/crm/deals/[id].vue's identical pattern.
const activeTab = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  return last === String(companyId) ? 'overview' : last
})

const onTabChange = (value: string | number) => {
  navigateTo(value === 'overview' ? `/crm/companies/${companyId}` : `/crm/companies/${companyId}/${value}`)
}

// Reads tasksStore directly (not via useTaskList) since this shell only
// needs the overdue count for the tab badge, not the full add/toggle/remove
// action set — same split Deals' [id].vue uses for its own Tasks tab badge.
const companyOverdueTaskCount = computed(() => tasksStore.forRelated('company', companyId).filter(task => isTaskOverdue(task)).length)
const tabItems = computed(() => [
  { label: t('crm.companies.detail.tabs.overview'), value: 'overview' },
  { label: t('crm.companies.detail.tabs.contacts'), value: 'contacts' },
  { label: t('crm.companies.detail.tabs.deals'), value: 'deals' },
  { label: t('crm.companies.detail.tabs.products'), value: 'products' },
  { label: t('crm.companies.detail.tabs.projects'), value: 'projects' },
  { label: t('crm.companies.detail.tabs.activity'), value: 'activity' },
  { label: companyOverdueTaskCount.value > 0 ? `${t('crm.companies.detail.tabs.tasks')} (${companyOverdueTaskCount.value})` : t('crm.companies.detail.tabs.tasks'), value: 'tasks' },
  { label: t('crm.companies.detail.tabs.attachments'), value: 'attachments' },
])
</script>
