<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('admin.activityLog.title') }}</h2>
        <p class="text-sm text-[var(--color-gray)]">{{ dateFormat(new Date().toISOString()) }}</p>
      </div>
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="w-full sm:w-48">
        <InputSelect
          v-model="entityTypeFilter"
          :options="entityTypeOptions"
          :placeholder="t('admin.activityLog.typePlaceholder')"
          name="entityTypeFilter"
        />
      </div>
    </UCard>

    <TableData
      v-model:page="page"
      :columns="columns"
      :rows="filteredEntries"
      :total="filteredEntries.length"
      :total-page="totalPage"
      :per-page="perPage"
      @change-page="onChangePage"
      @change-per-page="onChangePerPage"
      @view-detail="onViewDetail"
    />

    <UModal v-model:open="detailOpen">
      <template #header>
        <h3 class="text-lg font-medium">{{ t('admin.activityLog.detail.title') }}</h3>
      </template>
      <template #body>
        <div v-if="selectedEntry" class="flex flex-col gap-4 text-sm">
          <div>
            <p class="mb-1 text-xs text-[var(--color-gray)]">{{ t('admin.activityLog.detail.before') }}</p>
            <pre class="overflow-x-auto rounded-lg bg-[var(--color-light-gray-1)] p-3 text-xs">{{ JSON.stringify(selectedEntry.before, null, 2) }}</pre>
          </div>
          <div>
            <p class="mb-1 text-xs text-[var(--color-gray)]">{{ t('admin.activityLog.detail.after') }}</p>
            <pre class="overflow-x-auto rounded-lg bg-[var(--color-light-gray-1)] p-3 text-xs">{{ JSON.stringify(selectedEntry.after, null, 2) }}</pre>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('admin.activityLog.title') })

const { $api } = useNuxtApp()
const { dateFormat, dateTimeFormat, toBadge } = useFormatter()
const usersStore = useUsersStore()

const entries = ref<AuditLogEntry[]>([])

onMounted(async () => {
  if (usersStore.items.length === 0) usersStore.fetchAll()
  const response = await $api.get<ApiResponse<AuditLogEntry[]>>('/audit-log', {
    params: { per_page: 1000 },
  })
  entries.value = response.data.data.map(entry => ({ ...entry, created_at: new Date(entry.created_at) }))
})

const entityTypeFilter = ref('all')
const entityTypeOptions = computed(() => [
  { label: t('admin.activityLog.allTypes'), value: 'all' },
  ...[...new Set(entries.value.map(e => e.entity_type))].sort().map(type => ({ label: type, value: type })),
])

const actorName = (actorId: number) => {
  const user = usersStore.items.find(u => u.id === actorId)
  return user ? `${user.first_name} ${user.last_name}` : '-'
}

const filteredEntries = computed(() => {
  return entries.value
    .filter(entry => entityTypeFilter.value === 'all' || entry.entity_type === entityTypeFilter.value)
    .map(entry => ({
      ...entry,
      entityCell: { title: `${entry.entity_type} #${entry.entity_id}`, description: entry.action },
      actionBadge: toBadge(entry.action),
      actorDisplay: actorName(entry.actor_id),
      datetimeDisplay: dateTimeFormat(entry.created_at.toISOString()),
    }))
})

const columns: TableDataColumn[] = [
  { label: t('admin.activityLog.columns.entity'), align: 'left', field: 'entityCell', type: TABLE_CARD_TYPE.MULTI_LINE },
  { label: t('admin.activityLog.columns.action'), align: 'left', field: 'actionBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('admin.activityLog.columns.actor'), align: 'left', field: 'actorDisplay' },
  { label: t('admin.activityLog.columns.datetime'), align: 'left', field: 'datetimeDisplay' },
  {
    label: t('admin.activityLog.columns.action2'),
    align: 'left',
    field: 'action',
    width: 100,
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.activityLog.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
    ],
  },
]

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => filteredEntries.value.length)

const detailOpen = ref(false)
const selectedEntry = ref<AuditLogEntry | null>(null)

const onViewDetail = (row: AuditLogEntry) => {
  selectedEntry.value = row
  detailOpen.value = true
}
</script>
