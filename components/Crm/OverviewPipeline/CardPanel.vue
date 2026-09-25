<template>
  <USlideover
    :open="open"
    side="right"
    :ui="{ content: 'max-w-md' }"
    :title="dialogTitle"
    :description="dialogDescription"
    @update:open="emit('update:open', $event)"
  >
    <!-- #content (not #header/#body/#footer) so the `title`/`description`
    props above render as a visually-hidden DialogTitle/Description — the
    dialog's accessible name — while the visible header below keeps its own
    custom layout. The three wrappers reuse Slideover's own header/body/
    footer slot classes, so the look is unchanged. -->
    <template #content>
    <div class="flex min-h-16 items-center gap-1.5 p-4 sm:px-6">
      <div v-if="selection" class="flex min-w-0 flex-1 items-start gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold tracking-wider uppercase" :style="{ color: OVERVIEW_ZONES[selection.zone].color }">
            {{ t(`crm.overviewPipeline.panel.kind.${selection.zone}`) }} · #{{ selection.card.id }}
          </p>
          <h3 class="mt-0.5 text-lg font-semibold text-balance">{{ selection.card.name || '—' }}</h3>
          <div class="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
            <template v-for="(step, index) in lineage" :key="step">
              <UIcon v-if="index > 0" name="material-symbols:chevron-right" class="size-4 text-(--color-gray)" />
              <span
                class="rounded-full border px-2 py-0.5"
                :class="index === lineage.length - 1 ? 'border-(--color-primary) bg-(--color-primary) text-white' : 'border-(--color-card-border) bg-(--color-light-gray-1)'"
              >{{ t(`crm.overviewPipeline.panel.kind.${step}`) }}</span>
            </template>
          </div>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="material-symbols:close"
          :aria-label="t('crm.overviewPipeline.panel.close')"
          @click="emit('update:open', false)"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div v-if="selection" class="flex flex-col gap-5">
        <dl class="grid grid-cols-[7.5rem_1fr] items-center gap-x-3 gap-y-2.5 text-sm">
          <dt class="text-(--color-gray)">{{ t('crm.overviewPipeline.panel.stage') }}</dt>
          <dd>
            <InputSelect
              :model-value="currentStage"
              :options="stageOptions"
              :placeholder="t('crm.overviewPipeline.panel.pickStage')"
              :disable="moving"
              name="overviewStage"
              data-cy="overview-panel-stage"
              @update:model-value="onChangeStage(String($event))"
            />
          </dd>
          <template v-if="selection.card.company_name">
            <dt class="text-(--color-gray)">{{ t('crm.overviewPipeline.panel.company') }}</dt>
            <dd>{{ selection.card.company_name }}</dd>
          </template>
          <template v-if="selection.zone === 'deal'">
            <dt class="text-(--color-gray)">{{ t('crm.overviewPipeline.panel.value') }}</dt>
            <dd class="tabular-nums">
              <span class="font-semibold">{{ t('global.currencySymbol') }}{{ priceFormat(selection.card.value) }}</span>
              <span v-if="selection.card.probability !== null" class="text-(--color-dark-gray)"> · {{ t('crm.overviewPipeline.panel.probability', { value: selection.card.probability }) }}</span>
            </dd>
          </template>
          <dt class="text-(--color-gray)">{{ t('crm.overviewPipeline.panel.owner') }}</dt>
          <dd>{{ selection.card.assigned_to ? teamMembersStore.nameById(selection.card.assigned_to) : t('crm.overviewPipeline.card.unassigned') }}</dd>
          <template v-if="selection.card.source">
            <dt class="text-(--color-gray)">{{ t('crm.overviewPipeline.panel.source') }}</dt>
            <dd>{{ selection.card.source }}</dd>
          </template>
          <dt class="text-(--color-gray)">{{ selection.lane.terminal ? t('crm.overviewPipeline.panel.closed') : t('crm.overviewPipeline.panel.inStage') }}</dt>
          <dd class="tabular-nums">
            {{ selection.lane.terminal ? t('crm.overviewPipeline.panel.closedDays', { days }) : t('crm.overviewPipeline.panel.inStageDays', { days }) }}
            <UTooltip v-if="stale" :text="t('crm.overviewPipeline.highlight.staleHintLane', { days: selection.lane.stale_days || OVERVIEW_STALE_DAYS, default: OVERVIEW_STALE_DAYS })" :ui="MULTILINE_TOOLTIP_UI">
              <UBadge class="ml-1" size="xs" variant="subtle" color="warning" icon="material-symbols:schedule-outline" :label="t('crm.overviewPipeline.panel.stale')" />
            </UTooltip>
          </dd>
          <template v-if="lostReasonLabel">
            <dt class="text-(--color-gray)">{{ t('crm.overviewPipeline.panel.lostReason') }}</dt>
            <dd>{{ lostReasonLabel }}</dd>
          </template>
        </dl>

        <p
          v-if="isOtherLane(selection.lane)"
          class="flex gap-2 rounded-lg border border-(--color-card-border) bg-(--color-light-gray-1) px-3 py-2 text-xs text-(--color-dark-gray)"
        >
          <UIcon name="material-symbols:help-outline" class="mt-px size-4 shrink-0" />
          {{ t('crm.overviewPipeline.panel.otherStageNote', { stage: overviewCardStage(selection.card, selection.lane, t) }) }}
        </p>

        <div>
          <p class="mb-2 text-xs font-semibold tracking-wide text-(--color-dark-gray) uppercase">{{ t('crm.overviewPipeline.panel.recentActivity') }}</p>
          <ul v-if="recentActivities.length" class="flex flex-col gap-2.5">
            <li v-for="activity in recentActivities" :key="activity.id" class="grid grid-cols-[1.75rem_1fr] gap-2 text-sm">
              <span class="grid size-7 place-items-center rounded-full bg-(--color-light-gray-1) text-(--color-dark-gray)">
                <UIcon :name="ACTIVITY_ICONS[activity.type]" class="size-4" />
              </span>
              <div class="min-w-0">
                <p class="truncate" :title="activity.subject">{{ activity.subject }}</p>
                <p class="text-xs text-(--color-gray)">{{ dateTimeFormat(activity.created_at) }}</p>
              </div>
            </li>
          </ul>
          <p v-else class="text-sm text-(--color-gray)">{{ t('crm.overviewPipeline.panel.noActivity') }}</p>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-1.5 p-4 sm:px-6">
      <div v-if="selection" class="flex w-full flex-wrap gap-2">
        <ButtonPrimary :label="t('crm.overviewPipeline.panel.logActivity')" icon="material-symbols:edit-note-outline" outline @click="activityOpen = true" />
        <ButtonPrimary :label="t('crm.overviewPipeline.panel.addTask')" icon="material-symbols:add-task" outline @click="taskOpen = true" />
        <ButtonPrimary
          v-if="canConvert"
          :label="selection.zone === 'prospect' ? t('crm.overviewPipeline.panel.convertToLead') : t('crm.overviewPipeline.panel.convertToDeal')"
          icon="material-symbols:arrow-forward"
          @click="onConvert"
        />
        <ButtonPrimary :label="t('crm.overviewPipeline.panel.openFullPage')" icon="material-symbols:open-in-new" outline @click="openFullPage" />
      </div>
    </div>
    </template>
  </USlideover>

  <CrmAddActivityModal v-model:open="activityOpen" @submit="onSubmitActivity" />
  <CrmAddTaskModal v-model:open="taskOpen" @submit="onSubmitTask" />
  <CrmConfirmDeleteModal
    v-model:open="convertConfirmOpen"
    :title="t('crm.overviewPipeline.panel.convertLeadTitle')"
    :body="t('crm.overviewPipeline.panel.convertLeadDescription')"
    :confirm-label="t('crm.overviewPipeline.panel.convertConfirm')"
    confirm-color="primary"
    @confirm="onConfirmConvertProspect"
  />
  <CrmLostReasonModal v-model:open="lostReasonOpen" @confirm="onConfirmLost" />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { lostReasonLabel as labelForLostReason } from '~/constants/mockData'
