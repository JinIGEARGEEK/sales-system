<template>
  <UCard v-bind="$attrs" :ui="GLASS_PANEL_UI">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t(`${i18nPrefix}.heading`) }}</h3>
        <ButtonPrimary
          :label="t(`${i18nPrefix}.${addLabelKey}`)"
          icon="material-symbols:add"
          small
          fit-content
          @click="openAdd"
        />
      </div>
    </template>

    <TableData
      :columns="columns"
      :rows="rows"
      :total="rows.length"
      :total-page="1"
      :per-page="rows.length || 1"
      :page="1"
      :loading="loading"
      @edit="onEdit"
      @delete="requestDeactivate"
    />
  </UCard>

  <CrmOptionModal
    v-model:open="modalOpen"
    :i18n-prefix="i18nPrefix"
    :option="editing"
    @submit="onSubmit"
  />
  <CrmConfirmDeleteModal
    v-model:open="deactivateOpen"
    :title="t('admin.pipelineConfig.deactivate')"
    :body="t(`${i18nPrefix}.deactivateConfirm`)"
    :confirm-label="t('admin.pipelineConfig.deactivate')"
    confirm-color="warning"
    @confirm="confirmDeactivate"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { GLASS_PANEL_UI } from '~/constants/ui'

// Generic Pipeline Config card for an Admin-configurable "name + active"
// list (Lead/Prospect sources, Industries, Company/Revenue sizes, Job
// titles, Product categories): a table of the options with add / edit /
// deactivate. These were seven ~117-line copies of the same file; the
// per-list wrappers (e.g. CompanySizesPanel.vue) now just pick the store
// and i18n namespace.
//
// `store` is any of the option stores — they share this exact shape.
// `remove` is a *soft* delete (the API flips `is_active` to false), hence
// "Deactivate" rather than "Delete" in the UI.
interface NamedOption {
  id: number
  name: string
  is_active: boolean
}
type NamedOptionPayload = { name: string, is_active: boolean }

interface NamedOptionStore {
  items: NamedOption[]
  add: (payload: NamedOptionPayload) => Promise<unknown>
  update: (id: number, payload: NamedOptionPayload) => Promise<unknown>
  remove: (id: number) => Promise<unknown>
}

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  loading: boolean
  store: NamedOptionStore
  // Locale namespace with this list's heading/addTitle/editTitle/name/
  // saveSuccess/deactivateConfirm/deactivateSuccess/columns.* strings,
  // e.g. 'admin.pipelineConfig.companySizes'.
  i18nPrefix: string
  // Key (under i18nPrefix) of the header's "Add ..." button label — it
  // differs per list ('addSize', 'addIndustry', 'addSource', ...).
  addLabelKey: string
}>()

const { t } = useI18n()
const { success, error } = useNotify()
const { toBadge } = useFormatter()

const modalOpen = ref(false)
const editing = ref<NamedOption | null>(null)

const openAdd = () => {
  editing.value = null
  modalOpen.value = true
}
const onEdit = (row: NamedOption) => {
  editing.value = props.store.items.find(item => item.id === row.id) || null
  modalOpen.value = true
}

const onSubmit = async (payload: NamedOptionPayload) => {
  try {
    if (editing.value) {
      await props.store.update(editing.value.id, payload)
    } else {
      await props.store.add(payload)
    }
    success(t(`${props.i18nPrefix}.saveSuccess`))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deactivateOpen, target: deactivateTarget, requestDelete: requestDeactivate, closeDelete: closeDeactivate } = useDeleteConfirm<NamedOption>()
const confirmDeactivate = async () => {
  if (deactivateTarget.value) {
    try {
      await props.store.remove(deactivateTarget.value.id)
      success(t(`${props.i18nPrefix}.deactivateSuccess`))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivate()
}

const rows = computed(() => props.store.items.map(item => ({
  ...item,
  statusBadge: item.is_active
    ? toBadge(t('admin.pipelineConfig.statusActive'), 'success')
    : toBadge(t('admin.pipelineConfig.statusInactive')),
})))

const columns = computed<TableDataColumn[]>(() => [
  { label: t(`${props.i18nPrefix}.columns.name`), align: 'left', field: 'name' },
  { label: t(`${props.i18nPrefix}.columns.status`), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t(`${props.i18nPrefix}.columns.action`),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.pipelineConfig.edit'), emitName: 'edit', isBorderBottom: true },
      { label: t('admin.pipelineConfig.deactivate'), emitName: 'delete', isBorderBottom: false },
    ],
  },
])
</script>
