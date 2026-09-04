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
            <p class="mb-2 text-sm font-medium">{{ t('crm.campaigns.new.step1.staleDaysLabel') }}</p>
            <CrmStatusPill v-model="staleDays" :options="staleDaysOptions" />
          </div>

          <div class="flex items-center gap-2">
            <UCheckbox v-model="hasWonDealOnly" data-cy="campaign-has-won-deal-checkbox" />
            <span class="text-sm">{{ t('crm.campaigns.new.step1.hasWonDealOnly') }}</span>
          </div>

          <div>
            <p class="mb-2 text-sm font-medium" data-cy="campaign-match-count">
              {{ loadingMatches ? t('crm.campaigns.new.step1.matchCountLoading') : t('crm.campaigns.new.step1.matchCount', { count: matchedTotal }) }}
            </p>
            <p v-if="!loadingMatches && matchedTruncated" class="mb-2 text-sm text-[var(--color-warning-hover)]" data-cy="campaign-match-truncated-notice">
              {{ t('crm.campaigns.new.step1.matchTruncated', { shown: matchedCompanies.length, total: matchedTotal }) }}
            </p>
            <p v-if="!loadingMatches && matchedCompanies.length === 0" class="text-sm text-[var(--color-gray)]">
              {{ t('crm.campaigns.new.step1.noMatches') }}
            </p>
            <div v-else class="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-[var(--color-light-gray-2)] p-3">
              <UBadge v-for="company in matchedCompanies" :key="company.id" color="neutral" variant="subtle">{{ company.name }}</UBadge>
            </div>
          </div>
        </div>
      </ContainerTemplate>

      <ContainerTemplate class="mb-4">
        <CrmCampaignTaskSetupForm
          ref="setupForm"
          :company-ids="matchedCompanyIds"
          :company-names="matchedCompanyNames"
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
const { canAccess, guardMounted } = usePageAccess(...TASK_ROLES)

const { notifyApiError } = useApiErrorNotifier()
const { success, error } = useNotify()
const companiesStore = useCompaniesStore()
const campaignsStore = useCampaignsStore()
const userStore = useUserStore()
const { CONTACT_STALE_TIER_DAYS } = useLastContact()

// --- Step 1: who to contact -------------------------------------------
const staleDaysOptions = computed<Select[]>(() => [
  { label: t('crm.campaigns.new.step1.staleDays60'), value: String(CONTACT_STALE_TIER_DAYS.tier1) },
  { label: t('crm.campaigns.new.step1.staleDays90'), value: String(CONTACT_STALE_TIER_DAYS.tier2) },
  { label: t('crm.campaigns.new.step1.staleDays120'), value: String(CONTACT_STALE_TIER_DAYS.tier3) },
])
const staleDays = ref(String(CONTACT_STALE_TIER_DAYS.tier1))
const hasWonDealOnly = ref(false)

const matchedCompanies = ref<Company[]>([])
const matchedTotal = ref(0)
const loadingMatches = ref(false)

// Capped at the same 200-row per_page ceiling documented on
// stores/companies.ts's fetchAll (the backend's own hard limit) — fine for
// a marketing win-back push, which targets a bounded stale-company segment
// rather than the full customer base. matchedTotal (the server's real count,
// not just items.length) drives the "showing first 200 of N" notice below
// so a segment past the cap is visible rather than silently truncated.
const matchedTruncated = computed(() => matchedTotal.value > matchedCompanies.value.length)

// Guards against a slower, stale request's response overwriting a newer
// filter selection's result if requests resolve out of order — only the
// most-recently-issued call is allowed to write to matchedCompanies.
let matchRequestId = 0
const fetchMatches = async () => {
  const requestId = ++matchRequestId
  loadingMatches.value = true
  try {
    const result = await companiesStore.fetchList({
      stale_days: staleDays.value,
      has_won_deal: hasWonDealOnly.value ? 'true' : undefined,
      per_page: 200,
    })
    if (requestId !== matchRequestId) return // a newer request has since started
    matchedCompanies.value = result.items
    matchedTotal.value = result.total
  } catch (err) {
    if (requestId !== matchRequestId) return
    notifyApiError(err)
  } finally {
    if (requestId === matchRequestId) loadingMatches.value = false
  }
}
// Initial fetch only runs once role access is confirmed (guardMounted waits
// on canAccess rather than firing at mount time); later filter changes are
// only reachable through the gated template anyway, but fetchMatches checks
// canAccess itself too as a safety net.
guardMounted(fetchMatches)
watch([staleDays, hasWonDealOnly], () => {
  if (canAccess.value) fetchMatches()
})

const matchedCompanyIds = computed(() => matchedCompanies.value.map(company => company.id))
const matchedCompanyNames = computed(() => matchedCompanies.value.map(company => company.name))

// --- Step 2 defaults -----------------------------------------------------
const now = new Date()
const defaultCampaignName = computed(() => {
  const monthName = new Intl.DateTimeFormat(locale.value === 'th' ? 'th-TH' : 'en-US', { month: 'long' }).format(now)
  return `Win-back – ${monthName} ${now.getFullYear()}`
})
const defaultDueDate = computed(() => {
  const due = new Date()
  due.setDate(due.getDate() + 7)
  return due.toISOString().slice(0, 10)
})
const defaultAssignedTo = computed(() => (userStore.id ? String(userStore.id) : ''))

// --- Step 3: confirm -------------------------------------------------------
const setupForm = ref<{ submit: () => void, loading: boolean } | null>(null)
const submitting = ref(false)

const onSubmit = async (payload: { name: string, title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null }) => {
  submitting.value = true
  try {
    const campaign = await campaignsStore.create({ name: payload.name, type: 'win_back' })
    await campaignsStore.bulkCreateTasks(campaign.id, {
      company_ids: matchedCompanyIds.value,
      title: payload.title,
      description: payload.description,
      due_date: payload.due_date,
      priority: payload.priority,
      assigned_to: payload.assigned_to,
    })
    success(t('crm.campaigns.new.createSuccess', { name: campaign.name, count: matchedCompanyIds.value.length }))
    await navigateTo('/crm/campaigns')
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    submitting.value = false
  }
}
</script>
