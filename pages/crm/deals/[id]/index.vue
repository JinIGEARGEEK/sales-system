<template>
  <div v-if="deal" class="grid grid-cols-1 gap-4 lg:grid-cols-5">
    <div class="lg:col-span-3">
      <ContainerTemplate>
        <UAlert
          v-if="showContractGateWarning"
          class="mb-4"
          color="warning"
          variant="subtle"
          icon="material-symbols:warning-outline"
          :title="t('crm.deals.detail.contractRequiredWarning')"
        />
        <Form @submit="onSave">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InputText v-model="form.title" :label="t('crm.deals.detail.dealTitle')" name="title" rules="required" />
            <InputText v-model.number="form.value" :label="t('crm.deals.detail.dealValue')" type="number" name="value" rules="required" />
            <InputSelect v-model="form.stage" :options="pipelineStagesStore.activeOptions" :label="t('crm.deals.detail.stage')" name="stage" rules="required" />
            <div>
              <InputText
                v-model.number="form.probability"
                type="number"
                min="0"
                max="100"
                :label="t('crm.deals.detail.probability')"
                name="probability"
                rules="required|min_value:0|max_value:100"
              />
              <UProgress class="mt-1" :model-value="form.probability" :color="probabilityColor" size="sm" />
            </div>
            <div>
              <InputSelect v-model="form.forecast_category" :options="FORECAST_CATEGORY_OPTIONS" :label="t('crm.deals.detail.forecastCategory')" name="forecast_category" />
              <UBadge v-if="form.forecast_category" class="mt-1" :color="forecastCategoryColor(form.forecast_category)" variant="subtle">{{ form.forecast_category }}</UBadge>
            </div>
            <InputDatePicker v-model="form.expected_close_date" :label="t('crm.deals.detail.expectedCloseDate')" name="expected_close_date" />
            <CrmTeamMemberSelect v-model="form.assigned_to" name="assigned_to" />
            <div class="grid grid-cols-1 gap-3 rounded-lg border border-sky-300 bg-sky-50 p-3 md:col-span-2 md:grid-cols-2">
              <InputSelect
                v-model="form.business_unit"
                :options="BUSINESS_UNIT_OPTIONS"
                :label="t('crm.deals.detail.businessUnit')"
                :placeholder="t('crm.deals.detail.businessUnitPlaceholder')"
                name="business_unit"
              />
              <CrmBusinessUnitItemField
                v-if="form.business_unit"
                v-model="form.business_unit_item"
                :business-unit="form.business_unit"
                :company-id="deal?.company_id ?? null"
                :options="businessUnitItemOptions"
              />
            </div>
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
            <ButtonPrimary :label="t('crm.deals.detail.saveChanges')" type="submit" :loading="loading" />
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
            <span class="text-(--color-gray)">{{ t('crm.deals.detail.company') }}</span><span>{{ companyName }}</span>
          </NuxtLink>
          <NuxtLink :to="`/crm/contacts/${deal.contact_id}`" class="flex justify-between hover:underline">
            <span class="text-(--color-gray)">{{ t('crm.deals.detail.contact') }}</span><span>{{ contactName }}</span>
          </NuxtLink>
          <NuxtLink v-if="linkedProject" :to="`/crm/companies/${deal.company_id}`" class="flex justify-between hover:underline">
            <span class="text-(--color-gray)">{{ t('crm.deals.detail.project') }}</span><span>{{ linkedProject.name }}</span>
          </NuxtLink>
          <div v-else class="flex justify-between">
            <span class="text-(--color-gray)">{{ t('crm.deals.detail.project') }}</span>
            <span class="text-(--color-gray)">{{ deal.status === 'won' ? t('crm.deals.detail.projectNotCreatedYet') : '-' }}</span>
          </div>
        </div>
      </UCard>

      <UCard v-if="canViewOwnerHistory" class="mt-4">
        <template #header>
          <h3 class="text-base font-semibold">{{ t('crm.deals.detail.ownerHistory') }}</h3>
        </template>
        <div v-if="ownerHistory.length === 0" class="py-6 text-center text-sm text-(--color-gray)">
          {{ t('crm.deals.detail.noOwnerHistory') }}
        </div>
        <div v-else class="flex flex-col gap-4">
          <div v-for="entry in ownerHistory" :key="entry.id" class="flex gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-primary-bg)">
              <UIcon name="material-symbols:swap-horiz" class="size-4 text-(--color-primary)" />
            </div>
            <div class="min-w-0 flex-1 border-b border-(--color-light-gray-2) pb-3 last:border-none">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-medium">
                  {{ entry.before?.assigned_to
                    ? t('crm.deals.detail.ownerHistoryReassigned', {
                      from: teamMembersStore.nameById(entry.before.assigned_to as number ?? null),
                      to: teamMembersStore.nameById(entry.after?.assigned_to as number ?? null),
                    })
                    : t('crm.deals.detail.ownerHistoryAssigned', { to: teamMembersStore.nameById(entry.after?.assigned_to as number ?? null) }) }}
                </p>
                <span class="shrink-0 text-xs text-(--color-gray)">{{ dateTimeFormat(entry.created_at.toISOString()) }}</span>
              </div>
              <p class="mt-1 text-xs text-(--color-gray)">{{ t('crm.deals.detail.ownerHistoryBy', { actor: actorName(entry.actor_id) }) }}</p>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { BUSINESS_UNIT_OPTIONS, FORECAST_CATEGORY_OPTIONS, LOST_REASON_OPTIONS, dealStatusForStage, stageDefaultProbability, stageDefaultForecastCategory } from '~/constants/mockData'

