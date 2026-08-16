<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.components.addAttachmentModal.title') }}</h3>
    </template>
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex gap-2">
          <ButtonPrimary :label="t('crm.components.addAttachmentModal.uploadTab')" :outline="mode !== 'file'" small fit-content @click="mode = 'file'" />
          <ButtonPrimary :label="t('crm.components.addAttachmentModal.linkTab')" :outline="mode !== 'link'" small fit-content @click="mode = 'link'" />
        </div>

        <Form ref="formRef" @submit="onSubmit">
          <div class="grid grid-cols-1 gap-3">
            <InputSelect v-model="form.category" :options="categoryOptions" :label="t('crm.components.addAttachmentModal.category')" name="category" rules="required" />

            <template v-if="mode === 'file'">
              <label
                class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--color-light-gray-2)] p-6 text-center hover:bg-[var(--color-light-gray-1)]"
              >
                <UIcon name="material-symbols:upload-file-outline" class="size-8 text-[var(--color-gray)]" />
                <span class="text-sm font-medium">{{ fileName || t('crm.components.addAttachmentModal.chooseFile') }}</span>
                <span class="text-xs text-[var(--color-gray)]">{{ t('crm.components.addAttachmentModal.acceptedFormats') }}</span>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv" class="hidden" @change="onFileChange" >
              </label>
              <p v-if="fileError" class="text-xs text-[var(--color-danger-toast)]">{{ fileError }}</p>
            </template>

            <template v-else>
              <InputText v-model="form.file_name" :label="t('crm.components.addAttachmentModal.linkName')" name="file_name" rules="required" />
              <InputText v-model="form.external_url" :label="t('crm.components.addAttachmentModal.linkUrl')" name="external_url" rules="required" />
            </template>
          </div>
        </Form>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addAttachmentModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addAttachmentModal.save')" @click="onSave" />
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
  submit: [payload: { category: AttachmentCategory, file: File } | { category: AttachmentCategory, fileName: string, externalUrl: string }]
}>()

const mode = ref<'file' | 'link'>('file')
const selectedFile = ref<File | null>(null)
const fileName = ref('')
const fileError = ref('')

const categoryOptions = computed(() => ([
  { label: t('crm.components.addAttachmentModal.categories.quotation'), value: 'Quotation' },
  { label: t('crm.components.addAttachmentModal.categories.proposal'), value: 'Proposal' },
  { label: t('crm.components.addAttachmentModal.categories.estimation'), value: 'Estimation' },
  { label: t('crm.components.addAttachmentModal.categories.plan'), value: 'Plan' },
  { label: t('crm.components.addAttachmentModal.categories.support'), value: 'Support' },
  { label: t('crm.components.addAttachmentModal.categories.other'), value: 'Other' },
]))

const emptyForm = () => ({
  category: 'Quotation' as AttachmentCategory,
  file_name: '',
  external_url: '',
})

const { form, formRef, validateThenSubmit } = useModalForm(() => props.open, emptyForm)

watch(() => props.open, (value) => {
  if (value) {
    mode.value = 'file'
    selectedFile.value = null
    fileName.value = ''
    fileError.value = ''
  }
})

const onUpdateOpen = (value: boolean) => emit('update:open', value)

// Mirrors the backend's 10 MB cap (utils.MaxUploadSize) so an oversized file
// is rejected client-side instead of round-tripping to get a 413.
const MAX_FILE_SIZE = 10 * 1024 * 1024

const onFileChange = (event: Event) => {
  fileError.value = ''
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > MAX_FILE_SIZE) {
    fileError.value = t('crm.components.addAttachmentModal.fileTooLarge')
    selectedFile.value = null
    fileName.value = ''
    return
  }
  selectedFile.value = file
  fileName.value = file.name
}

const onSubmit = () => {
  if (mode.value === 'file') {
    if (!selectedFile.value) {
      fileError.value = t('crm.components.addAttachmentModal.fileRequired')
      return
    }
    emit('submit', { category: form.category, file: selectedFile.value })
  } else {
    emit('submit', { category: form.category, fileName: form.file_name, externalUrl: form.external_url })
  }
  onUpdateOpen(false)
}

const onSave = () => validateThenSubmit(onSubmit)
</script>