import { MULTILINE_TOOLTIP_UI, OVERVIEW_ZONES } from '~/constants/ui'
import { OVERVIEW_STALE_DAYS, daysInStage, isOtherLane, isStaleCard, overviewCardStage } from '~/composables/utils/usePipelineOverview'

const props = defineProps<{
  open: boolean
  selection: PipelineOverviewSelection | null
  // Every lane of the selected card's zone, for the Stage dropdown.
  zoneLanes: PipelineOverviewLane[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  // Something on the board changed (stage move, conversion); the page refetches.
  changed: []
}>()

const { t } = useI18n()
const { priceFormat, dateTimeFormat } = useFormatter()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const teamMembersStore = useTeamMembersStore()
const activitiesStore = useActivitiesStore()
const tasksStore = useTasksStore()
const dealsStore = useDealsStore()
const leadsStore = useLeadsStore()
const prospectsStore = useProspectsStore()

// The dialog's accessible name/description (rendered visually hidden — the
// visible header shows the same facts in its own layout).
const dialogTitle = computed(() => (props.selection ? props.selection.card.name || `#${props.selection.card.id}` : t('crm.overviewPipeline.panel.dialogTitle')))
const dialogDescription = computed(() => (props.selection ? `${t(`crm.overviewPipeline.panel.kind.${props.selection.zone}`)} · #${props.selection.card.id}` : undefined))

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  call: 'material-symbols:call-outline',
  email: 'material-symbols:mail-outline',
  meeting: 'material-symbols:groups-outline',
  note: 'material-symbols:sticky-note-2-outline',
}

