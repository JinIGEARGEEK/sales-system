<template>
  <div class="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-light-gray-2)] bg-white p-3 shadow-xl">
    <span class="text-sm font-medium text-[var(--color-black)]">
      {{ t('crm.components.bulkActionBar.selectedCount', { count: selectedIds.length, entity: entityLabel }) }}
    </span>

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
    <ButtonPrimary cancel small fit-content :label="t('crm.components.bulkActionBar.cancel')" @click="emit('cancel')" />

    <CrmConfirmDeleteModal
      v-model:open="archiveOpen"
      :title="t('crm.components.bulkActionBar.archiveConfirmTitle', { count: selectedIds.length, entity: entityLabel })"
      :body="t('crm.components.bulkActionBar.archiveConfirmBody', { count: selectedIds.length, entity: entityLabel })"
      :confirm-label="t('crm.components.bulkActionBar.archiveConfirmButton')"
      confirm-color="error"
      @confirm="confirmArchive"
    />
  </div>
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
const teamMembersStore = useTeamMembersStore()

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll()
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
