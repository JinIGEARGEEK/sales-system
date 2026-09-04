<template>
  <div class="flex flex-col gap-4">
    <h3 v-if="setupHeading" class="text-base font-semibold">{{ setupHeading }}</h3>
    <Form ref="formRef">
      <div class="grid grid-cols-1 gap-3">
        <CrmStatusPill v-model="form.mode" :options="modeOptions" data-cy="campaign-mode-toggle" />
        <template v-if="form.mode === 'new'">
          <InputText
            v-model="form.name"
            :label="t('crm.components.createCampaignModal.campaignName')"
            :placeholder="t('crm.components.createCampaignModal.campaignNamePlaceholder')"
            name="name"
            rules="required"
            data-cy="campaign-name-input"
          />
          <InputSelect
            v-if="typeOptions.length > 1"
            v-model="form.type"
            :options="typeSelectOptions"
            :label="t('crm.components.createCampaignModal.campaignType')"
            name="type"
            rules="required"
            data-cy="campaign-type-select"
          />
        </template>
        <InputSelect
          v-else
          v-model="form.campaignId"
          :options="existingCampaignOptions"
          :label="t('crm.components.createCampaignModal.existingCampaign')"
          :placeholder="t('crm.components.createCampaignModal.existingCampaignPlaceholder')"
          name="campaignId"
          rules="required"
          data-cy="campaign-existing-select"
        />
        <InputText
          v-model="form.title"
          :label="t('crm.components.createCampaignModal.message')"
          :placeholder="t('crm.components.createCampaignModal.messagePlaceholder')"
          name="title"
          rules="required"
          data-cy="campaign-message-input"
        />
        <InputDatePicker
          v-model="form.due_date"
          :label="t('crm.components.createCampaignModal.dueDate')"
          name="due_date"
          rules="required"
          data-cy="campaign-due-date-input"
        />
        <CrmTeamMemberSelect
          v-model="form.assigned_to"
          :label="t('crm.components.createCampaignModal.assignedTo')"
          name="assigned_to"
        />

        <UCollapsible v-model:open="moreOptionsOpen">
          <button
            type="button"
            class="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]"
            data-cy="campaign-more-options-toggle"
          >
            <UIcon :name="moreOptionsOpen ? 'material-symbols:expand-less' : 'material-symbols:expand-more'" />
            {{ t('crm.components.createCampaignModal.moreOptions') }}
          </button>
          <template #content>
            <div class="grid grid-cols-1 gap-3 pt-3">
              <InputSelect
                v-model="form.priority"
                :options="TASK_PRIORITY_OPTIONS"
                :label="t('crm.components.addTaskModal.priority')"
                name="priority"
                rules="required"
                data-cy="campaign-priority-select"
              />
              <InputTextarea
                v-model="form.description"
                :label="t('crm.components.addTaskModal.description')"
                name="description"
                data-cy="campaign-description-input"
              />
            </div>
          </template>
        </UCollapsible>
      </div>
    </Form>

    <div>
      <h3 v-if="reviewHeading" class="mb-2 text-base font-semibold">{{ reviewHeading }}</h3>
      <p class="text-sm text-[var(--color-black)]">
        {{ t('crm.components.createCampaignModal.reviewSummary', { count: targets.length, date: dueDateDisplay, name: assignedToName }) }}
      </p>
      <div class="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-[var(--color-light-gray-2)] p-3">
        <UBadge v-for="target in targets" :key="`${target.type}-${target.id}`" color="neutral" variant="subtle">{{ target.name }}</UBadge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TASK_PRIORITY_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()
const { dateFormat } = useFormatter()
const teamMembersStore = useTeamMembersStore()
const campaignsStore = useCampaignsStore()
const { notifyApiError } = useApiErrorNotifier()

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
  if (campaignsStore.items.length === 0) campaignsStore.fetchAll().catch(notifyApiError)
})

const props = withDefaults(defineProps<{
  // Every target this campaign's Tasks will be created against — the caller
  // (pages/crm/campaigns/new.vue's step 1 matches, or a list page's
  // bulk-selection / single-row action) owns resolving these; this
  // component only displays the count/names and builds the rest of the
  // submit payload around them.
  targets: CampaignTarget[]
  // Which CampaignType values 'new' mode may create against — the caller
  // decides based on what entity/team is creating the campaign (e.g.
  // Companies offers win_back + upsell, Leads/Contacts offer only
  // new_channel). The type select only renders when there's an actual
  // choice to make; a single-value list is applied silently.
  typeOptions: CampaignType[]
  // Mirrors useModalForm's `isOpen` semantics: flipping this false→true
  // resets the form to its defaults. A modal host passes its own `open`
  // prop through; a full-page host (new.vue, mounted once) can leave the
  // default `true` since the initial defaults below already apply once.
  active?: boolean
  nameDefault?: string
  dueDateDefault?: string
  assignedToDefault?: string
  // Optional section headings — the Companies-list bulk-select modal
  // leaves these unset (a modal header already frames the whole form), the
  // guided new.vue page passes its own step 2/3 heading text so this one
  // component reads consistently in both hosts.
  setupHeading?: string
  reviewHeading?: string
}>(), {
  active: true,
  nameDefault: '',
  dueDateDefault: '',
  assignedToDefault: '',
  setupHeading: '',
  reviewHeading: '',
})

// The caller decides whether this creates a brand-new Campaign or appends
// Tasks to one that already exists — see CampaignTaskSetupSubmitPayload in
// interfaces/crm.d.ts: 'new' emits `name`, 'existing' emits `campaignId`,
// everything else is identical either way.
const emit = defineEmits<{
  submit: [payload: CampaignTaskSetupSubmitPayload]
}>()

const moreOptionsOpen = ref(false)

const modeOptions = computed<Select[]>(() => [
  { label: t('crm.components.createCampaignModal.modeNew'), value: 'new' },
  { label: t('crm.components.createCampaignModal.modeExisting'), value: 'existing' },
])
// Deliberately unfiltered — every campaign is selectable regardless of type
// or which team created it, since campaigns are shared across teams.
const existingCampaignOptions = computed<Select[]>(() =>
  campaignsStore.items.map(c => ({ label: c.name, value: String(c.id) })),
)
const typeSelectOptions = computed<Select[]>(() =>
  props.typeOptions.map(type => ({ label: t(`crm.campaigns.index.type.${type}`), value: type })),
)

const emptyForm = () => ({
  mode: 'new' as 'new' | 'existing',
  name: props.nameDefault,
  type: (props.typeOptions[0] ?? 'win_back') as CampaignType,
  campaignId: '',
  title: '',
  description: '',
  priority: 'medium' as TaskPriority,
  due_date: props.dueDateDefault,
  assigned_to: props.assignedToDefault,
})

const { form, formRef, validateThenSubmit } = useModalForm(() => props.active, emptyForm)

const dueDateDisplay = computed(() => (form.due_date ? dateFormat(form.due_date) : '-'))
const assignedToName = computed(() => teamMembersStore.nameById(form.assigned_to ? Number(form.assigned_to) : null))

const submit = () => {
  validateThenSubmit(() => {
    const common = {
      title: form.title,
      description: form.description,
      due_date: new Date(form.due_date),
      priority: form.priority as TaskPriority,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
    }
    emit('submit', form.mode === 'existing'
      ? { mode: 'existing', campaignId: Number(form.campaignId), ...common }
      : { mode: 'new', name: form.name, type: form.type, ...common })
  })
}

defineExpose({ submit })
</script>