const days = computed(() => (props.selection ? daysInStage(props.selection.card) : 0))
const stale = computed(() => !!props.selection && !props.selection.lane.terminal && isStaleCard(props.selection.card, props.selection.lane.stale_days))
const lostReasonLabel = computed(() => {
  const reason = props.selection?.card.lost_reason
  return reason ? labelForLostReason(reason) : ''
})

// Prospect → Lead → Deal trail. `from_prospect` is the only lineage the API
// reports, so a record that started as a Prospect shows the full trail up to
// its own step (a Deal from a Prospect necessarily went through a Lead), and
// anything else shows just its own step.
const lineage = computed<PipelineOverviewZoneKey[]>(() => {
  if (!props.selection) return []
  const { zone, card } = props.selection
  const funnel: PipelineOverviewZoneKey[] = ['prospect', 'lead', 'deal']
  return card.from_prospect ? funnel.slice(0, funnel.indexOf(zone) + 1) : [zone]
})

// "Converted" is system-set by Convert only, and the "other" lane isn't a
// stage at all, so neither can be picked by hand.
const stageOptions = computed<Select[]>(() => props.zoneLanes
  .filter(lane => lane.kind !== 'converted' && !isOtherLane(lane))
  .map(lane => ({ label: lane.name, value: lane.name })))
// A card in the "other" lane has no valid stage to preselect.
const currentStage = computed(() => {
  const lane = props.selection?.lane
  return !lane || isOtherLane(lane) ? '' : lane.name
})

const canConvert = computed(() => {
  if (!props.selection || props.selection.lane.terminal) return false
  return props.selection.zone === 'prospect' || props.selection.zone === 'lead'
})

const relatedType = computed<ActivityRelatedType | null>(() => props.selection?.zone ?? null)
const recentActivities = computed(() => {
  if (!props.selection || !relatedType.value) return []
  return activitiesStore.forRelated(relatedType.value, props.selection.card.id)
    .slice()
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, 5)
})

watch(() => [props.open, props.selection?.zone, props.selection?.card.id] as const, ([isOpen, zone, id]) => {
  if (isOpen && zone && id) activitiesStore.fetchForRelated(zone, id).catch(notifyApiError)
}, { immediate: true })

