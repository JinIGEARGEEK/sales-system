<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <div class="mb-4">
        <h2 class="text-xl font-black">{{ t('crm.campaigns.new.heading') }}</h2>
      </div>

      <!-- Simple, non-interactive step indicator — this page is one
           continuously scrolling form rather than gated wizard steps, so
           the three labels below just orient the reader to the sections
           beneath them. -->
      <div class="mb-4 flex flex-wrap items-center gap-2 text-sm text-[var(--color-gray)]">
        <span class="font-semibold text-[var(--color-primary)]">1. {{ t('crm.campaigns.new.steps.who') }}</span>
        <UIcon name="material-symbols:chevron-right" />
        <span>2. {{ t('crm.campaigns.new.steps.setup') }}</span>
        <UIcon name="material-symbols:chevron-right" />
        <span>3. {{ t('crm.campaigns.new.steps.review') }}</span>
      </div>

      <ContainerTemplate class="mb-4">
        <h3 class="mb-3 text-base font-semibold">{{ t('crm.campaigns.new.step1.heading') }}</h3>
        <div class="flex flex-col gap-4">
          <div>
            <p class="mb-2 text-sm font-medium">{{ t('crm.campaigns.new.step1.entityTypeLabel') }}</p>
            <CrmStatusPill v-model="entityType" :options="entityTypeOptions" data-cy="campaign-entity-type" />
          </div>

          <template v-if="entityType === 'company'">
            <div>
              <p class="mb-2 text-sm font-medium">{{ t('crm.campaigns.new.step1.staleDaysLabel') }}</p>
              <CrmStatusPill v-model="staleDays" :options="staleDaysOptions" />
            </div>

            <div class="flex items-center gap-2">
              <UCheckbox v-model="hasWonDealOnly" data-cy="campaign-has-won-deal-checkbox" />
              <span class="text-sm">{{ t('crm.campaigns.new.step1.hasWonDealOnly') }}</span>
            </div>
          </template>
          <div v-else class="w-full sm:w-72">
            <InputText v-model="entitySearch" :placeholder="t('crm.campaigns.new.step1.searchPlaceholder')" name="entitySearch" />
          </div>

          <div>
            <p class="mb-2 text-sm font-medium" data-cy="campaign-match-count">
              {{ loadingMatches ? t('crm.campaigns.new.step1.matchCountLoading') : t('crm.campaigns.new.step1.matchCount', { count: matchedTargets.length }) }}
            </p>
            <p v-if="!loadingMatches && matchedTargets.length === 0" class="text-sm text-[var(--color-gray)]">
              {{ t('crm.campaigns.new.step1.noMatches') }}
            </p>
            <div v-else class="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-[var(--color-light-gray-2)] p-3">
              <UBadge v-for="target in matchedTargets" :key="`${target.type}-${target.id}`" color="neutral" variant="subtle">{{ target.name }}</UBadge>
            </div>
          </div>
        </div>
      </ContainerTemplate>

      <ContainerTemplate class="mb-4">
        <CrmCampaignTaskSetupForm
          ref="setupForm"
          :targets="matchedTargets"
          :type-options="typeOptions"
          :name-default="defaultCampaignName"
          :due-date-default="defaultDueDate"
          :assigned-to-default="defaultAssignedTo"
          :setup-heading="t('crm.campaigns.new.steps.setup')"
          :review-heading="t('crm.campaigns.new.steps.review')"
          @submit="onSubmit"
        />
      </ContainerTemplate>

      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.campaigns.new.cancel')" cancel @click="navigateTo('/crm/campaigns')" />
        <ButtonPrimary
          :label="t('crm.components.createCampaignModal.save')"
          :loading="submitting"
          data-cy="campaign-submit-button"
          @click="setupForm?.submit()"
        />
      </div>
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TASK_ROLES } from '~/constants/roles'

const { t, locale } = useI18n()

useHead({ title: t('crm.campaigns.new.pageTitle') })

// Same gating as /crm/campaigns and /crm/tasks — this is just a guided
// entry point for the same bulk-Task-creation action.
const { canAccess } = usePageAccess(...TASK_ROLES)

const { notifyApiError } = useApiErrorNotifier()
const { success, error } = useNotify()
const companiesStore = useCompaniesStore()
const leadsStore = useLeadsStore()
const contactsStore = useContactsStore()
const campaignsStore = useCampaignsStore()
const userStore = useUserStore()
const { CONTACT_STALE_TIER_DAYS } = useLastContact()

