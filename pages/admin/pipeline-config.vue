<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
    <div class="mb-4">
      <h2 class="text-xl font-black">{{ t('admin.pipelineConfig.heading') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('admin.pipelineConfig.subheading') }}</p>
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.relatedConfig.heading') }}</h3>
          <p class="text-sm text-[var(--color-gray)]">{{ t('admin.pipelineConfig.relatedConfig.tagsHint') }}</p>
        </div>
        <!-- open-in-new (not sell-outline) — this card sits above the tab bar
        and could otherwise read as one more tab, when it actually navigates
        clean away to a whole separate page; the icon signals that at a
        glance instead of relying on the hint text alone. -->
        <ButtonPrimary
          :label="t('admin.pipelineConfig.relatedConfig.manageTags')"
          icon="material-symbols:open-in-new"
          outline
          fit-content
          @click="navigateTo('/crm/tags')"
        />
      </div>
    </UCard>

    <div class="mb-4 overflow-x-auto">
      <UTabs v-model="activeTab" :items="tabItems" :ui="{ list: 'w-max min-w-full', trigger: 'grow-0 shrink-0' }" />
    </div>

    <div v-if="activeTab === 'stages'">
      <AdminPipelineConfigStagesPanel :loading="stagesLoading" />
    </div>

    <div v-else-if="activeTab === 'revenue'">
      <AdminPipelineConfigSalesQuotaCard />
      <AdminPipelineConfigSalesTargetsPanel :loading="targetsLoading" />
    </div>

    <div v-else-if="activeTab === 'leads'">
      <AdminPipelineConfigLeadSourcesPanel :loading="sourcesLoading" />
      <AdminPipelineConfigLeadScoringPanel :loading="criteriaLoading" />
    </div>

    <div v-else-if="activeTab === 'prospects'">
      <AdminPipelineConfigProspectStagesPanel :loading="prospectStagesLoading" />
      <AdminPipelineConfigProspectSourcesPanel :loading="prospectSourcesLoading" />
    </div>

    <div v-else-if="activeTab === 'company'">
      <AdminPipelineConfigIndustriesPanel :loading="industriesLoading" />
      <AdminPipelineConfigCompanySizesPanel :loading="companySizesLoading" />
      <AdminPipelineConfigRevenueSizesPanel :loading="revenueSizesLoading" />
      <AdminPipelineConfigJobTitlesPanel :loading="jobTitlesLoading" />
      <AdminPipelineConfigProductCategoriesPanel :loading="productCategoriesLoading" />
    </div>

    <div v-else-if="activeTab === 'notifications'">
      <UAlert
        v-if="appSettingsStore.settings"
        class="mb-4"
        :color="appSettingsStore.settings.smtp_configured ? 'success' : 'warning'"
        variant="subtle"
        :icon="appSettingsStore.settings.smtp_configured ? 'material-symbols:check-circle-outline' : 'material-symbols:warning-outline'"
        :title="appSettingsStore.settings.smtp_configured
          ? t('admin.pipelineConfig.notifications.smtpConfigured')
          : t('admin.pipelineConfig.notifications.smtpNotConfigured')"
      />
      <AdminPipelineConfigNotificationRulesPanel :loading="rulesLoading" />
    </div>
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()
const route = useRoute()

useHead({ title: t('admin.pipelineConfig.pageTitle') })

// Admin-only page — gated by layouts/default.vue's nav `roles` filter, this
// page's own `canAccess` guard below (paired with <AccessGate> in the
// template, so a non-Admin who navigates here directly sees an explicit "no
// access" state instead of a page full of components whose data-fetches
// silently 403), and — the real security boundary — every underlying
// /admin/* backend endpoint requiring Admin via RequireRoles.
const { canAccess, guardMounted } = usePageAccess('Admin')

const { notifyApiError } = useApiErrorNotifier()
const pipelineStagesStore = usePipelineStagesStore()
const leadSourcesStore = useLeadSourcesStore()
const prospectSourcesStore = useProspectSourcesStore()
const prospectStagesStore = useProspectStagesStore()
const appSettingsStore = useAppSettingsStore()
const salesTargetsStore = useSalesTargetsStore()
const leadScoringCriteriaStore = useLeadScoringCriteriaStore()
const notificationRulesStore = useNotificationRulesStore()
const industryOptionsStore = useIndustryOptionsStore()
const companySizeOptionsStore = useCompanySizeOptionsStore()
const revenueSizeOptionsStore = useRevenueSizeOptionsStore()
const jobTitleOptionsStore = useJobTitleOptionsStore()
const productCategoryOptionsStore = useProductCategoryOptionsStore()

