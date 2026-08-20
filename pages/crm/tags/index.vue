<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-black">{{ t('crm.tags.index.heading') }}</h2>
      <ButtonPrimary
        :label="t('crm.tags.index.addTag')"
        icon="material-symbols:add"
        @click="navigateTo('/crm/tags/create')"
      />
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="flex flex-col gap-3">
        <CrmStatusPill v-model="statusFilter" :options="TAG_STATUS_OPTIONS" />
        <div class="flex flex-col gap-3 sm:flex-row">
          <div class="flex-1">
            <InputText
              v-model="search"
              :placeholder="t('crm.tags.index.searchPlaceholder')"
              name="search"
            />
          </div>
          <div class="w-full sm:w-48">
            <InputSelect
              v-model="categoryFilter"
              :options="[{ label: t('crm.tags.index.allCategories'), value: 'all' }, ...TAG_CATEGORY_OPTIONS]"
              :placeholder="t('crm.tags.index.categoryPlaceholder')"
              name="categoryFilter"
            />
          </div>
        </div>
      </div>
    </UCard>

    <TableData
      v-model:page="page"
      server-paginated
      :columns="columns"
      :rows="displayTags"
      :total="total"
      :total-page="totalPage"
      :per-page="perPage"
      :loading="loading"
      @change-page="onChangePage"
      @change-per-page="onChangePerPage"
      @view-detail="onViewDetail"
      @edit="onEdit"
      @delete="requestDelete"
    />

    <CrmConfirmDeleteModal
      v-model:open="open"
      :name="target?.name || ''"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { TAG_CATEGORY_OPTIONS, TAG_STATUS_OPTIONS } from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.tags.index.pageTitle') })

const { dateFormat, toBadge } = useFormatter()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const tagsStore = useTagsStore()

const search = ref('')
const categoryFilter = ref('all')
const statusFilter = ref('all')

const buildParams = () => ({
  search: search.value || undefined,
  category: categoryFilter.value !== 'all' ? categoryFilter.value : undefined,
  status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
})

const {
  rows,
  total,
  totalPage,
  page,
  perPage,
  loading,
  fetch,
  refetchFromStart,
  refetchDebounced,
  onChangePage,
  onChangePerPage,
} = useServerListPage<Tag>(params => tagsStore.fetchList(params), buildParams)

onMounted(fetch)

watch(search, () => refetchDebounced())
watch([categoryFilter, statusFilter], () => refetchFromStart())

const displayTags = computed(() => rows.value.map(tag => ({
  ...tag,
  categoryBadge: toBadge(tag.category),
  statusBadge: tag.status === 'active'
    ? toBadge(t('crm.tags.index.statusActive'), 'success')
    : toBadge(t('crm.tags.index.statusInactive')),
  createdDate: dateFormat(tag.created_at.toISOString()),
})))

const columns: TableDataColumn[] = [
  { label: t('crm.tags.index.columns.name'), align: 'left', field: 'name' },
  { label: t('crm.tags.index.columns.category'), align: 'left', field: 'categoryBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.tags.index.columns.description'), align: 'left', field: 'description' },
  { label: t('crm.tags.index.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.tags.index.columns.created'), align: 'left', field: 'createdDate' },
  {
    label: t('crm.tags.index.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.tags.index.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
      { label: t('crm.tags.index.actions.edit'), emitName: 'edit', isBorderBottom: true },
      { label: t('crm.tags.index.actions.delete'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]

const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Tag>()

const onViewDetail = (row: Tag) => {
  navigateTo(`/crm/tags/${row.id}`)
}

const onEdit = (row: Tag) => {
  navigateTo(`/crm/tags/${row.id}`)
}

const confirmDelete = async () => {
  try {
    if (target.value) {
      await tagsStore.remove(target.value.id)
      success(t('crm.tags.index.deleteSuccess'))
      await fetch()
    }
  } catch (err) {
    notifyApiError(err)
  } finally {
    closeDelete()
  }
}
</script>
