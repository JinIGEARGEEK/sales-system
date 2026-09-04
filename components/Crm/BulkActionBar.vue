<template>
  <CrmBulkActionBarShell :selected-ids="selectedIds" :entity-label="entityLabel" @cancel="emit('cancel')">
    <UPopover v-model:open="reassignOpen">
      <ButtonPrimary outline small fit-content :label="t('crm.components.bulkActionBar.reassign')" />
      <template #content>
        <div class="flex w-64 flex-col gap-3 p-3">
          <InputSelect
            v-model="reassignTo"
            name="bulkReassignTo"
            :options="teamMembersStore.filterOptions.filter(o => o.value !== 'all')"
            :placeholder="t('crm.components.bulkActionBar.reassignPlaceholder')"
          />
          <ButtonPrimary small block :label="t('crm.components.bulkActionBar.reassignApply')" @click="applyReassign" />
        </div>
      </template>
    </UPopover>

    <UPopover v-model:open="tagOpen">
      <ButtonPrimary outline small fit-content :label="t('crm.components.bulkActionBar.tag')" />
      <template #content>
        <div class="flex w-72 flex-col gap-3 p-3">
          <InputText
            v-model="tagInput"
            name="bulkTagInput"
            :placeholder="t('crm.components.bulkActionBar.tagPlaceholder')"
          />
          <URadioGroup
            v-model="tagMode"
            :items="[
              { label: t('crm.components.bulkActionBar.tagModeAdd'), value: 'add' },
              { label: t('crm.components.bulkActionBar.tagModeSet'), value: 'set' },
            ]"
          />
          <ButtonPrimary small block :label="t('crm.components.bulkActionBar.tagApply')" @click="applyTag" />
        </div>
      </template>
    </UPopover>

    <ButtonPrimary outline small fit-content color="error" :label="t('crm.components.bulkActionBar.archive')" @click="requestArchive" />

    <CrmConfirmDeleteModal
      v-model:open="archiveOpen"
      :title="t('crm.components.bulkActionBar.archiveConfirmTitle', { count: selectedIds.length, entity: entityLabel })"
      :body="t('crm.components.bulkActionBar.archiveConfirmBody', { count: selectedIds.length, entity: entityLabel })"
      :confirm-label="t('crm.components.bulkActionBar.archiveConfirmButton')"
      confirm-color="error"
      @confirm="confirmArchive"
    />
  </CrmBulkActionBarShell>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  selectedIds: number[]
  // Plural noun used in "N <entityLabel> selected" copy, e.g. "deals" / "leads".
  entityLabel: string
}>()

const emit = defineEmits<{
  reassign: [assignedTo: number | null]
  tag: [payload: { tags: string[], mode: 'add' | 'set' }]
  archive: []
  cancel: []
}>()

const { parseTags } = useFormatter()
const { notifyApiError } = useApiErrorNotifier()
const teamMembersStore = useTeamMembersStore()

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const reassignOpen = ref(false)
const reassignTo = ref<string | null>(null)

const applyReassign = () => {
  if (reassignTo.value === null) return
  const assignedTo = reassignTo.value === 'unassigned' ? null : Number(reassignTo.value)
  emit('reassign', assignedTo)
  reassignOpen.value = false
  reassignTo.value = null
}

const tagOpen = ref(false)
const tagInput = ref('')
const tagMode = ref<'add' | 'set'>('add')

const applyTag = () => {
  const tags = parseTags(tagInput.value)
  if (tags.length === 0) return
  emit('tag', { tags, mode: tagMode.value })
  tagOpen.value = false
  tagInput.value = ''
  tagMode.value = 'add'
}

const archiveOpen = ref(false)

const requestArchive = () => {
  if (props.selectedIds.length === 0) return
  archiveOpen.value = true
}

const confirmArchive = () => {
  emit('archive')
  archiveOpen.value = false
}
</script>