// Local-state tabs (no child routes, resets to the default on reload) —
// same convention as pages/crm/companies/[id].vue/pages/admin/trash.vue,
// used instead of one long scrolling page of stacked UCards now that this
// page has grown to 6 config sections. Seeded once from ?tab= (added
// 2026-09-09) so a "Manage Stages" shortcut button on e.g. Deals/Prospects'
// own list pages can deep-link straight to the right tab — one-time only,
// same as the status-filter deep links elsewhere; switching tabs afterward
// doesn't rewrite the URL.
// Single source of truth for tab values — tabItems below derives its labels
// from this same list instead of re-listing the six values a second time,
// so adding/renaming a tab can't drift the two lists out of sync (which
// would otherwise make a deep link silently fall back to 'stages' with no
// error). `typeof … === 'string'` (not an `as string` cast) matches the
// narrowing useQueryFilter/other query-param reads use elsewhere in this
// codebase, since route.query.tab is string | string[] | undefined.
const TAB_VALUES = ['stages', 'revenue', 'leads', 'prospects', 'company', 'notifications'] as const
const activeTab = ref<string>(
  typeof route.query.tab === 'string' && TAB_VALUES.includes(route.query.tab as typeof TAB_VALUES[number])
    ? route.query.tab
    : 'stages',
)

const tabItems = computed(() => TAB_VALUES.map(value => ({ label: t(`admin.pipelineConfig.tabs.${value}`), value })))

const stagesLoading = ref(false)
const sourcesLoading = ref(false)
const prospectSourcesLoading = ref(false)
const prospectStagesLoading = ref(false)
const targetsLoading = ref(false)
const criteriaLoading = ref(false)
const rulesLoading = ref(false)
const industriesLoading = ref(false)
const companySizesLoading = ref(false)
const revenueSizesLoading = ref(false)
const jobTitlesLoading = ref(false)
const productCategoriesLoading = ref(false)

guardMounted(async () => {
  stagesLoading.value = true
  pipelineStagesStore.fetchAll().catch(notifyApiError).finally(() => { stagesLoading.value = false })
  sourcesLoading.value = true
  leadSourcesStore.fetchAll().catch(notifyApiError).finally(() => { sourcesLoading.value = false })
  prospectSourcesLoading.value = true
  prospectSourcesStore.fetchAll().catch(notifyApiError).finally(() => { prospectSourcesLoading.value = false })
  prospectStagesLoading.value = true
  prospectStagesStore.fetchAll().catch(notifyApiError).finally(() => { prospectStagesLoading.value = false })
  targetsLoading.value = true
  salesTargetsStore.fetchAll().catch(notifyApiError).finally(() => { targetsLoading.value = false })
  criteriaLoading.value = true
  leadScoringCriteriaStore.fetchAll().catch(notifyApiError).finally(() => { criteriaLoading.value = false })
  rulesLoading.value = true
  notificationRulesStore.fetchAll().catch(notifyApiError).finally(() => { rulesLoading.value = false })
  industriesLoading.value = true
  industryOptionsStore.fetchAll().catch(notifyApiError).finally(() => { industriesLoading.value = false })
  companySizesLoading.value = true
  companySizeOptionsStore.fetchAll().catch(notifyApiError).finally(() => { companySizesLoading.value = false })
  revenueSizesLoading.value = true
  revenueSizeOptionsStore.fetchAll().catch(notifyApiError).finally(() => { revenueSizesLoading.value = false })
  jobTitlesLoading.value = true
  jobTitleOptionsStore.fetchAll().catch(notifyApiError).finally(() => { jobTitlesLoading.value = false })
  productCategoriesLoading.value = true
  productCategoryOptionsStore.fetchAll().catch(notifyApiError).finally(() => { productCategoriesLoading.value = false })
  try {
    await appSettingsStore.fetchAll()
  } catch (err) {
    notifyApiError(err)
  }
})
</script>
