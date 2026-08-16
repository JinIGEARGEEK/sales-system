<template>
  <div class="rounded-lg border border-[var(--color-light-gray-2)] bg-white p-4">
    <!-- Mobile View -->
    <div class="md:hidden">
      <div v-if="!prop.loading">
        <div v-if="isShowSelect">
          <div class="pb-2">
            <UCheckbox
              v-model="isSelectAll"
              :label="t('global.table.selectAll')"
              @update:model-value="onSelectAll"
            />
          </div>
          <USeparator class="mb-2" />
        </div>
        <div
          v-for="(row, rowIndex) in paginatedRows"
          :key="`row-${rowIndex}`"
          class="border-b last:border-none border-[var(--color-gray)] first:pt-0 pt-2 pb-2 last:pb-0"
        >
          <table class="w-full">
            <tbody>
              <tr
                v-for="(column, columnIndex) in prop.columns"
                :key="`column-${columnIndex}`"
              >
                <td v-if="column.type === TABLE_CARD_TYPE.SELECTED">
                  <UCheckbox
                    v-model="selected"
                    :value="row"
                  />
                </td>
                <td v-else-if="column.type !== TABLE_CARD_TYPE.ACTION" :class="`py-1 ${prop.mobileColumnWidth}`">
                  <span class="text-sm text-[var(--color-black)] pr-5"><b>{{ column.label }}</b></span>
                </td>
                <td v-if="column.type === TABLE_CARD_TYPE.SELECTED" />
                <td v-else-if="column.type !== TABLE_CARD_TYPE.ACTION">
                  <TableCardType
                    is-mobile
                    :type="column.type"
                    :item="row[column.field]"
                  />
                </td>
                <td
                  v-if="columnIndex === 0 && isColumnAction() && getColumAction().type === TABLE_CARD_TYPE.ACTION"
                  class="w-4"
                >
                  <UDropdownMenu
                    :items="getActionMenuItems(getColumAction(), row, rowIndex)"
                  >
                    <UButton
                      data-cy="action-btn-mobile"
                      icon="material-symbols:more-vert"
                      variant="ghost"
                      color="neutral"
                      size="xs"
                    />
                  </UDropdownMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="paginatedRows.length === 0" class="text-[var(--color-black)] text-center pt-10">
          {{ t('global.noData') }}
        </div>
      </div>
      <div v-else class="text-[var(--color-black)] text-center">
        {{ t('global.loading') }}
      </div>
    </div>

    <!-- Desktop View -->
    <div class="hidden md:block">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="h-9 bg-[var(--color-light-gray-1)]">
              <th
                v-for="col in prop.columns"
                :key="col.field"
                class="text-left text-[var(--color-black)] px-2 text-sm font-semibold first:rounded-l-lg last:rounded-r-lg"
                :style="col.width ? `width: ${col.width}px` : ''"
              >
                <div v-if="col.type === TABLE_CARD_TYPE.SELECTED">
                  <UCheckbox
                    v-model="isSelectAll"
                    @update:model-value="onSelectAll"
                  />
                </div>
                <div
                  v-else
                  :class="[{'cursor-pointer': col.isSort}]"
                  @click="onSort(col.isSort, col.field)"
                >
                  <b>{{ col.label }}</b>
                  <UIcon v-if="col.isSort" name="material-symbols:unfold-more" class="inline size-4" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, rowIndex) in paginatedRows"
              :key="`row-${rowIndex}`"
              class="hover:bg-[var(--color-primary-bg)] border-t border-[var(--color-light-gray-2)]"
            >
              <td
                v-for="col in prop.columns"
                :key="col.field"
                class="px-2 py-2 text-sm text-[var(--color-black)] align-top"
                :style="col.width ? `width: ${col.width}px` : ''"
              >
                <div v-if="col.type === TABLE_CARD_TYPE.ACTION">
                  <UDropdownMenu
                    :items="getActionMenuItems(col, row, rowIndex)"
                  >
                    <UButton
                      data-cy="action-btn-desktop"
                      icon="material-symbols:more-vert"
                      variant="ghost"
                      color="neutral"
                      size="xs"
                    />
                  </UDropdownMenu>
                </div>
                <div v-else-if="col.type === TABLE_CARD_TYPE.SELECTED">
                  <UCheckbox
                    :model-value="selected.includes(row)"
                    @update:model-value="toggleRowSelection(row)"
                  />
                </div>
                <div v-else>
                  <TableCardType
                    :type="col.type"
                    :item="row[col.field]"
                    @print="emit('print', row)"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="!prop.loading && paginatedRows.length === 0">
              <td :colspan="prop.columns.length">
                <div class="flex justify-center pt-10">
                  {{ t('global.noData') }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="prop.page > 0 && prop.rows.length > 0">
      <TablePagination
        :page="prop.page"
        :total="prop.total"
        :total-page="prop.totalPage"
        :per-page="prop.perPage"
        @change-page="onChangePage"
        @change-per-page="onChangePerPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'

const prop = defineProps({
  columns: {
    type: Array as PropType<TableDataColumn[]>,
    default: () => [],
  },
  rows: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: Array as PropType<any[]>,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  page: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  totalPage: {
    type: Number,
    default: 0,
  },
  perPage: {
    type: Number,
    default: 10,
  },
  mobileColumnWidth: {
    type: String,
    default: 'w-28',
  },
  selectValue: {
    type: Array,
    default: () => [],
  },
  isShowSelect: {
    type: Boolean,
    default: false,
  },
  tableVerticalAlign: {
    type: String,
    default: 'top',
  },
})

const { t } = useI18n()

const paginatedRows = computed(() => {
  const start = (Math.max(prop.page, 1) - 1) * prop.perPage
  return prop.rows.slice(start, start + prop.perPage)
})

const selected = ref(prop.selectValue)
const isSelectAll = ref<boolean | null>(false)

watch(
  () => prop.selectValue,
  (value) => {
    selected.value = value
  },
)

const emit = defineEmits([
  'update:page',
  'changePage',
  'changePerPage',
  'sort',
  'update:selectValue',
  'print',
  'viewDetail',
  'edit',
  'delete',
  'convert',
  'deactivate',
])

watch(
  () => selected.value,
  (value) => {
    if (selected.value.length > 0 && selected.value.length !== prop.rows.length) {
      isSelectAll.value = null
    } else if (selected.value.length === prop.rows.length) {
      isSelectAll.value = true
    } else if (selected.value.length === 0) {
      isSelectAll.value = false
    }
    emit('update:selectValue', value)
  },
  { deep: true },
)

const onSelectAll = (val: boolean) => {
  selected.value = val ? [...prop.rows] : []
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toggleRowSelection = (row: any) => {
  const index = selected.value.indexOf(row)
  if (index > -1) {
    selected.value.splice(index, 1)
  } else {
    selected.value.push(row)
  }
}

const isColumnAction = ():boolean => {
  return !!prop.columns.find(e => e.type === TABLE_CARD_TYPE.ACTION)
}

const getColumAction = ():TableDataColumn => {
  return prop.columns.find(e => e.type === TABLE_CARD_TYPE.ACTION) as TableDataColumn
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getActionMenuItems = (col: TableDataColumn, row: any, _rowIndex: number) => {
  if (!col.actions) return []
  return col.actions.map(action => ({
    label: action.label,
    onSelect: () => emit(action.emitName as never, row),
  }))
}

const innerField = ref('')
const innerSortBy = ref('desc')

const onSort = (isSort: boolean | undefined, field: string) => {
  if (isSort) {
    innerField.value = field
    innerSortBy.value = innerSortBy.value === 'asc' ? 'desc' : 'asc'
    emit('sort', field, innerSortBy.value)
  }
}

const onChangePage = (value: number) => {
  emit('changePage', value)
}

const onChangePerPage = (value: number) => {
  emit('changePerPage', value)
}
</script>
