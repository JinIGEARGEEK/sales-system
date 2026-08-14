<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('admin.activityLog.title') }}</h2>
        <p class="text-sm text-[var(--color-gray)]">{{ dateFormat(new Date().toISOString()) }}</p>
      </div>
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="flex-1">
          <InputText
            v-model="search"
            :placeholder="t('admin.activityLog.searchPlaceholder')"
            name="search"
          />
        </div>
        <div class="w-full sm:w-40">
          <InputSelect
            v-model="typeFilter"
            :options="ACTIVITY_TYPE_OPTIONS"
            :placeholder="t('admin.activityLog.typePlaceholder')"
            name="typeFilter"
          />
        </div>
      </div>
    </UCard>

    <TableData
      v-model:page="page"
      :columns="columns"
      :rows="filteredActivity"
      :total="filteredActivity.length"
      :total-page="totalPage"
      :per-page="perPage"
      @change-page="onChangePage"
      @change-per-page="onChangePerPage"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { RECENT_ACTIVITY, ACTIVITY_TYPE_OPTIONS } from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('admin.activityLog.title') })

const { dateFormat, dateTimeFormat, toBadge } = useFormatter()

const search = ref('')
const typeFilter = ref('all')

const ACTIVITY_TYPE_COLOR: Record<ActivityItemType, string> = {
  user: 'info',
  order: 'success',
  system: 'neutral',
  payment: 'warning',
  report: 'neutral',
}

const filteredActivity = computed(() => {
  return RECENT_ACTIVITY.filter((item) => {
    const matchSearch = !search.value
      || item.title.toLowerCase().includes(search.value.toLowerCase())
      || item.description.toLowerCase().includes(search.value.toLowerCase())
    const matchType = typeFilter.value === 'all' || item.type === typeFilter.value
    return matchSearch && matchType
  }).map(item => ({
    ...item,
    activityCell: { title: item.title, description: item.description },
    typeBadge: toBadge(ACTIVITY_TYPE_OPTIONS.find(o => o.value === item.type)?.label || item.type, ACTIVITY_TYPE_COLOR[item.type]),
    datetimeDisplay: dateTimeFormat(item.datetime),
  }))
})

const columns: TableDataColumn[] = [
  { label: t('admin.activityLog.columns.activity'), align: 'left', field: 'activityCell', type: TABLE_CARD_TYPE.MULTI_LINE },
  { label: t('admin.activityLog.columns.type'), align: 'left', field: 'typeBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('admin.activityLog.columns.datetime'), align: 'left', field: 'datetimeDisplay' },
]

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => filteredActivity.value.length)
</script>
