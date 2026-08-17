<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('crm.deals.index.heading') }}</h2>
      <div class="flex items-center gap-2">
        <ButtonPrimary
          :outline="viewMode !== 'kanban'"
          small
          fit-content
          icon="material-symbols:view-kanban-outline"
          :label="t('crm.deals.index.viewKanban')"
          @click="viewMode = 'kanban'"
        />
        <ButtonPrimary
          :outline="viewMode !== 'list'"
          small
          fit-content
          icon="material-symbols:view-list"
          :label="t('crm.deals.index.viewList')"
          @click="viewMode = 'list'"
        />
        <ButtonPrimary
          :label="t('crm.deals.index.addDeal')"
          icon="material-symbols:add"
          @click="navigateTo('/crm/deals/create')"
        />
      </div>
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div class="flex-1 sm:min-w-48">
          <InputText v-model="search" :placeholder="t('crm.deals.index.searchPlaceholder')" name="search" />
        </div>
        <div class="w-full sm:w-56">
          <InputSelect v-model="assigneeFilter" :options="teamMembersStore.filterOptions" :placeholder="t('crm.deals.index.assigneePlaceholder')" name="assigneeFilter" />
        </div>
        <div class="w-full sm:w-40">
          <InputSelect v-model="businessUnitFilter" :options="BUSINESS_UNIT_FILTER_OPTIONS" :placeholder="t('crm.dashboard.filterBusinessUnit')" name="businessUnitFilter" />
        </div>
        <div class="w-full sm:w-36">
          <InputSelect v-model="channelFilter" :options="CHANNEL_FILTER_OPTIONS" :placeholder="t('crm.dashboard.filterChannel')" name="channelFilter" />
        </div>
      </div>
    </UCard>

    <CrmPipelineBoard
      v-if="viewMode === 'kanban'"
      :columns="DEAL_STAGE_OPTIONS"
      :items="pipelineItems"
      @move="onMove"
      @select="onSelect"
    >
      <template #card="{ item }">
        <template v-if="item._type === 'deal'">
          <div>
            <p class="line-clamp-2 text-sm font-medium">{{ item.title }}</p>
            <p class="mt-1 truncate text-xs text-[var(--color-gray)]">{{ companiesStore.nameById(item.company_id) }}</p>
          </div>
          <p class="mt-2 text-sm font-medium text-[var(--color-primary)]">
            {{ priceFormat(item.value) }} {{ t('crm.dashboard.currencyUnit') }}
          </p>
          <div class="mt-2 flex items-center gap-1.5 border-t border-[var(--color-light-gray-2)] pt-2">
            <UIcon name="material-symbols:person" class="size-3.5 shrink-0 text-[var(--color-gray)]" />
            <p class="truncate text-xs text-[var(--color-gray)]">{{ teamMembersStore.nameById(item.assigned_to) }}</p>
          </div>
        </template>
        <template v-else>
          <div>
            <div class="flex items-center gap-1.5">
              <p class="line-clamp-2 text-sm font-medium">{{ item.name }}</p>
              <UBadge size="xs" color="neutral" variant="subtle">
                {{ item.status === 'Disqualified' ? t('crm.deals.index.disqualifiedLeadBadge') : item.status }}
              </UBadge>
            </div>
            <p class="mt-1 truncate text-xs text-[var(--color-gray)]">{{ item.company_name }}</p>
          </div>
          <div class="mt-2 flex items-center gap-1.5 border-t border-[var(--color-light-gray-2)] pt-2">
            <UIcon name="material-symbols:person" class="size-3.5 shrink-0 text-[var(--color-gray)]" />
            <p class="truncate text-xs text-[var(--color-gray)]">{{ teamMembersStore.nameById(item.assigned_to) }}</p>
          </div>
        </template>
      </template>
    </CrmPipelineBoard>

    <CrmDealsTable v-else :rows="filteredDeals" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  DEAL_STAGE_OPTIONS,
  BUSINESS_UNIT_FILTER_OPTIONS,
  CHANNEL_FILTER_OPTIONS,
  matchesAssigneeFilter,
} from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.deals.index.pageTitle') })

const { priceFormat } = useFormatter()
const { success, error } = useNotify()
const companiesStore = useCompaniesStore()
const dealsStore = useDealsStore()
const leadsStore = useLeadsStore()
const teamMembersStore = useTeamMembersStore()

