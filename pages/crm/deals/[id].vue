<template>
  <div class="p-5">
    <div v-if="deal">
      <PageHeader :title="deal.title" @back="goBack()">
        <UBadge :color="stageBadgeColor" variant="subtle">{{ deal.stage }}</UBadge>
        <template #actions>
          <div v-if="deal.status === 'open'" class="flex flex-wrap gap-2">
            <ButtonPrimary
              :label="t('crm.deals.detail.markLost')"
              icon="material-symbols:cancel-outline"
              color="error"
              outline
              data-cy="deal-mark-lost"
              @click="markLostOpen = true"
            />
            <ButtonPrimary
              :label="t('crm.deals.detail.markWon')"
              icon="material-symbols:check-circle-outline"
              data-cy="deal-mark-won"
              @click="markWonConfirmOpen = true"
            />
          </div>
        </template>
      </PageHeader>

      <div ref="tabStripRef" class="mb-4 overflow-x-auto scrollbar-hide" data-cy="deal-tab-strip">
        <UTabs :model-value="activeTab" :items="tabItems" :ui="{ list: 'w-max min-w-full', trigger: 'grow-0 shrink-0' }" @update:model-value="onTabChange" />
      </div>

      <NuxtPage />
    </div>

    <DetailSkeleton v-else-if="dealPending" />
    <NotFoundState v-else :message="t('crm.deals.detail.dealNotFound')" back-to="/crm/deals" />

    <!-- Winning triggers the follow-up task and the Create Project prompt and
         isn't a one-click undo — ask first (§5.7). -->
    <CrmConfirmDeleteModal
      v-model:open="markWonConfirmOpen"
      :title="t('crm.deals.detail.markWonConfirmTitle')"
      :body="t('crm.deals.detail.markWonConfirmBody', { title: deal?.title || '' })"
      :confirm-label="t('crm.deals.detail.markWon')"
      confirm-color="success"
      @confirm="onMarkWon"
    />

    <CrmLostReasonModal v-model:open="markLostOpen" @confirm="onMarkLost" />

    <!-- The one Create Project prompt for this Deal — the Overview save and
         the Contracts tab's signed-contract flow reach it through the
         injected useDealWonHandoff instance, so it never opens twice. -->
    <CrmWonHandoffProjectModal :handoff="wonHandoff" />
  </div>
</template>

<script setup lang="ts">
import { WON_HANDOFF_QUERY } from '~/composables/utils/useDealWonHandoff'
import { useI18n } from 'vue-i18n'
import { isTaskOverdue } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.deals.detail.pageTitle') })

const route = useRoute()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const dealsStore = useDealsStore()
const tasksStore = useTasksStore()
const pipelineStagesStore = usePipelineStagesStore()

const { dealId, deal, dealPending } = useCurrentDeal()

// Always back to the Deals list, not useBackNavigation's "return to actual
// previous page" behavior — every tab under this detail page (overview,
// quotes, contracts, payments, tasks, activity, attachments) shares this one
// back arrow, and a rep bouncing between them or arriving via a cross-link
// from another entity's detail page expects a Deal's back arrow to mean
// "back to Deals", not history-back to wherever they came from.
const goBack = () => navigateTo('/crm/deals')

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

const tabStripRef = useTemplateRef<HTMLElement>('tabStripRef')
useScrollActiveTabIntoView(tabStripRef, activeTab)

const onTabChange = (value: string | number) => {
  navigateTo(value === 'overview' ? `/crm/deals/${dealId}` : `/crm/deals/${dealId}/${value}`)
}

const dealTasks = computed(() => tasksStore.forRelated('deal', dealId))
// The overdue badge on the Tasks tab needs this Deal's tasks before that tab
// is opened (the tab's own useTaskList shares the same request).
tasksStore.fetchForRelated('deal', dealId).catch(notifyApiError)
const dealOverdueTaskCount = computed(() => dealTasks.value.filter(task => isTaskOverdue(task)).length)
const tabItems = computed(() => [
  { label: t('crm.deals.detail.tabs.overview'), value: 'overview' },
  { label: t('crm.deals.detail.tabs.quotes'), value: 'quotes' },
  { label: t('crm.deals.detail.tabs.contracts'), value: 'contracts' },
  { label: t('crm.deals.detail.tabs.payments'), value: 'payments' },
  { label: dealOverdueTaskCount.value > 0 ? `${t('crm.deals.detail.tabs.tasks')} (${dealOverdueTaskCount.value})` : t('crm.deals.detail.tabs.tasks'), value: 'tasks' },
  { label: t('crm.deals.detail.tabs.attachments'), value: 'attachments' },
  { label: t('crm.deals.detail.tabs.activity'), value: 'activity' },
])

const { stageBadgeColor: stageColorFor } = useDealStageColor()
const stageBadgeColor = computed(() => deal.value ? stageColorFor(deal.value.stage) : 'neutral')

const wonHandoff = provideDealWonHandoff()
const { markWon, promptCreateProject } = wonHandoff

// A Lead dropped into Won on the board lands here with ?won_handoff=1 (the
// board already created the follow-up task) — offer Create Project once.
if (route.query[WON_HANDOFF_QUERY] === '1') {
  // Stripped once mounted — a replace during setup races the navigation
  // that's still landing here and gets dropped.
  const router = useRouter()
  onMounted(() => {
    const { [WON_HANDOFF_QUERY]: _flag, ...rest } = route.query
    router.replace({ query: rest })
  })
  const offerProject = (value: Deal | null | undefined) => {
    if (!value) return false
    if (value.status === 'won') promptCreateProject(value)
    return true
  }
  if (!offerProject(deal.value)) {
    const stop = watch(deal, (value) => {
      if (offerProject(value)) stop()
    })
  }
}
const notifyStageChangeError = useStageChangeErrorNotifier()

const markWonConfirmOpen = ref(false)
const onMarkWon = async () => {
  if (!deal.value) return
  try {
    await markWon(deal.value)
  } catch (err) {
    notifyStageChangeError(err)
  } finally {
    markWonConfirmOpen.value = false
  }
}

// Same PATCH /deals/:id/stage + lost_reason the Kanban board's drop into
// Lost sends, so a loss recorded here reads the same in reports.
const markLostOpen = ref(false)
const onMarkLost = async (reason: LostReason) => {
  if (!deal.value) return
  try {
    await dealsStore.updateStage(deal.value.id, pipelineStagesStore.lostStageName as DealStage, undefined, reason)
    success(t('crm.deals.detail.markLostSuccess'))
  } catch (err) {
    notifyStageChangeError(err)
  }
}
</script>
