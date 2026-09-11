<template>
  <div class="p-5">
    <div v-if="lead">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div class="flex min-w-0 flex-wrap items-center gap-3">
          <UButton
            icon="material-symbols:arrow-back"
            variant="ghost"
            color="neutral"
            class="cursor-pointer p-0 hover:bg-transparent"
            :aria-label="t('global.back')"
            @click="goBack()"
          />
          <h2 class="max-w-full truncate text-xl font-black">{{ lead.name }}</h2>
          <UBadge color="neutral" variant="subtle">{{ lead.status }}</UBadge>
          <UBadge v-if="lead.classification === 'mql'" size="xs" color="info" variant="subtle">{{ lead.score }} · {{ t('crm.leads.index.mqlBadge') }}</UBadge>
          <UBadge v-else-if="lead.classification === 'sql'" size="xs" color="success" variant="subtle">{{ lead.score }} · {{ t('crm.leads.index.sqlBadge') }}</UBadge>
          <UBadge v-else size="xs" color="neutral" variant="subtle">{{ lead.score }}</UBadge>

          <UPopover v-model:open="scoreBreakdownOpen" @update:open="onScoreBreakdownToggle">
            <UButton
              icon="material-symbols:info-outline"
              variant="ghost"
              color="neutral"
              size="xs"
              class="cursor-pointer p-0.5"
              :aria-label="t('crm.leads.detail.scoreBreakdownTitle')"
            />
            <template #content>
              <div class="w-72 p-3">
                <p class="mb-2 text-sm font-medium">{{ t('crm.leads.detail.scoreBreakdownTitle') }}</p>
                <div v-if="scoreBreakdownLoading" class="py-2 text-center text-sm text-(--color-gray)">{{ t('global.loading') }}</div>
                <div v-else-if="scoreBreakdownError" class="flex flex-col items-start gap-2 py-1 text-sm text-(--color-gray)">
                  <span>{{ t('crm.leads.detail.scoreBreakdownError') }}</span>
                  <UButton size="xs" variant="outline" color="neutral" :label="t('crm.leads.detail.scoreBreakdownRetry')" @click="fetchScoreBreakdown" />
                </div>
                <template v-else-if="scoreBreakdown">
                  <div v-if="scoreBreakdown.matched.length === 0" class="text-sm text-(--color-gray)">
                    {{ t('crm.leads.detail.scoreBreakdownNoMatches') }}
                  </div>
                  <ul v-else class="flex flex-col gap-1.5">
                    <li v-for="criterion in scoreBreakdown.matched" :key="criterion.id" class="flex items-center justify-between gap-3 text-sm">
                      <span class="truncate">{{ criterion.name }}</span>
                      <!-- Weight is validated >= 1 only client-side (the Admin
                      config form) — the backend accepts any int, so a signed
                      format (rather than always assuming/prefixing "+")
                      still reads correctly for a 0 or negative weight, should
                      one ever exist. -->
                      <span class="shrink-0 font-medium text-(--color-success-toast)">{{ formatSignedWeight(criterion.weight) }}</span>
                    </li>
                  </ul>
                  <div class="mt-2 flex items-center justify-between border-t border-(--color-light-gray-2) pt-2 text-sm font-medium">
                    <span>{{ t('crm.leads.detail.scoreBreakdownTotal') }}</span>
                    <span>{{ scoreBreakdown.score }}</span>
                  </div>
                  <p class="mt-1 text-xs text-(--color-gray)">{{ t('crm.leads.detail.scoreBreakdownThreshold', { threshold: scoreBreakdown.threshold }) }}</p>
                  <p v-if="scoreBreakdown.classification === 'sql'" class="mt-2 text-xs text-(--color-gray)">
                    {{ t('crm.leads.detail.scoreBreakdownManualSql') }}
                  </p>
                </template>
              </div>
            </template>
          </UPopover>
        </div>
        <div class="flex flex-wrap gap-2">
          <!-- FR-CRM-007's manual "sales-ready" override — the only classification
          a rep can set directly; mql/none stay entirely score-driven. Both this
          and Convert to Deal are Sales-pipeline actions (backend-enforced too,
          PUT/convert on /leads/:id — see internal/routes/routes.go): a Marketing
          viewer can still reach this page read-only (the Prospect detail page's
          "View Lead" link, once converted) without these buttons implying
          actions that aren't theirs to take. -->
          <ButtonPrimary
            v-if="canManageLead && lead.classification !== 'sql'"
            :label="t('crm.leads.detail.markSql')"
            icon="material-symbols:star-outline"
            outline
            @click="onMarkSql"
          />
          <ButtonPrimary
            v-if="lead.converted_deal_id"
            :label="t('crm.leads.index.actions.viewDeal')"
            icon="material-symbols:open-in-new"
            @click="navigateTo(`/crm/deals/${lead.converted_deal_id}`)"
          />
          <ButtonPrimary
            v-else-if="canManageLead && lead.status !== 'Disqualified'"
            :label="t('crm.leads.detail.convertToDeal')"
            icon="material-symbols:swap-horiz"
            @click="requestConvert"
          />
          <ButtonPrimary
            :label="t('crm.components.campaignBulkActionBar.addToCampaign')"
            icon="material-symbols:campaign-outline"
            outline
            @click="openCampaignModal"
          />
        </div>
      </div>

      <ContainerTemplate>
        <Form @submit="onSave">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InputText v-model="form.name" :label="t('crm.leads.detail.fullName')" name="name" rules="required" />
            <InputCompanySelect v-model="form.company_id" :label="t('crm.leads.detail.companyName')" name="company_id" />
            <InputText v-model="form.email" :label="t('crm.leads.detail.email')" name="email" rules="required" />
            <InputText v-model="form.phone" :label="t('crm.leads.detail.phone')" name="phone" />
            <InputSelect v-model="form.source" :options="sourceOptions" :label="t('crm.leads.detail.source')" name="source" rules="required" />
            <InputSelect
              v-model="form.status"
              :options="LEAD_STATUS_FORM_OPTIONS"
              :label="t('crm.leads.detail.status')"
              name="status"
              rules="required"
            />
            <CrmTeamMemberSelect v-model="form.assigned_to" name="assigned_to" />
            <div class="grid grid-cols-1 gap-3 rounded-lg border border-sky-300 bg-sky-50 p-3 md:col-span-2 md:grid-cols-2">
              <InputSelect
                v-model="form.business_unit"
                :options="BUSINESS_UNIT_OPTIONS"
                :label="t('crm.leads.detail.businessUnit')"
                :placeholder="t('crm.leads.detail.businessUnitPlaceholder')"
                name="business_unit"
              />
              <CrmBusinessUnitItemField
                v-if="form.business_unit"
                v-model="form.business_unit_item"
                :business-unit="form.business_unit"
                :company-id="form.company_id"
                :options="businessUnitItemOptions"
                early-stage
              />
            </div>
            <div class="md:col-span-2">
              <InputTextarea v-model="form.notes" :label="t('crm.leads.detail.notes')" name="notes" />
            </div>
          </div>
          <!-- Hidden (not just left to 403 on submit) for a Marketing viewer who
          reached this page read-only via the Prospect "View Lead" link — same
          canManageLead gate as Mark SQL/Convert to Deal above, now that
          PUT /leads/:id is backend-restricted to SALES_PIPELINE_ROLES too. -->
          <div v-if="canManageLead" class="mt-4 flex gap-3">
            <ButtonPrimary :label="t('crm.leads.detail.saveChanges')" type="submit" :loading="loading" />
          </div>
        </Form>
      </ContainerTemplate>

      <ContainerTemplate class="mt-4">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-base font-semibold">{{ t('crm.leads.detail.attachmentsHeading') }}</h3>
          <ButtonPrimary
            v-if="canManageAttachments"
            :label="t('crm.leads.detail.addAttachment')"
            icon="material-symbols:add"
            small
            @click="addAttachmentOpen = true"
          />
        </div>
        <CrmAttachmentList :attachments="leadAttachments" @remove="onRemoveAttachment" />
      </ContainerTemplate>

      <CrmAddAttachmentModal
        v-model:open="addAttachmentOpen"
        @submit="onAddAttachment"
      />

      <CrmConfirmDeleteModal
        v-model:open="confirmConvertOpen"
        :title="t('crm.leads.detail.confirmConvertToDealTitle')"
        :body="t('crm.leads.detail.confirmConvertToDealBody', { name: lead.name })"
        :confirm-label="t('crm.leads.detail.confirmConvertToDealButton')"
        confirm-color="primary"
        @confirm="onConvertToDeal"
      />

      <CrmCreateCampaignModal
        v-model:open="createCampaignOpen"
        :targets="campaignTargets"
        :type-options="['new_channel']"
        @submit="onSubmitCampaign"
      />
    </div>

    <div v-else class="py-12 text-center text-(--color-gray)">
      {{ t('crm.leads.detail.leadNotFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LEAD_STATUS_FORM_OPTIONS, BUSINESS_UNIT_OPTIONS } from '~/constants/mockData'
import { SALES_PIPELINE_ROLES } from '~/constants/roles'

const { t } = useI18n()

useHead({ title: t('crm.leads.detail.pageTitle') })

const route = useRoute()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const leadsStore = useLeadsStore()
const attachmentsStore = useAttachmentsStore()
const leadSourcesStore = useLeadSourcesStore()
const goBack = useBackNavigation('/crm/leads')

// Matches the backend's POST /attachments RBAC (Admin/Sales Rep/Sales Manager,
// not Production) — internal/routes/routes.go. Same role set as
// SALES_PIPELINE_ROLES, so reuse it rather than re-listing the same 3 roles.
const canManageAttachments = computed(() => hasRole(...SALES_PIPELINE_ROLES))
// Matches the backend's PUT/convert RBAC on /leads/:id (same SALES_PIPELINE_ROLES
// set) — Mark SQL and Convert to Deal are Sales-pipeline actions, not something
// Marketing does even though they can reach this page read-only.
const canManageLead = computed(() => hasRole(...SALES_PIPELINE_ROLES))

const leadId = Number(route.params.id)
const lead = computed(() => leadsStore.items.find(l => l.id === leadId))

// FR-CRM-007's "how is this calculated" breakdown — fetched lazily on first
// open (not on page mount) since it's an extra request most visits never
// need, and cached for the rest of this page visit rather than re-fetched
// every time the popover re-opens.
const scoreBreakdownOpen = ref(false)
const scoreBreakdown = ref<LeadScoreBreakdown | null>(null)
const scoreBreakdownLoading = ref(false)
const scoreBreakdownError = ref(false)

const fetchScoreBreakdown = () => {
  scoreBreakdownError.value = false
  scoreBreakdownLoading.value = true
  leadsStore.fetchScoreBreakdown(leadId)
    .then((result) => { scoreBreakdown.value = result })
    .catch((err) => {
      notifyApiError(err)
      scoreBreakdownError.value = true
    })
    .finally(() => { scoreBreakdownLoading.value = false })
}

const onScoreBreakdownToggle = (isOpen: boolean) => {
  if (!isOpen || scoreBreakdown.value || scoreBreakdownLoading.value) return
  fetchScoreBreakdown()
}

// A signed weight: components/Crm/LeadScoringCriterionModal.vue's
// `min_value:1` rule is a client-side-only guard (the backend accepts any
// int, no validation) — format the sign explicitly rather than always
// prefixing "+", so a 0 or negative weight (if one ever exists) still
// renders correctly instead of "+0"/"+-5".
const formatSignedWeight = (weight: number) => (weight >= 0 ? `+${weight}` : `${weight}`)

// This page's `leadId`/`lead` (and now scoreBreakdown) are only ever
// computed once from the route params at setup — like every other detail
// page in this app (Contacts/Companies use the same const-at-setup
// pattern), it doesn't react to an in-place navigation to a different
// record of the same route (e.g. GlobalSearch linking Lead A's page
// straight to Lead B, reusing the component since <NuxtPage> has no
// per-route :key). That's a pre-existing, app-wide gap beyond this
// feature's scope to fix — but at minimum, reset this popover's own state
// so a stale breakdown for the previous Lead can't be shown as if it were
// the new one's.
watch(() => route.params.id, () => {
  scoreBreakdown.value = null
  scoreBreakdownError.value = false
  scoreBreakdownOpen.value = false
})

onMounted(() => {
  // fetchOne, not fetchAll: this page only ever needs this one Lead, and
  // fetchAll's 200-row cache (newest-first) can miss an older one entirely —
  // a Lead past that cutoff would otherwise never load here at all.
  if (!leadsStore.items.some(l => l.id === leadId)) leadsStore.fetchOne(leadId).catch(notifyApiError)
  if (leadSourcesStore.items.length === 0) leadSourcesStore.fetchAll().catch(notifyApiError)
  attachmentsStore.fetchForRelated('lead', leadId).catch(notifyApiError)
})

// A Lead converted from a Prospect (POST /prospects/:id/convert) may carry a
// source value that isn't one of Lead's own configured LeadSourceOption rows
// (e.g. "LINE OA") — Prospect and Lead deliberately have separate source
// lists. Keep it selectable here rather than silently blanking the field,
// same pattern as pages/crm/contacts/[id].vue's roleTitleOptions.
const sourceOptions = computed<Select[]>(() => {
  const current = lead.value?.source
  const active = leadSourcesStore.activeOptions
  if (!current || active.some(o => o.value === current)) return active
  return [...active, { label: current, value: current }]
})

const leadAttachments = computed(() => attachmentsStore.forRelated('lead', leadId))
const addAttachmentOpen = ref(false)
const { open: confirmConvertOpen, request: requestConvert, close: closeConvertConfirm } = useConfirmGate()

// Single-record "Add to Campaign" entry point (FR-CRM-112).
const { createCampaignOpen, campaignTargets, onSubmitCampaign, openCampaignModal: openCampaignModalFor } = useCampaignTargeting(
  { create: 'crm.leads.index.campaignCreateSuccess', add: 'crm.leads.index.campaignAddSuccess' },
)
const openCampaignModal = () => {
  if (lead.value) openCampaignModalFor([{ type: 'lead', id: lead.value.id, name: lead.value.name }])
}

const onConvertToDeal = () => {
  if (!lead.value) return
  closeConvertConfirm()
  navigateTo(`/crm/deals/create?lead_id=${lead.value.id}`)
}

const onAddAttachment = async (payload: { category: AttachmentCategory, file: File } | { category: AttachmentCategory, fileName: string, externalUrl: string }) => {
  try {
    if ('file' in payload) {
      await attachmentsStore.addFile('lead', leadId, payload.category, payload.file)
    } else {
      await attachmentsStore.addLink('lead', leadId, payload.category, payload.fileName, payload.externalUrl)
    }
    success(t('crm.leads.detail.addAttachmentSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onRemoveAttachment = async (id: number) => {
  try {
    await attachmentsStore.remove(id)
    success(t('crm.leads.detail.removeAttachmentSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const form = reactive({
  name: lead.value?.name || '',
  company_id: lead.value?.company_id ?? null as number | null,
  email: lead.value?.email || '',
  phone: lead.value?.phone || '',
  source: lead.value?.source || '',
  status: lead.value?.status || 'New',
  assigned_to: lead.value?.assigned_to ? String(lead.value.assigned_to) : '',
  business_unit: (lead.value?.business_unit || '') as BusinessUnit | '',
  business_unit_item: lead.value?.business_unit_item || '',
  notes: lead.value?.notes || '',
})

// Lead loads asynchronously now (fetched on mount), so the form is (re)populated
// once the record arrives instead of only at setup time. `hydrating` suppresses
// the business_unit watcher below during this — otherwise setting
// business_unit here would immediately wipe business_unit_item set a couple
// lines later, same pattern as pages/crm/deals/[id]/index.vue.
let hydrating = false
watch(lead, (value) => {
  if (!value) return
  hydrating = true
  form.name = value.name
  form.company_id = value.company_id ?? null
  form.email = value.email
  form.phone = value.phone
  form.source = value.source
  form.status = value.status
  form.assigned_to = value.assigned_to ? String(value.assigned_to) : ''
  form.business_unit = value.business_unit || ''
  form.business_unit_item = value.business_unit_item || ''
  form.notes = value.notes
  nextTick(() => { hydrating = false })
}, { immediate: true })

const businessUnitItemOptions = useBusinessUnitItemOptions(
  toRef(form, 'business_unit'),
  toRef(form, 'company_id'),
  toRef(form, 'business_unit_item'),
  () => hydrating,
)

const { loading, guard } = useSubmitGuard()

const onSave = guard(async () => {
  if (!lead.value) return
  try {
    await leadsStore.update(lead.value.id, {
      name: form.name,
      company_id: form.company_id,
      email: form.email,
      phone: form.phone,
      source: form.source as LeadSource,
      status: form.status as LeadStatus,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      business_unit: form.business_unit || null,
      business_unit_item: form.business_unit_item || null,
      notes: form.notes,
    })
    success(t('crm.leads.detail.updateSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
})

// The Update endpoint replaces every field from the request body (it isn't a
// true partial-update — see leadForm on the backend), so marking a Lead "sql"
// still has to resend the rest of the form's current values alongside it,
// not just `classification` on its own.
const onMarkSql = async () => {
  if (!lead.value) return
  try {
    await leadsStore.update(lead.value.id, {
      name: form.name,
      company_id: form.company_id,
      email: form.email,
      phone: form.phone,
      source: form.source as LeadSource,
      status: form.status as LeadStatus,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      business_unit: form.business_unit || null,
      business_unit_item: form.business_unit_item || null,
      notes: form.notes,
      classification: 'sql',
    })
    success(t('crm.leads.detail.markSqlSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
