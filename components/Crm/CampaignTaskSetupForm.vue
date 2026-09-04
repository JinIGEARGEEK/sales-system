<template>
  <div class="flex flex-col gap-4">
    <h3 v-if="setupHeading" class="text-base font-semibold">{{ setupHeading }}</h3>
    <Form ref="formRef">
      <div class="grid grid-cols-1 gap-3">
        <InputText
          v-model="form.name"
          :label="t('crm.components.createCampaignModal.campaignName')"
          :placeholder="t('crm.components.createCampaignModal.campaignNamePlaceholder')"
          name="name"
          rules="required"
          data-cy="campaign-name-input"
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
        {{ t('crm.components.createCampaignModal.reviewSummary', { count: companyIds.length, date: dueDateDisplay, name: assignedToName }) }}
      </p>
      <div class="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-[var(--color-light-gray-2)] p-3">
        <UBadge v-for="name in companyNames" :key="name" color="neutral" variant="subtle">{{ name }}</UBadge>
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
const { notifyApiError } = useApiErrorNotifier()

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const props = withDefaults(defineProps<{
  // Ids of every Company this campaign's Tasks will be created against —
  // the caller (pages/crm/campaigns/new.vue's step 1 matches, or the
  // Companies list's row bulk-selection) owns resolving these; this
  // component only displays the count/names and builds the rest of the
  // submit payload around them.
  companyIds: number[]
  companyNames: string[]
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

const emit = defineEmits<{
  submit: [payload: { name: string, title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null }]
}>()

const moreOptionsOpen = ref(false)

const emptyForm = () => ({
  name: props.nameDefault,
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
    emit('submit', {
      name: form.name,
      title: form.title,
      description: form.description,
      due_date: new Date(form.due_date),
      priority: form.priority as TaskPriority,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
    })
  })
}

defineExpose({ submit })
</script>