const { t } = useI18n()

const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { dateTimeFormat } = useFormatter()
const { hasRole } = useRole()
const dealsStore = useDealsStore()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()
const projectsStore = useProjectsStore()
const productsStore = useProductsStore()
const pipelineStagesStore = usePipelineStagesStore()
const teamMembersStore = useTeamMembersStore()
const usersStore = useUsersStore()
const auditLogStore = useAuditLogStore()

// Admin/Sales Manager only (FR-CRM-025/M-8) — GET /audit-log hard-restricts
// everyone else server-side to stage_changed entries only (see
// internal/handlers/auditlog.go's List), so a Sales Rep would never get
// reassigned/bulk_reassigned entries back anyway; this just avoids the
// doomed request and hides the section for them.
const canViewOwnerHistory = computed(() => hasRole('Admin', 'Sales Manager'))

// Prefers the configured PipelineStage row's is_lost_stage flag (so a custom,
// admin-renamed Lost stage still shows/requires lost_reason), falling back to
// the literal "Lost" name if the store hasn't loaded that row yet — same
// resolution useDealStageColor.stageBadgeColor uses.
const isLostStage = (stage: string) => pipelineStagesStore.byName(stage)?.is_lost_stage ?? stage === 'Lost'

// Colors the Probability progress bar by simple magnitude thresholds — not
// stage-derived like forecastCategoryColor, since a rep can freely override
// this number away from its stage default.
const probabilityColor = computed<'error' | 'warning' | 'success'>(() => {
  if (form.probability < 33) return 'error'
  if (form.probability < 66) return 'warning'
  return 'success'
})

const { dealId, deal } = useCurrentDeal()
const linkedProject = computed(() => projectsStore.forDeal(dealId))

// FR-CRM-045's Won gate — surfaced here proactively (instead of only as a
// generic 422 toast after the fact) so a rep sees it before trying to move
// Stage to Won at all. Shared with the Contracts tab (useContractGate) so
// the rule can't drift between the two.
const { showContractGateWarning } = useContractGate(dealId, deal)

// Targeted fetchOne for this Deal's own Company/Contact, not a blanket
// fetchAll() — those stores' fetchAll caches are capped at 200 rows,
// newest-first (see stores/companies.ts's fetchAll doc), so an older
// Company/Contact linked to this Deal could otherwise never resolve here
// even though the Deal itself loaded fine. Deal loads asynchronously
// (useCurrentDeal), so this has to be a watcher, not a one-time onMounted
// check.
watch(deal, (value) => {
  if (!value) return
  if (!companiesStore.items.some(c => c.id === value.company_id)) companiesStore.fetchOne(value.company_id).catch(notifyApiError)
  if (!contactsStore.items.some(c => c.id === value.contact_id)) contactsStore.fetchOne(value.contact_id).catch(notifyApiError)
}, { immediate: true })

onMounted(() => {
  if (productsStore.items.length === 0) productsStore.fetchAll().catch(notifyApiError)
  if (pipelineStagesStore.items.length === 0) pipelineStagesStore.fetchAll().catch(notifyApiError)
  if (canViewOwnerHistory.value) {
    if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
    // usersStore.fetchAll() hits the Admin-only /users endpoint (see
    // TestRBAC_RouteGates) — only call it as Admin, or a Sales Manager
    // viewing this page would hit a 403 here, which the app's axios
    // interceptor turns into a hard redirect away from this very page.
    // actorName() below falls back to teamMembersStore for a Sales Manager.
    if (hasRole('Admin') && usersStore.items.length === 0) usersStore.fetchAll().catch(notifyApiError)
    // auditLogStore.fetchAll defaults to per_page: 20 (sized for the paginated
    // admin/activity-log.vue list view). This call wants every audit-log row
    // for one Deal so client-side filtering below doesn't miss older
    // reassignments once other action types (updated/stage_changed/etc.) push
    // them past row 20 — there's no server-side `action` filter to narrow this
    // to just reassignments (api-system-spec.md §8.5), so bump the bound
    // instead, same 200-row convention used elsewhere for "fetch it all" cases.
    auditLogStore.fetchAll({ entity_type: 'deal', entity_id: dealId, per_page: 200 }).catch(notifyApiError)
  }
})