const moving = ref(false)
const moveTo = async (zone: PipelineOverviewZoneKey, id: number, stage: string, lostReason?: LostReason) => {
  if (zone === 'deal') await dealsStore.updateStage(id, stage as DealStage, undefined, lostReason)
  else if (zone === 'lead') await leadsStore.updateStatus(id, stage as LeadStatus)
  else await prospectsStore.updateStatus(id, stage)
}

// Moving a Deal into a Lost stage asks why first — the reason is what a
// review wants to know about a loss, and the quick-move wouldn't otherwise
// record one.
const lostReasonOpen = ref(false)
const pendingLostStage = ref<string | null>(null)
const onChangeStage = (stage: string) => {
  const current = props.selection
  if (!current || !stage || stage === currentStage.value || moving.value) return
  if (current.zone === 'deal' && props.zoneLanes.find(l => l.name === stage)?.kind === 'lost') {
    pendingLostStage.value = stage
    lostReasonOpen.value = true
    return
  }
  performMove(stage)
}
const onConfirmLost = async (reason: LostReason) => {
  if (!pendingLostStage.value) return
  const stage = pendingLostStage.value
  pendingLostStage.value = null
  await performMove(stage, reason)
}

const performMove = async (stage: string, reason?: LostReason) => {
  const current = props.selection
  if (!current) return
  const { zone, card } = current
  // Moving out of the "other" lane fixes an invalid/blank stage, so there's
  // nothing valid to undo back to.
  const from = isOtherLane(current.lane) ? null : current.lane.name
  moving.value = true
  try {
    await moveTo(zone, card.id, stage, reason)
    emit('changed')
    success(t('crm.overviewPipeline.panel.movedTo', { stage }), from === null
      ? undefined
      : {
          label: t('crm.overviewPipeline.panel.undo'),
          onClick: async () => {
            try {
              await moveTo(zone, card.id, from)
              emit('changed')
            } catch (err) {
              error(getApiErrorMessage(err, t('global.genericError')))
            }
          },
        })
  } catch (err) {
    if (apiErrorHasFieldCode(err, 'stage', 'requires_signed_contract')) {
      error(t('crm.deals.detail.contractRequiredToast'))
    } else {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  } finally {
    moving.value = false
  }
}

const activityOpen = ref(false)
const onSubmitActivity = async (payload: { type: ActivityType, subject: string, notes: string, created_at?: string }) => {
  if (!props.selection) return
  try {
    await activitiesStore.add({
      type: payload.type,
      subject: payload.subject,
      notes: payload.notes,
      created_at: payload.created_at,
      related_type: props.selection.zone,
      related_id: props.selection.card.id,
    })
    success(t('crm.overviewPipeline.panel.activityLogged'))
  } catch (err) {
    notifyApiError(err)
  }
}

const taskOpen = ref(false)
const onSubmitTask = async (payload: { title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null }) => {
  if (!props.selection) return
  try {
    await tasksStore.add({ ...payload, related_type: props.selection.zone, related_id: props.selection.card.id })
    success(t('crm.overviewPipeline.panel.taskAdded'))
  } catch (err) {
    notifyApiError(err)
  }
}

// Prospect → Lead converts in place after a confirm, like the Prospect
// detail page. Lead → Deal opens the Deal create form prefilled from the
// Lead, like the Lead detail page, since a Deal needs a value and contact
// that a single click can't supply.
const convertConfirmOpen = ref(false)
const onConvert = () => {
  if (!props.selection) return
  if (props.selection.zone === 'prospect') {
    convertConfirmOpen.value = true
    return
  }
  navigateTo(`/crm/deals/create?lead_id=${props.selection.card.id}`)
}
const onConfirmConvertProspect = async () => {
  if (!props.selection) return
  try {
    const { lead } = await prospectsStore.convert(props.selection.card.id, {})
    leadsStore.receiveConverted(lead)
    success(t('crm.overviewPipeline.panel.convertedToLead'))
    emit('update:open', false)
    emit('changed')
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    convertConfirmOpen.value = false
  }
}

const openFullPage = () => {
  if (!props.selection) return
  navigateTo(`${OVERVIEW_ZONES[props.selection.zone].path}/${props.selection.card.id}`)
}
</script>
