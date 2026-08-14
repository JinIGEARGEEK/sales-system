<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('crm.deals.index.heading') }}</h2>
      <ButtonPrimary
        :label="t('crm.deals.index.addDeal')"
        icon="material-symbols:add"
        @click="navigateTo('/crm/deals/create')"
      />
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div class="flex-1 sm:min-w-48">
          <InputText v-model="search" :placeholder="t('crm.deals.index.searchPlaceholder')" name="search" />
        </div>
        <div class="w-full sm:w-56">
          <InputSelect v-model="assigneeFilter" :options="TEAM_MEMBER_FILTER_OPTIONS" :placeholder="t('crm.deals.index.assigneePlaceholder')" name="assigneeFilter" />
        </div>
        <div class="w-full sm:w-40">
          <InputSelect v-model="businessUnitFilter" :options="BUSINESS_UNIT_FILTER_OPTIONS" :placeholder="t('crm.dashboard.filterBusinessUnit')" name="businessUnitFilter" />
        </div>
        <div v-if="businessUnitFilter === 'Project'" class="w-full sm:w-40">
          <InputSelect v-model="projectFilter" :options="PROJECT_FILTER_OPTIONS" :placeholder="t('crm.dashboard.filterProject')" name="projectFilter" />
        </div>
        <div v-if="businessUnitFilter === 'Product'" class="w-full sm:w-40">
          <InputSelect v-model="productFilter" :options="PRODUCT_FILTER_OPTIONS" :placeholder="t('crm.dashboard.filterProduct')" name="productFilter" />
        </div>
        <div class="w-full sm:w-36">
          <InputSelect v-model="channelFilter" :options="CHANNEL_FILTER_OPTIONS" :placeholder="t('crm.dashboard.filterChannel')" name="channelFilter" />
        </div>
      </div>
    </UCard>

    <CrmPipelineBoard
      :columns="DEAL_STAGE_OPTIONS"
      :items="filteredDeals"
      @move="onMove"
      @select="onSelect"
    >
      <template #card="{ item }">
        <div>
          <p class="line-clamp-2 text-sm font-medium">{{ item.title }}</p>
          <p class="mt-1 truncate text-xs text-[var(--color-gray)]">{{ companiesStore.nameById(item.company_id) }}</p>
        </div>
        <div class="mt-2 flex items-center justify-between">
          <p class="text-sm font-medium text-[var(--color-primary)]">{{ priceFormat(item.value) }}</p>
          <p class="truncate text-xs text-[var(--color-gray)]">{{ teamMemberNameById(item.assigned_to) }}</p>
        </div>
      </template>
    </CrmPipelineBoard>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  DEAL_STAGE_OPTIONS,
  TEAM_MEMBER_FILTER_OPTIONS,
  BUSINESS_UNIT_FILTER_OPTIONS,
  PROJECT_FILTER_OPTIONS,
  PRODUCT_FILTER_OPTIONS,
  CHANNEL_FILTER_OPTIONS,
  teamMemberNameById,
  matchesAssigneeFilter,
  dealStatusForStage,
} from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.deals.index.pageTitle') })

const { priceFormat } = useFormatter()
const { success } = useNotify()
const companiesStore = useCompaniesStore()
const dealsStore = useDealsStore()

const search = ref('')
const assigneeFilter = ref('all')
const businessUnitFilter = ref('all')
const projectFilter = ref('all')
const productFilter = ref('all')
const channelFilter = ref('all')

const filteredDeals = computed(() => {
  return dealsStore.items.filter((deal) => {
    const matchSearch = !search.value
      || deal.title.toLowerCase().includes(search.value.toLowerCase())
      || companiesStore.nameById(deal.company_id).toLowerCase().includes(search.value.toLowerCase())
    const matchAssignee = matchesAssigneeFilter(deal.assigned_to, assigneeFilter.value)
    if (businessUnitFilter.value !== 'all' && deal.business_unit !== businessUnitFilter.value) return false
    if (businessUnitFilter.value === 'Project' && projectFilter.value !== 'all' && deal.business_unit_item !== projectFilter.value) return false
    if (businessUnitFilter.value === 'Product' && productFilter.value !== 'all' && deal.business_unit_item !== productFilter.value) return false
    const matchChannel = channelFilter.value === 'all' || deal.channel === channelFilter.value
    return matchSearch && matchAssignee && matchChannel
  })
})

const onMove = (item: Deal, newStage: string) => {
  const deal = dealsStore.items.find(d => d.id === item.id)
  if (deal && deal.stage !== newStage) {
    deal.stage = newStage as DealStage
    deal.status = dealStatusForStage(deal.stage)
    success(t('crm.deals.index.dealMovedTo', { stage: newStage }))
  }
}

const onSelect = (item: Deal) => {
  navigateTo(`/crm/deals/${item.id}`)
}
</script>