// --- Step 1: who to contact -------------------------------------------
// Company keeps its own dedicated stale-days/won-deal filter (FR-CRM-108
// targeting); Lead/Contact are a simple name search — no equivalent
// staleness concept defined for them yet (FR-CRM-112).
const entityTypeOptions = computed<Select[]>(() => [
  { label: t('crm.campaigns.new.step1.entityTypeCompany'), value: 'company' },
  { label: t('crm.campaigns.new.step1.entityTypeLead'), value: 'lead' },
  { label: t('crm.campaigns.new.step1.entityTypeContact'), value: 'contact' },
])
const entityType = ref<'company' | 'lead' | 'contact'>('company')
// Switching target entity resets the campaign type to that entity's own
// default rather than carrying over a choice (e.g. 'upsell') that wouldn't
// make sense for the newly-selected entity.
const typeOptions = computed<CampaignType[]>(() => (entityType.value === 'company' ? ['win_back', 'upsell'] : ['new_channel']))

const staleDaysOptions = computed<Select[]>(() => [
  { label: t('crm.campaigns.new.step1.staleDays60'), value: String(CONTACT_STALE_TIER_DAYS.tier1) },
  { label: t('crm.campaigns.new.step1.staleDays90'), value: String(CONTACT_STALE_TIER_DAYS.tier2) },
  { label: t('crm.campaigns.new.step1.staleDays120'), value: String(CONTACT_STALE_TIER_DAYS.tier3) },
])
const staleDays = ref(String(CONTACT_STALE_TIER_DAYS.tier1))
const hasWonDealOnly = ref(false)
const entitySearch = ref('')

const matchedTargets = ref<CampaignTarget[]>([])
const loadingMatches = ref(false)

// Capped at the same 200-row per_page ceiling documented on
// stores/companies.ts's fetchAll (the backend's own hard limit) — fine for
// a marketing push, which targets a bounded segment rather than the full
// customer/lead/contact base.
const fetchMatches = async () => {
  loadingMatches.value = true
  try {
    if (entityType.value === 'company') {
      const result = await companiesStore.fetchList({
        stale_days: staleDays.value,
        has_won_deal: hasWonDealOnly.value ? 'true' : undefined,
        per_page: 200,
      })
      matchedTargets.value = result.items.map(company => ({ type: 'company' as const, id: company.id, name: company.name }))
    } else if (entityType.value === 'lead') {
      const result = await leadsStore.fetchList({ search: entitySearch.value || undefined, per_page: 200 })
      matchedTargets.value = result.items.map(lead => ({ type: 'lead' as const, id: lead.id, name: lead.name }))
    } else {
      const result = await contactsStore.fetchList({ search: entitySearch.value || undefined, per_page: 200 })
      matchedTargets.value = result.items.map(contact => ({ type: 'contact' as const, id: contact.id, name: contact.name }))
    }
  } catch (err) {
    notifyApiError(err)
  } finally {
    loadingMatches.value = false
  }
}
watch([entityType, staleDays, hasWonDealOnly], fetchMatches, { immediate: true })
// Same manual setTimeout debounce composables/utils/useDebouncedSearch.ts
// uses elsewhere — this page's search box doubles as a filter for whichever
// entity is currently selected, rather than owning its own results cache,
// so it's simpler to debounce inline than to reuse that composable.
let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined
watch(entitySearch, () => {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(fetchMatches, 400)
})

// --- Step 2 defaults -----------------------------------------------------
const now = new Date()
const defaultCampaignName = computed(() => {
  const monthName = new Intl.DateTimeFormat(locale.value === 'th' ? 'th-TH' : 'en-US', { month: 'long' }).format(now)
  return `${t(`crm.campaigns.index.type.${typeOptions.value[0]}`)} – ${monthName} ${now.getFullYear()}`
})
const defaultDueDate = computed(() => {
  const due = new Date()
  due.setDate(due.getDate() + 7)
  return due.toISOString().slice(0, 10)
})
const defaultAssignedTo = computed(() => (userStore.id ? String(userStore.id) : ''))

// --- Step 3: confirm -------------------------------------------------------
const setupForm = ref<{ submit: () => void } | null>(null)
const submitting = ref(false)

const onSubmit = async (payload: CampaignTaskSetupSubmitPayload) => {
  submitting.value = true
  try {
    const campaign = await campaignsStore.submitCampaignTasks(matchedTargets.value, payload)
    success(t(payload.mode === 'existing' ? 'crm.campaigns.new.addSuccess' : 'crm.campaigns.new.createSuccess', { name: campaign.name, count: matchedTargets.value.length }))
    await navigateTo('/crm/campaigns')
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    submitting.value = false
  }
}
</script>
