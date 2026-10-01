<template>
  <div class="p-5">
    <div v-if="deal">
      <PageHeader :title="deal.title" @back="goBack()">
        <UBadge :color="stageBadgeColor" variant="subtle">{{ deal.stage }}</UBadge>
        <template #actions>
          <div class="flex flex-wrap gap-2">
            <!-- Quick Add's modals, prefilled with this Deal (useQuickAdd). -->
            <ButtonPrimary
              v-if="canLogActivity"
              :label="t('crm.deals.detail.logActivity')"
              icon="material-symbols:edit-note-outline"
              outline
              data-cy="deal-log-activity"
              @click="openActivity({ type: 'deal', id: deal.id })"
            />
            <ButtonPrimary
              v-if="canAddTask"
              :label="t('crm.deals.detail.addTask')"
              icon="material-symbols:task-alt"
              outline
              data-cy="deal-add-task"
              @click="openTask({ type: 'deal', id: deal.id })"
            />
            <template v-if="deal.status === 'open'">
              <ButtonPrimary
                :label="t('crm.deals.detail.markLost')"
                icon="material-symbols:cancel-outline"
                color="error"
                outline
                data-cy="deal-mark-lost"
                @click="requestLost(pipelineStagesStore.lostStageName)"
              />
              <ButtonPrimary
                :label="t('crm.deals.detail.markWon')"
                icon="material-symbols:check-circle-outline"
                data-cy="deal-mark-won"
                @click="markWonConfirmOpen = true"
              />
            </template>
          </div>
        </template>
      </PageHeader>

      <!-- Click a stage to move the Deal there (PATCH /deals/:id/stage), with
           the same Lost-reason prompt / Won hand-off as the board. -->
      <CrmDealStageStepper
        v-if="stepperStages.length > 0"
        class="mb-4"
        :stages="stepperStages"
        :current="deal.stage"
        :disabled="stageMoving"
        @select="onStepperSelect"
      />

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

    <!-- The stepper moving a Won/Lost deal to an open stage: same confirm
         as the board. -->
    <CrmDealReopenConfirmModal
      :deal="deal"
      :stage="reopenTargetStage"
      @cancel="reopenTargetStage = null"
      @confirm="onConfirmReopen"
    />

    <!-- The one Create Project prompt for this Deal — the Overview save and
         the Contracts tab's signed-contract flow reach it through the
         injected useDealWonHandoff instance, so it never opens twice. -->
    <CrmWonHandoffProjectModal :handoff="wonHandoff" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SALES_PIPELINE_ROLES, TASK_ROLES } from '~/constants/roles'

const { t } = useI18n()

useHead({ title: t('crm.deals.detail.pageTitle') })

const route = useRoute()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const dealsStore = useDealsStore()
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

// The overdue badge on the Tasks tab needs this Deal's tasks before that tab
// is opened (the tab's own useTaskList shares the same request).
const { overdueCount: dealOverdueTaskCount } = useTaskList('deal', dealId, 'crm.deals.detail.addTaskSuccess', 'crm.deals.detail.editTaskSuccess')
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
    // A filter, not `const { [WON_HANDOFF_QUERY]: _, ...rest }`: unimport
    // reads any name inside a `const {…}` pattern as a local declaration, so
    // that destructure would stop WON_HANDOFF_QUERY being auto-imported at all.
    const query = Object.fromEntries(Object.entries(route.query).filter(([key]) => key !== WON_HANDOFF_QUERY))
    router.replace({ query })
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
// Moving a Won deal with money attached out of Won (stepper / Mark Lost):
// explained, or a manager gives a reason and it's retried.
const wonDealGuard = useWonDealGuard()

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
const lostTargetStage = ref('')
const requestLost = (stage: string) => {
  lostTargetStage.value = stage
  markLostOpen.value = true
}
const onMarkLost = async (reason: LostReason) => {
  if (!deal.value) return
  try {
    const id = deal.value.id
    const stage = (lostTargetStage.value || pipelineStagesStore.lostStageName) as DealStage
    const updated = await wonDealGuard.updateStage(id, stage, { lostReason: reason })
    if (updated) success(t('crm.deals.detail.markLostSuccess'))
  } catch (err) {
    notifyStageChangeError(err)
  }
}

const { hasRole } = useRole()
const canLogActivity = computed(() => hasRole(...SALES_PIPELINE_ROLES))
const canAddTask = computed(() => hasRole(...TASK_ROLES))
const { openActivity, openTask } = useQuickAdd()

// Stage stepper: every active stage in configured order. Won goes through
// the header's Mark Won confirm (follow-up task + Create Project, contract
// gate via notifyStageChangeError), Lost through the lost-reason prompt, and
// any other stage moves straight away. The store's updated Deal flows into
// the Overview form, which keeps any unsaved edits to other fields.
const stepperStages = computed(() => pipelineStagesStore.items
  .filter(s => s.is_active)
  .sort((a, b) => a.sort_order - b.sort_order))
const stageMoving = ref(false)
const onStepperSelect = async (stage: string) => {
  if (!deal.value || stage === deal.value.stage || stageMoving.value) return
  const row = pipelineStagesStore.byName(stage)
  if (row?.is_won_stage) {
    markWonConfirmOpen.value = true
    return
  }
  if (row?.is_lost_stage) {
    requestLost(stage)
    return
  }
  if (deal.value.status !== 'open') {
    reopenTargetStage.value = stage
    return
  }
  await moveToStage(stage)
}

const moveToStage = async (stage: string) => {
  if (!deal.value) return
  const id = deal.value.id
  stageMoving.value = true
  try {
    const updated = await wonDealGuard.updateStage(id, stage as DealStage)
    if (updated) success(t('crm.deals.detail.stageChangeSuccess', { stage }))
  } catch (err) {
    notifyStageChangeError(err)
  } finally {
    stageMoving.value = false
  }
}

const reopenTargetStage = ref<string | null>(null)
const onConfirmReopen = async () => {
  const stage = reopenTargetStage.value
  reopenTargetStage.value = null
  if (stage) await moveToStage(stage)
}
</script>
