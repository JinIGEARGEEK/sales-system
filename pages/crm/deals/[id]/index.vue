<template>
  <div v-if="deal" class="grid grid-cols-1 gap-4 lg:grid-cols-5">
    <div class="lg:col-span-3">
      <ContainerTemplate>
        <Form @submit="onSave">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InputText v-model="form.title" :label="t('crm.deals.detail.dealTitle')" name="title" rules="required" />
            <InputText v-model.number="form.value" :label="t('crm.deals.detail.dealValue')" type="number" name="value" rules="required" />
            <InputSelect v-model="form.stage" :options="pipelineStagesStore.activeOptions" :label="t('crm.deals.detail.stage')" name="stage" rules="required" />
            <InputText
              v-model.number="form.probability"
              type="number"
              min="0"
              max="100"
              :label="t('crm.deals.detail.probability')"
              name="probability"
              rules="required|min_value:0|max_value:100"
            />
            <InputDatePicker v-model="form.expected_close_date" :label="t('crm.deals.detail.expectedCloseDate')" name="expected_close_date" />
            <CrmTeamMemberSelect v-model="form.assigned_to" name="assigned_to" />
            <InputSelect
              v-model="form.business_unit"
              :options="BUSINESS_UNIT_OPTIONS"
              :label="t('crm.deals.detail.businessUnit')"
              :placeholder="t('crm.deals.detail.businessUnitPlaceholder')"
              name="business_unit"
            />
            <InputSelect
              v-if="form.business_unit"
              v-model="form.business_unit_item"
              :options="businessUnitItemOptions"
              :label="form.business_unit === 'Project' ? t('crm.deals.detail.project') : t('crm.deals.detail.product')"
              :placeholder="t('crm.deals.detail.businessUnitItemPlaceholder')"
              name="business_unit_item"
            />
            <InputSelect
              v-if="isLostStage(form.stage)"
              v-model="form.lost_reason"
              :options="LOST_REASON_OPTIONS"
              :label="t('crm.deals.detail.lostReason')"
              :placeholder="t('crm.deals.detail.lostReasonPlaceholder')"
              name="lost_reason"
              rules="required"
            />
          </div>
          <div class="mt-4 flex gap-3">
            <ButtonPrimary :label="t('crm.deals.detail.saveChanges')" type="submit" />
          </div>
        </Form>
      </ContainerTemplate>
    </div>

    <div class="lg:col-span-2">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold">{{ t('crm.deals.detail.linkedRecords') }}</h3>
        </template>
        <div class="flex flex-col gap-3 text-sm">
          <NuxtLink :to="`/crm/companies/${deal.company_id}`" class="flex justify-between hover:underline">
            <span class="text-[var(--color-gray)]">{{ t('crm.deals.detail.company') }}</span><span>{{ companyName }}</span>
          </NuxtLink>
          <NuxtLink :to="`/crm/contacts/${deal.contact_id}`" class="flex justify-between hover:underline">
            <span class="text-[var(--color-gray)]">{{ t('crm.deals.detail.contact') }}</span><span>{{ contactName }}</span>
          </NuxtLink>
          <NuxtLink v-if="linkedProject" :to="`/crm/companies/${deal.company_id}`" class="flex justify-between hover:underline">
            <span class="text-[var(--color-gray)]">{{ t('crm.deals.detail.project') }}</span><span>{{ linkedProject.name }}</span>
          </NuxtLink>
          <div v-else class="flex justify-between">
            <span class="text-[var(--color-gray)]">{{ t('crm.deals.detail.project') }}</span>
            <span class="text-[var(--color-gray)]">{{ deal.status === 'won' ? t('crm.deals.detail.projectNotCreatedYet') : '-' }}</span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { BUSINESS_UNIT_OPTIONS, LOST_REASON_OPTIONS, dealStatusForStage, stageDefaultProbability } from '~/constants/mockData'

const { t } = useI18n()

const { success, error } = useNotify()
const dealsStore = useDealsStore()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()
const projectsStore = useProjectsStore()
const productsStore = useProductsStore()
const pipelineStagesStore = usePipelineStagesStore()

// Prefers the configured PipelineStage row's is_lost_stage flag (so a custom,
// admin-renamed Lost stage still shows/requires lost_reason), falling back to
// the literal "Lost" name if the store hasn't loaded that row yet — same
// resolution useDealStageColor.stageBadgeColor uses.
const isLostStage = (stage: string) => pipelineStagesStore.byName(stage)?.is_lost_stage ?? stage === 'Lost'

