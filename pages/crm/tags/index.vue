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
        <div class="w-full sm:w-40">
          <InputSelect
            v-model="statusFilter"
            :options="TAG_STATUS_OPTIONS"
            :placeholder="t('crm.tags.index.statusPlaceholder')"
            name="statusFilter"
          />
        </div>
      </div>
    </UCard>

    <TableData
      v-model:page="page"
      :columns="columns"
      :rows="filteredTags"
      :total="filteredTags.length"
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
const tagsStore = useTagsStore()

const loading = ref(false)
onMounted(async () => {
  if (tagsStore.items.length === 0) {
    loading.value = true
    try {
      await tagsStore.fetchAll()
    } finally {
      loading.value = false
    }
  }
})

const search = ref('')
const categoryFilter = ref('all')
const statusFilter = ref('all')

const filteredTags = computed(() => {
  return tagsStore.items.filter((tag) => {
    const matchSearch = !search.value || tag.name.toLowerCase().includes(search.value.toLowerCase())
    const matchCategory = categoryFilter.value === 'all' || tag.category === categoryFilter.value
    const matchStatus = statusFilter.value === 'all' || tag.status === statusFilter.value
    return matchSearch && matchCategory && matchStatus
  }).map((tag) => ({
    ...tag,
    categoryBadge: toBadge(tag.category),
    statusBadge: tag.status === 'active'
      ? toBadge(t('crm.tags.index.statusActive'), 'success')
      : toBadge(t('crm.tags.index.statusInactive')),
    createdDate: dateFormat(tag.created_at.toISOString()),
  }))
})

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
    width: 100,
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.tags.index.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
      { label: t('crm.tags.index.actions.edit'), emitName: 'edit', isBorderBottom: false },
      { label: t('crm.tags.index.actions.delete'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => filteredTags.value.length)
const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Tag>()

const onViewDetail = (row: Tag) => {
  navigateTo(`/crm/tags/${row.id}`)
}

const onEdit = (row: Tag) => {
  navigateTo(`/crm/tags/${row.id}`)
}

const confirmDelete = async () => {
  if (target.value) {
    await tagsStore.remove(target.value.id)
    success(t('crm.tags.index.deleteSuccess'))
  }
  closeDelete()
}
</script>