// Only reassignment-type audit actions belong in Owner History (created/updated
// entries for unrelated field edits also land in the same audit_log table).
const ownerHistory = computed(() => auditLogStore.items
  .filter(entry => entry.entity_type === 'deal' && entry.entity_id === dealId && ['reassigned', 'bulk_reassigned'].includes(entry.action))
  .sort((a, b) => b.created_at.getTime() - a.created_at.getTime()))

const actorName = (actorId: number) => {
  const user = usersStore.items.find(u => u.id === actorId)
  if (user) return `${user.first_name} ${user.last_name}`
  // usersStore is never populated for a Sales Manager (see onMounted above) —
  // teamMembersStore (the non-Admin-only /team-members endpoint) covers the
  // same active-staff names instead, just without inactive users.
  const member = teamMembersStore.items.find(m => m.id === actorId)
  return member?.name ?? '-'
}

// Deal loads asynchronously (dealsStore.fetchAll, in the parent [id].vue), so
// company_id isn't known yet at onMounted — fetch this company's projects once
// the deal resolves.
watch(deal, (value) => {
  if (value) projectsStore.fetchForCompany(value.company_id).catch(notifyApiError)
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
  forecast_category: deal.value?.forecast_category || stageDefaultForecastCategory(deal.value?.stage || 'Lead'),
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
  form.forecast_category = value.forecast_category || stageDefaultForecastCategory(value.stage)
  form.expected_close_date = value.expected_close_date ? value.expected_close_date.toISOString().slice(0, 10) : ''
  form.assigned_to = value.assigned_to ? String(value.assigned_to) : ''
  form.business_unit = value.business_unit || ''
  form.business_unit_item = value.business_unit_item || ''
  nextTick(() => { hydrating = false })
}, { immediate: true })

const businessUnitItemOptions = useBusinessUnitItemOptions(
  toRef(form, 'business_unit'),
  computed(() => deal.value?.company_id ?? null),
  toRef(form, 'business_unit_item'),
  () => hydrating,
)

// Re-derives probability's default whenever stage changes manually (not during
// hydration) — still freely editable afterwards. lost_reason only makes sense
// while Lost, so it's cleared once the stage moves elsewhere. forecast_category
// gets the same reset-to-new-stage-default treatment, still freely editable
// afterwards too.
watch(() => form.stage, (newStage) => {
  if (hydrating) return
  form.probability = stageDefaultProbability(newStage)
  form.forecast_category = stageDefaultForecastCategory(newStage)
  if (!isLostStage(newStage)) form.lost_reason = ''
})

const { loading, guard } = useSubmitGuard()

const onSave = guard(async () => {
  if (!deal.value) return
  const wasWon = deal.value.status === 'won'
  try {
    const updated = await dealsStore.update(deal.value.id, {
      // Company/Contact/Channel aren't editable on this form (Company/Contact
      // are fixed at creation, shown read-only in the Linked Records card;
      // Channel has no field here either) — but the Update endpoint replaces
      // every field from the request body (it isn't a true partial update,
      // same as Lead's own onMarkSql note), and company_id/contact_id are
      // hard-required server-side. Omitting them here previously made every
      // save on this page 422 outright, and omitting channel silently wiped
      // it back to empty on every successful save.
      company_id: deal.value.company_id,
      contact_id: deal.value.contact_id,
      channel: deal.value.channel,
      title: form.title,
      value: form.value,
      stage: form.stage as DealStage,
      status: dealStatusForStage(form.stage as DealStage),
      probability: form.probability,
      lost_reason: isLostStage(form.stage) ? (form.lost_reason as LostReason || null) : null,
      forecast_category: form.forecast_category as ForecastCategory || null,
      expected_close_date: form.expected_close_date ? new Date(form.expected_close_date) : null,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      business_unit: form.business_unit || null,
      business_unit_item: form.business_unit_item || null,
    })
    if (!wasWon && updated.status === 'won') createWonFollowUpTask()
    success(t('crm.deals.detail.updateSuccess'))
  } catch (err) {
    if (apiErrorHasFieldCode(err, 'stage', 'requires_signed_contract')) {
      error(t('crm.deals.detail.contractRequiredToast'))
    } else {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
})
</script>