const { dealId, deal } = useCurrentDeal()
const linkedProject = computed(() => projectsStore.forDeal(dealId))

onMounted(() => {
  if (companiesStore.items.length === 0) companiesStore.fetchAll()
  if (contactsStore.items.length === 0) contactsStore.fetchAll()
  if (productsStore.items.length === 0) productsStore.fetchAll()
  if (pipelineStagesStore.items.length === 0) pipelineStagesStore.fetchAll()
})

// Deal loads asynchronously (dealsStore.fetchAll, in the parent [id].vue), so
// company_id isn't known yet at onMounted — fetch this company's projects once
// the deal resolves.
watch(deal, (value) => {
  if (value) projectsStore.fetchForCompany(value.company_id)
}, { immediate: true })

const companyName = computed(() => deal.value ? companiesStore.nameById(deal.value.company_id) : '-')
const contactName = computed(() => deal.value ? contactsStore.items.find(c => c.id === deal.value!.contact_id)?.name || '-' : '-')

const { createWonFollowUpTask } = useWonFollowUpTask(dealId, deal)

const form = reactive({
  title: deal.value?.title || '',
  value: deal.value?.value || 0,
  stage: deal.value?.stage || 'Lead',
  probability: deal.value?.probability ?? stageDefaultProbability(deal.value?.stage || 'Lead'),
  lost_reason: deal.value?.lost_reason || '',
  expected_close_date: deal.value?.expected_close_date ? deal.value.expected_close_date.toISOString().slice(0, 10) : '',
  assigned_to: deal.value?.assigned_to ? String(deal.value.assigned_to) : '',
  business_unit: (deal.value?.business_unit || '') as BusinessUnit | '',
  business_unit_item: deal.value?.business_unit_item || '',
})

// Deal loads asynchronously now (fetched on mount), so the form is (re)populated
// once the record arrives instead of only at setup time. `hydrating` suppresses
// the business_unit/stage watchers below during this — otherwise setting
// business_unit/stage here would immediately wipe/re-default fields set a
// couple lines later.
let hydrating = false
watch(deal, (value) => {
  if (!value) return
  hydrating = true
  form.title = value.title
  form.value = value.value
  form.stage = value.stage
  form.probability = value.probability ?? stageDefaultProbability(value.stage)
  form.lost_reason = value.lost_reason || ''
  form.expected_close_date = value.expected_close_date ? value.expected_close_date.toISOString().slice(0, 10) : ''
  form.assigned_to = value.assigned_to ? String(value.assigned_to) : ''
  form.business_unit = value.business_unit || ''
  form.business_unit_item = value.business_unit_item || ''
  nextTick(() => { hydrating = false })
}, { immediate: true })

const businessUnitItemOptions = useBusinessUnitItemOptions(
  toRef(form, 'business_unit'),
  computed(() => deal.value?.company_id ?? null),
)

// Switching business unit invalidates whichever item was picked under the old
// one — but not during the hydration above, which sets both at once.
watch(() => form.business_unit, () => {
  if (!hydrating) form.business_unit_item = ''
})

// Re-derives probability's default whenever stage changes manually (not during
// hydration) — still freely editable afterwards. lost_reason only makes sense
// while Lost, so it's cleared once the stage moves elsewhere.
watch(() => form.stage, (newStage) => {
  if (hydrating) return
  form.probability = stageDefaultProbability(newStage)
  if (!isLostStage(newStage)) form.lost_reason = ''
})

const onSave = async () => {
  if (!deal.value) return
  const wasWon = deal.value.status === 'won'
  try {
    const updated = await dealsStore.update(deal.value.id, {
      title: form.title,
      value: form.value,
      stage: form.stage as DealStage,
      status: dealStatusForStage(form.stage as DealStage),
      probability: form.probability,
      lost_reason: isLostStage(form.stage) ? (form.lost_reason as LostReason || null) : null,
      expected_close_date: form.expected_close_date ? new Date(form.expected_close_date) : null,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      business_unit: form.business_unit || null,
      business_unit_item: form.business_unit_item || null,
    })
    if (!wasWon && updated.status === 'won') createWonFollowUpTask()
    success(t('crm.deals.detail.updateSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
