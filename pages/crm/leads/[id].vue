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
          <UBadge v-if="lead.classification === 'mql'" size="xs" color="info" variant="subtle">{{ t('crm.leads.index.mqlBadge') }}</UBadge>
          <UBadge v-else-if="lead.classification === 'sql'" size="xs" color="success" variant="subtle">{{ t('crm.leads.index.sqlBadge') }}</UBadge>
        </div>
        <div class="flex flex-wrap gap-2">
          <!-- FR-CRM-007's manual "sales-ready" override — the only classification
          a rep can set directly; mql/none stay entirely score-driven. -->
          <ButtonPrimary
            v-if="lead.classification !== 'sql'"
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
            v-else-if="lead.status !== 'Disqualified'"
            :label="t('crm.leads.detail.convertToDeal')"
            icon="material-symbols:swap-horiz"
            @click="requestConvert"
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
            <div class="grid grid-cols-1 gap-3 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary-bg)] p-3 md:col-span-2 md:grid-cols-2">
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
          <div class="mt-4 flex gap-3">
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
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
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

const leadId = Number(route.params.id)
const lead = computed(() => leadsStore.items.find(l => l.id === leadId))

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
