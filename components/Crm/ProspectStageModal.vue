<template>
  <UModal :open="open" :title="stage ? t('admin.pipelineConfig.prospectStages.editTitle') : t('admin.pipelineConfig.prospectStages.addTitle')" @update:open="onUpdateOpen">
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputText v-model="form.name" :label="t('admin.pipelineConfig.prospectStages.name')" name="name" rules="required" />
          <InputText v-model.number="form.sort_order" type="number" :label="t('admin.pipelineConfig.prospectStages.sortOrder')" name="sort_order" rules="required" />
          <!-- Optional per-stage stale threshold for the Overview Pipeline
          (FR-CRM-123); empty means the 14-day default. -->
          <!-- Hidden on a closed (terminal) stage, which is never stale. -->
          <div v-if="!form.is_disqualified_stage" class="flex flex-col gap-1">
            <InputText
              v-model="form.stale_days"
              type="number"
              :label="t('admin.pipelineConfig.staleDays')"
              :placeholder="t('admin.pipelineConfig.staleDaysPlaceholder')"
              name="stale_days"
              rules="integer|min_value:1|max_value:365"
            />
            <p class="text-xs text-(--color-gray)">{{ t('admin.pipelineConfig.staleDaysHint') }}</p>
          </div>
          <div class="flex flex-col gap-2">
            <UCheckbox v-model="form.is_disqualified_stage" :label="t('admin.pipelineConfig.prospectStages.isDisqualifiedStage')" />
            <UCheckbox v-model="form.is_active" :label="t('admin.pipelineConfig.stages.isActive')" />
          </div>
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('admin.pipelineConfig.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('admin.pipelineConfig.save')" :loading="loading" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { error } = useNotify()

const props = defineProps<{
  open: boolean
  // Passing an existing ProspectStage switches this into edit mode.
  stage?: ProspectStage | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { name: string, sort_order: number, is_active: boolean, is_disqualified_stage: boolean, stale_days: number | null }]
}>()

const emptyForm = () => ({
  name: props.stage?.name ?? '',
  sort_order: props.stage?.sort_order ?? 0,
  is_active: props.stage?.is_active ?? true,
  // Kept as text in the form so an empty field means "use the default".
  stale_days: props.stage?.stale_days ? String(props.stage.stale_days) : '',
  is_disqualified_stage: props.stage?.is_disqualified_stage ?? false,
})

const { form, formRef, validateThenSubmit, loading, guard, guardDismiss } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = guardDismiss((value: boolean) => emit('update:open', value))

// "Converted" is a reserved, system-set stage (see ProspectStage's own doc)
// — the backend rejects it too, but catching it here avoids a round trip
// for a mistake that's cheap to catch client-side.
// Awaits the caller's save: Save spins until it lands, the guard turns away
// a second click, and the dialog stays open (form intact) if the handler
// resolves `false` or throws.
const submitAndClose = useAwaitableSubmit(() => onUpdateOpen(false))
const onSubmit = guard(async () => {
  if (form.name.trim() === 'Converted') {
    error(t('admin.pipelineConfig.prospectStages.reservedNameError'))
    return
  }
  await submitAndClose({ ...form, stale_days: form.stale_days === '' ? null : Number(form.stale_days) })
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