onMounted(() => {
  dealsStore.fetchAll()
  leadsStore.fetchAll({ exclude_converted: true })
  if (companiesStore.items.length === 0) companiesStore.fetchAll()
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll()
})

const viewMode = ref<'kanban' | 'list'>('kanban')

const search = ref('')
const assigneeFilter = ref('all')
const businessUnitFilter = ref('all')
const channelFilter = ref('all')

const filteredDeals = computed(() => {
  return dealsStore.items.filter((deal) => {
    const matchSearch = !search.value
      || deal.title.toLowerCase().includes(search.value.toLowerCase())
      || companiesStore.nameById(deal.company_id).toLowerCase().includes(search.value.toLowerCase())
    const matchAssignee = matchesAssigneeFilter(deal.assigned_to, assigneeFilter.value)
    if (businessUnitFilter.value !== 'all' && deal.business_unit !== businessUnitFilter.value) return false
    const matchChannel = channelFilter.value === 'all' || deal.channel === channelFilter.value
    return matchSearch && matchAssignee && matchChannel
  })
})

// Leads have no business_unit/channel, so only search and assignee apply here.
const filteredLeads = computed(() => {
  return leadsStore.items.filter((lead) => {
    const matchSearch = !search.value
      || lead.name.toLowerCase().includes(search.value.toLowerCase())
      || lead.company_name.toLowerCase().includes(search.value.toLowerCase())
    const matchAssignee = matchesAssigneeFilter(lead.assigned_to, assigneeFilter.value)
    return matchSearch && matchAssignee
  })
})

// A Lead has no `stage` — this maps its status onto the board's DealStage lanes:
// New/Contacted share the "Lead" column, Qualified gets its own column, and
// Disqualified lands in "Lost" alongside real lost Deals (see the card badge).
const leadLane = (lead: Lead): string => {
  if (lead.status === 'Disqualified') return 'Lost'
  if (lead.status === 'Qualified') return 'Qualified'
  return 'Lead'
}

// Status a Lead should take when dropped directly on one of its own lanes.
// Dropping past "Qualified" (Proposal Sent/Negotiation/Won) instead triggers
// a real conversion — see the `else` branch of onMove below.
const LEAD_STATUS_FOR_LANE: Record<string, LeadStatus> = {
  Lead: 'New',
  Qualified: 'Qualified',
  Lost: 'Disqualified',
}

const pipelineItems = computed(() => [
  ...filteredDeals.value.map(deal => ({ ...deal, _type: 'deal' as const, _lane: deal.stage })),
  ...filteredLeads.value.map(lead => ({ ...lead, _type: 'lead' as const, _lane: leadLane(lead) })),
])

const onMove = async (item: (Deal & { _type: 'deal' }) | (Lead & { _type: 'lead' }), newStage: string) => {
  if (item._type === 'deal') {
    const deal = dealsStore.items.find(d => d.id === item.id)
    if (deal && deal.stage !== newStage) {
      const previousStage = deal.stage
      try {
        await dealsStore.updateStage(deal.id, newStage as DealStage)
        success(t('crm.deals.index.dealMovedTo', { stage: newStage }))
      } catch (err) {
        deal.stage = previousStage
        error(getApiErrorMessage(err, t('global.genericError')))
      }
    }
    return
  }

  const lead = leadsStore.items.find(l => l.id === item.id)
  if (!lead) return

  const newStatus = LEAD_STATUS_FOR_LANE[newStage]
  if (newStatus) {
    if (lead.status === newStatus) return
    try {
      await leadsStore.update(lead.id, { status: newStatus })
      success(t('crm.deals.index.leadStatusUpdated', { status: newStatus }))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
    return
  }

  try {
    const { deal } = await leadsStore.convert(lead.id, {
      deal: { title: lead.name, value: 0, stage: newStage as DealStage },
    })
    const index = leadsStore.items.findIndex(l => l.id === lead.id)
    if (index !== -1) leadsStore.items.splice(index, 1)
    dealsStore.receiveConverted(deal)
    success(t('crm.deals.index.leadConvertedToDeal'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onSelect = (item: (Deal & { _type: 'deal' }) | (Lead & { _type: 'lead' })) => {
  navigateTo(item._type === 'deal' ? `/crm/deals/${item.id}` : `/crm/leads/${item.id}`)
}
</script>
