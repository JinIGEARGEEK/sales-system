<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black">{{ t('admin.activityLog.title') }}</h2>
          <p class="text-sm text-[var(--color-gray)]">{{ dateFormat(new Date().toISOString()) }}</p>
        </div>
      </div>

      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-wrap items-center gap-2">
          <UIcon name="material-symbols:filter-alt-outline" class="size-4 shrink-0 text-[var(--color-gray)]" />
          <div class="w-full sm:w-48">
            <InputSelect
              v-model="entityTypeFilter"
              :options="entityTypeOptions"
              :placeholder="t('admin.activityLog.typePlaceholder')"
              name="entityTypeFilter"
            />
          </div>
          <InputDateRangePicker
            v-model="dateRange"
            :placeholder="t('admin.activityLog.dateRangePlaceholder')"
            name="dateRange"
            class="w-64"
          />
          <UButton
            v-if="hasActiveFilters"
            icon="material-symbols:filter-alt-off-outline"
            variant="outline"
            color="neutral"
            size="xs"
            square
            :aria-label="t('admin.activityLog.clearFilters')"
            @click="clearFilters"
          />
        </div>
      </UCard>

      <TableData
        v-model:page="page"
        :columns="columns"
        :rows="rows"
        :total="auditLogStore.total"
        :total-page="totalPage"
        :per-page="perPage"
        :loading="loading"
        @change-page="onChangePage"
        @change-per-page="onChangePerPage"
        @view-detail="onViewDetail"
      />

      <UModal v-model:open="detailOpen">
        <template #header>
          <h3 class="text-lg font-medium">{{ t('admin.activityLog.detail.title') }}</h3>
        </template>
        <template #body>
          <div v-if="selectedEntry" class="flex flex-col gap-1 text-sm">
            <p v-if="changedFields.length === 0" class="text-[var(--color-gray)]">
              {{ t('admin.activityLog.detail.noChange') }}
            </p>
            <div
              v-for="field in changedFields"
              :key="field.key"
              class="flex flex-col gap-1 border-b border-[var(--color-light-gray-1)] py-2 last:border-b-0"
            >
              <p class="text-xs font-medium text-[var(--color-gray)]">{{ field.key }}</p>
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="rounded bg-[var(--color-light-gray-1)] px-2 py-1 line-through">{{ field.before }}</span>
                <UIcon name="material-symbols:arrow-forward" class="size-3 shrink-0 text-[var(--color-gray)]" />
                <span class="rounded bg-[var(--color-light-gray-1)] px-2 py-1">{{ field.after }}</span>
              </div>
            </div>
          </div>
        </template>
      </UModal>
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('admin.activityLog.title') })

const { dateFormat, dateTimeFormat, toBadge } = useFormatter()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const auditLogStore = useAuditLogStore()
const usersStore = useUsersStore()

// GET /audit-log is Admin-only server-side — gate the page to match.
const { canAccess, guardMounted } = usePageAccess('Admin')

// Known entity_type values written by the backend (internal/utils/bulk.go and
// SaveWithAudit callers in deals.go, leads.go, projects.go, products.go,
// settings.go): deal, lead, project, customer_product, settings.
const KNOWN_ENTITY_TYPES = ['deal', 'lead', 'project', 'customer_product', 'settings']

const entityTypeFilter = ref('all')
const entityTypeOptions = computed(() => [
  { label: t('admin.activityLog.allTypes'), value: 'all' },
  ...KNOWN_ENTITY_TYPES.map(type => ({ label: type, value: type })),
])
const dateRange = ref<{ start: string, end: string } | null>(null)

const hasActiveFilters = computed(() => entityTypeFilter.value !== 'all' || Boolean(dateRange.value))
const clearFilters = () => {
  entityTypeFilter.value = 'all'
  dateRange.value = null
}

const loading = ref(false)
const { page, perPage, totalPage, onChangePage: onChangePageBase, onChangePerPage: onChangePerPageBase } = useTablePagination(() => auditLogStore.total)

// No canAccess check needed here: guardMounted() below only calls this once
// access is confirmed, and the other call sites (onChangePage/onChangePerPage/
// the filters watch) are only reachable through UI that <AccessGate> hides otherwise.
const fetchEntries = async () => {
  loading.value = true
  try {
    await auditLogStore.fetchAll({
      page: page.value,
      per_page: perPage.value,
      entity_type: entityTypeFilter.value !== 'all' ? entityTypeFilter.value : undefined,
      date_from: dateRange.value?.start,
      date_to: dateRange.value?.end,
    })
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

const onChangePage = (value: number) => {
  onChangePageBase(value)
  fetchEntries()
}
const onChangePerPage = (value: number) => {
  onChangePerPageBase(value)
  fetchEntries()
}

guardMounted(() => {
  if (usersStore.items.length === 0) usersStore.fetchAll().catch(notifyApiError)
  fetchEntries()
})

watch([entityTypeFilter, dateRange], () => {
  page.value = 1
  fetchEntries()
})

const actorName = (actorId: number) => {
  const user = usersStore.items.find(u => u.id === actorId)
  return user ? `${user.first_name} ${user.last_name}` : '-'
}

const rows = computed(() => auditLogStore.items.map(entry => ({
  ...entry,
  entityCell: { title: `${entry.entity_type} #${entry.entity_id}`, description: entry.action },
  actionBadge: toBadge(entry.action),
  actorDisplay: actorName(entry.actor_id),
  datetimeDisplay: dateTimeFormat(entry.created_at.toISOString()),
})))

const columns: TableDataColumn[] = [
  { label: t('admin.activityLog.columns.entity'), align: 'left', field: 'entityCell', type: TABLE_CARD_TYPE.MULTI_LINE },
  { label: t('admin.activityLog.columns.action'), align: 'left', field: 'actionBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('admin.activityLog.columns.actor'), align: 'left', field: 'actorDisplay' },
  { label: t('admin.activityLog.columns.datetime'), align: 'left', field: 'datetimeDisplay' },
  {
    label: t('admin.activityLog.columns.action2'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.activityLog.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
    ],
  },
]

const detailOpen = ref(false)
const selectedEntry = ref<AuditLogEntry | null>(null)

// Simple key-by-key diff: union of before/after keys, only the ones whose
// value actually changed — avoids a heavier diff-viewer dependency.
const displayValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-'
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

const changedFields = computed(() => {
  if (!selectedEntry.value) return []
  const before = selectedEntry.value.before || {}
  const after = selectedEntry.value.after || {}
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
  return keys
    .filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map(key => ({ key, before: displayValue(before[key]), after: displayValue(after[key]) }))
})

const onViewDetail = (row: AuditLogEntry) => {
  selectedEntry.value = row
  detailOpen.value = true
}
</script>
