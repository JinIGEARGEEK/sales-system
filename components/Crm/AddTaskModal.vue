<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.components.addTaskModal.title') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef">
        <div class="grid grid-cols-1 gap-3">
          <InputText v-model="form.title" :label="t('crm.components.addTaskModal.taskTitle')" name="title" rules="required" />
          <div>
            <InputDatePicker v-model="form.due_date" :label="t('crm.components.addTaskModal.dueDate')" name="due_date" rules="required" />
            <div class="mt-1.5 flex gap-1.5">
              <UButton
                v-for="preset in DUE_DATE_PRESETS"
                :key="preset.days"
                :label="t(`crm.components.addTaskModal.${preset.labelKey}`)"
                size="xs"
                variant="outline"
                color="neutral"
                @click="applyDueDatePreset(preset.days)"
              />
            </div>
          </div>
          <CrmTeamMemberSelect v-model="form.assigned_to" name="assigned_to" />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addTaskModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addTaskModal.save')" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [task: { title: string, due_date: Date, assigned_to: number | null }]
}>()

const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)

const DUE_DATE_PRESETS = [
  { labelKey: 'dueToday', days: 0 },
  { labelKey: 'dueTomorrow', days: 1 },
  { labelKey: 'dueNextWeek', days: 7 },
]

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10)

const applyDueDatePreset = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  form.due_date = toDateInputValue(date)
}

const emptyForm = () => ({
  title: '',
  due_date: '',
  assigned_to: '',
})

const form = reactive(emptyForm())

const onUpdateOpen = (value: boolean) => emit('update:open', value)

// Reset on open, not close — the next open is always a blank form, whichever
// button triggered it.
watch(() => props.open, (value) => {
  if (value) Object.assign(form, emptyForm())
})

// The footer's Save button lives outside the <Form>'s own slot, and vee-validate's
// Form component doesn't expose submitForm() on its template ref — only validate()
// and the field setters — so trigger validation manually before submitting.
const onSave = async () => {
  const result = await formRef.value?.validate()
  if (!result?.valid) return

  emit('submit', {
    title: form.title,
    due_date: new Date(form.due_date),
    assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
  })
  onUpdateOpen(false)
}
</script>
