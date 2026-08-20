<template>
  <div class="p-5">
    <div v-if="deal">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UButton
            icon="material-symbols:arrow-back"
            variant="ghost"
            color="neutral"
            class="cursor-pointer p-0 hover:bg-transparent"
            :aria-label="t('global.back')"
            @click="goBack()"
          />
          <h2 class="text-xl font-black">{{ deal.title }}</h2>
          <UBadge :color="stageBadgeColor" variant="subtle">{{ deal.stage }}</UBadge>
        </div>
        <ButtonPrimary
          v-if="deal.status === 'open'"
          :label="t('crm.deals.detail.markWon')"
          icon="material-symbols:check-circle-outline"
          @click="onMarkWon"
        />
      </div>

      <UTabs :model-value="activeTab" :items="tabItems" class="mb-4" @update:model-value="onTabChange" />

      <NuxtPage />
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.deals.detail.dealNotFound') }}
    </div>

    <CrmAddProjectModal
      v-model:open="wonModal"
      :title="t('crm.deals.detail.createProjectModalTitle')"
      :default-name="deal?.title"
      :description="t('crm.deals.detail.createProjectModalBody')"
      @submit="onCreateProject"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { isTaskOverdue } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.deals.detail.pageTitle') })

const route = useRoute()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const dealsStore = useDealsStore()
const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()
const pipelineStagesStore = usePipelineStagesStore()

const { dealId, deal } = useCurrentDeal()
const goBack = useBackNavigation('/crm/deals')

onMounted(() => {
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyApiError)
  if (pipelineStagesStore.items.length === 0) pipelineStagesStore.fetchAll().catch(notifyApiError)
})

// Tab navigation is route-driven: "overview" lives at the base `/crm/deals/:id`
// route (pages/crm/deals/[id]/index.vue), the rest are their own child routes
// rendered into <NuxtPage /> above — this file only owns the header + tab bar
// that persist across all of them.
const activeTab = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  return last === String(dealId) ? 'overview' : last
})

const onTabChange = (value: string | number) => {
  navigateTo(value === 'overview' ? `/crm/deals/${dealId}` : `/crm/deals/${dealId}/${value}`)
}

const dealTasks = computed(() => tasksStore.forRelated('deal', dealId))
const dealOverdueTaskCount = computed(() => dealTasks.value.filter(task => isTaskOverdue(task)).length)
const tabItems = computed(() => [
  { label: t('crm.deals.detail.tabs.overview'), value: 'overview' },
  { label: t('crm.deals.detail.tabs.quotes'), value: 'quotes' },
  { label: t('crm.deals.detail.tabs.contracts'), value: 'contracts' },
  { label: t('crm.deals.detail.tabs.payments'), value: 'payments' },
  { label: dealOverdueTaskCount.value > 0 ? `${t('crm.deals.detail.tabs.tasks')} (${dealOverdueTaskCount.value})` : t('crm.deals.detail.tabs.tasks'), value: 'tasks' },
  { label: t('crm.deals.detail.tabs.activity'), value: 'activity' },
  { label: t('crm.deals.detail.tabs.attachments'), value: 'attachments' },
])

const { stageBadgeColor: stageColorFor } = useDealStageColor()
const stageBadgeColor = computed(() => deal.value ? stageColorFor(deal.value.stage) : 'neutral')

const wonModal = ref(false)
const { createWonFollowUpTask } = useWonFollowUpTask(dealId, deal)

const onMarkWon = async () => {
  if (!deal.value) return
  const wasWon = deal.value.status === 'won'
  try {
    await dealsStore.updateStage(deal.value.id, pipelineStagesStore.wonStageName as DealStage)
    if (!wasWon) createWonFollowUpTask()
    success(t('crm.deals.detail.markWonSuccess'))
    wonModal.value = true
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onCreateProject = async (payload: { name: string, status: ProjectStatus, production_reference: string | null, target_end_date: Date | null, notes: string }) => {
  if (!deal.value) return
  try {
    await projectsStore.add(deal.value.company_id, {
      deal_id: deal.value.id,
      start_date: new Date(),
      ...payload,
    })
    success(t('crm.deals.detail.createProjectSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
