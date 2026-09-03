<template>
  <div class="flex items-end gap-2">
    <div class="min-w-0 flex-1">
      <InputSelect
        v-model="modelValueProxy"
        :options="options"
        :label="businessUnit === 'Project' ? t('crm.components.businessUnitItemField.project') : t('crm.components.businessUnitItemField.product')"
        :placeholder="t('crm.components.businessUnitItemField.placeholder')"
        name="business_unit_item"
        :disable="options.length === 0"
      />
    </div>
    <UTooltip
      v-if="businessUnit === 'Project'"
      :text="companyId ? t('crm.components.businessUnitItemField.addProjectHint') : t('crm.components.businessUnitItemField.addProjectNeedsCompanyHint')"
    >
      <UButton
        icon="material-symbols:add"
        variant="outline"
        color="neutral"
        :disabled="!companyId"
        :aria-label="t('crm.components.businessUnitItemField.addProjectHint')"
        @click="openAddProject"
      />
    </UTooltip>
  </div>

  <CrmAddProjectModal
    v-model:open="addProjectOpen"
    :company-id="companyId"
    @submit="onSubmitProject"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  modelValue: string
  // The Business Unit currently selected on the parent form — the "+ create"
  // button only makes sense (and only renders) for 'Project'; a Product
  // comes from the Admin-managed catalog, not ad hoc creation here.
  businessUnit: string
  companyId: number | null
  options: Select[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const modelValueProxy = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// This field only ever creates a Project (never edits one), so the
// composable's edit-path message key is unreachable here — same key passed
// for both is fine.
const { open: addProjectOpen, openAdd: openAddProjectModal, onSave: onSaveProject } = useProjectModal(
  computed(() => props.companyId),
  'crm.components.businessUnitItemField.addProjectSuccess',
  'crm.components.businessUnitItemField.addProjectSuccess',
)

const openAddProject = () => {
  if (!props.companyId) return
  openAddProjectModal()
}

// Selects the newly-created Project immediately, same as picking an existing
// one from the dropdown — closes the loop on "create it right from here"
// instead of leaving the rep to reopen the (now-updated) dropdown and pick it.
const onSubmitProject = async (payload: {
  status: ProjectStatus
  production_reference: string | null
  name?: string
  target_end_date?: Date | null
  notes?: string
  company_id?: number
  deal_id?: number | null
}) => {
  const created = await onSaveProject(payload)
  if (created) emit('update:modelValue', created.name)
}
</script>
