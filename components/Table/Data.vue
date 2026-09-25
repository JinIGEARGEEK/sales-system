<template>
  <div
    tabindex="-1"
    class="rounded-lg border border-(--color-light-gray-2) bg-white p-3 outline-none"
    @keydown="onTableKeydown"
  >
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
        <!-- Compact card per row: a two-column grid of small-label-over-value
        pairs (the first column — usually the record's name/link — spans the
        full width), with the row's checkbox/action menu alongside instead of
        taking a line of their own. Used to be one full-width label/value
        table row per column, which made each card very tall. -->
        <div
          v-for="(row, rowIndex) in paginatedRows"
          :key="`row-${rowIndex}`"
          class="flex items-start gap-2 border-b last:border-none border-(--color-light-gray-2) first:pt-0 py-2.5 last:pb-0"
        >
          <UCheckbox
            v-if="hasSelectColumn"
            v-model="selected"
            :value="row"
            class="pt-0.5"
          />
          <dl class="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-1.5">
            <div
              v-for="(column, columnIndex) in mobileDataColumns"
              :key="`column-${columnIndex}`"
              :class="['min-w-0', { 'col-span-2': columnIndex === 0 || column.type === TABLE_CARD_TYPE.MULTI_LINE }]"
            >
              <dt class="truncate text-xs text-(--color-gray)">{{ column.label }}</dt>
              <dd class="min-w-0 break-words text-sm text-(--color-black)">
                <TableCardType
                  is-mobile
                  :type="column.type"
                  :item="row[column.field]"
                />
              </dd>
            </div>
          </dl>
          <UDropdownMenu
            v-if="actionColumn"
            :items="getActionMenuItems(actionColumn, row, rowIndex)"
          >
            <UButton
              data-cy="action-btn-mobile"
              icon="material-symbols:more-vert"
              variant="ghost"
              color="neutral"
              size="xs"
              :aria-label="t('global.table.actions')"
            />
          </UDropdownMenu>
        </div>
        <div v-if="paginatedRows.length === 0">
          <slot name="empty">
            <!-- Both layouts are always in the DOM (CSS toggles which shows),
            so the mobile copy gets suffixed data-cy hooks — like
            action-btn-mobile/-desktop — to keep "table-empty" unique. -->
            <TableEmpty
              v-bind="emptyStateProps"
              data-cy-suffix="-mobile"
              @action="emit('emptyAction')"
              @clear-filters="emit('clearFilters')"
            />
          </slot>
        </div>
      </div>
      <div v-else class="flex flex-col gap-2">
        <USkeleton v-for="i in SKELETON_ROWS" :key="`mobile-skeleton-${i}`" class="h-14 w-full rounded-lg" />
      </div>
    </div>

    <!-- Desktop View -->
    <div class="hidden md:block">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="h-9 bg-(--color-light-gray-1)">
              <th
                v-for="col in prop.columns"
                :key="col.field"
                :class="[
                  'text-(--color-black) px-2 text-sm font-semibold first:rounded-l-lg last:rounded-r-lg',
                  col.type === TABLE_CARD_TYPE.ACTION ? 'text-center' : 'text-left',
                ]"
                :style="columnStyle(col)"
                :aria-sort="col.isSort ? ariaSort(col.field) : undefined"
              >
                <div v-if="col.type === TABLE_CARD_TYPE.SELECTED">
                  <UCheckbox
                    v-model="isSelectAll"
                    @update:model-value="onSelectAll"
                  />
                </div>
                <div v-else class="flex items-center gap-1">
                  <button
                    v-if="col.isSort"
                    type="button"
                    class="flex cursor-pointer items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-(--color-primary)"
                    :data-cy="`sort-${col.field}`"
                    @click="onSort(col.isSort, col.field)"
                  >
                    <b>{{ col.label }}</b>
                    <UIcon :name="sortIcon(col.field)" class="inline size-4" aria-hidden="true" />
                  </button>
                  <b v-else>{{ col.label }}</b>
                  <!-- Nuxt UI's Tooltip defaults to a fixed-height, single-line
                  (`truncate`/`nowrap`) content box, sized for short labels —
                  a longer explanation (e.g. classificationTooltip's MQL/SQL
                  definitions) has nothing to wrap it, so it lays out as one
                  very long line and runs off narrow/mobile viewports instead
                  of wrapping responsively. Override to a capped width that
                  wraps normally, safe for short tooltips too. -->
                  <UTooltip
                    v-if="col.tooltip"
                    :text="col.tooltip"
                    :ui="{ content: 'h-auto max-w-[min(20rem,80vw)] px-2.5 py-1.5', text: 'whitespace-normal' }"
                  >
                    <UIcon name="material-symbols:info-outline" class="inline size-4 text-(--color-gray)" />
                  </UTooltip>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="!prop.loading">
              <tr
                v-for="(row, rowIndex) in paginatedRows"
                :key="`row-${rowIndex}`"
                class="hover:bg-(--color-primary-bg) border-t border-(--color-light-gray-2)"
              >
                <td
                  v-for="col in prop.columns"
                  :key="col.field"
                  :class="[
                    'px-2 py-2 text-sm text-(--color-black) align-top',
                    { 'text-center': col.type === TABLE_CARD_TYPE.ACTION },
                  ]"
                  :style="columnStyle(col)"
                >
                  <div v-if="col.type === TABLE_CARD_TYPE.ACTION" class="flex justify-center">
                    <UDropdownMenu
                      :items="getActionMenuItems(col, row, rowIndex)"
                    >
                      <UButton
                        data-cy="action-btn-desktop"
                        icon="material-symbols:more-vert"
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        :aria-label="t('global.table.actions')"
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
            </template>
            <template v-if="prop.loading">
              <tr v-for="i in SKELETON_ROWS" :key="`desktop-skeleton-${i}`">
                <td v-for="col in prop.columns" :key="col.field" class="px-2 py-2" :style="columnStyle(col)">
                  <USkeleton class="h-5 w-full" />
                </td>
              </tr>
            </template>
            <tr v-else-if="paginatedRows.length === 0">
              <td :colspan="prop.columns.length">
                <slot name="empty">
                  <TableEmpty v-bind="emptyStateProps" @action="emit('emptyAction')" @clear-filters="emit('clearFilters')" />
                </slot>
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
import type { RouteLocationRaw } from 'vue-router'
import TABLE_CARD_TYPE from '~/constants/tableCardType'

const prop = defineProps({
  columns: {
    type: Array as PropType<TableDataColumn[]>,
    default: () => [],
  },
  rows: {
    type: Array as PropType<TableRowData[]>,
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
  // When true, `rows` is assumed to already be just the current page (fetched
  // server-side) and is rendered as-is — `page`/`perPage` are only used to
  // drive TablePagination's controls/labels. When false (default), `rows` is
  // the full dataset and this component does the page slicing itself, as
  // every existing client-side-paginated caller expects.
  serverPaginated: {
    type: Boolean,
    default: false,
  },
  // ── Empty state (shown on both the desktop table and mobile cards when
  // there are no rows; a `#empty` slot replaces it entirely) ──
  // Heading — defaults to the generic "No data".
  emptyTitle: {
    type: String,
    default: undefined,
  },
  // Optional secondary line under the heading.
  emptyDescription: {
    type: String,
    default: undefined,
  },
  // Material Symbols icon name, e.g. 'material-symbols:person-add-outline'.
  emptyIcon: {
    type: String,
    default: undefined,
  },
  // Label of a call-to-action button (e.g. "Add Lead"). With `emptyActionTo`
  // it's a link; without, clicking emits `empty-action`.
  emptyActionLabel: {
    type: String,
    default: undefined,
  },
  emptyActionTo: {
    type: [String, Object] as PropType<RouteLocationRaw>,
    default: undefined,
  },
  // True while a search/filter is active: shows "No results match your
  // filters" with a Clear filters button (emits `clear-filters`) instead of
  // the title/description/CTA above.
  filtered: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()

// Fixed row count for the loading skeleton — doesn't need to match `perPage`,
// just needs to read as "a table's worth of rows" without layout jumping once
// real data (any length) replaces it.
const SKELETON_ROWS = 5

const paginatedRows = computed(() => {
  if (prop.serverPaginated) return prop.rows
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
  'restore',
  'addToCampaign',
  'revoke',
  // Empty state: the CTA button (when no `emptyActionTo`), and the filtered
  // variant's Clear filters button.
  'emptyAction',
  'clearFilters',
])

const emptyStateProps = computed(() => ({
  title: prop.emptyTitle,
  description: prop.emptyDescription,
  icon: prop.emptyIcon,
  actionLabel: prop.emptyActionLabel,
  actionTo: prop.emptyActionTo,
  filtered: prop.filtered,
}))

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

const toggleRowSelection = (row: TableRowData) => {
  const index = selected.value.indexOf(row)
  if (index > -1) {
    selected.value.splice(index, 1)
  } else {
    selected.value.push(row)
  }
}

// Mobile cards render the selection checkbox and action menu beside the
// field grid rather than as grid entries of their own.
const actionColumn = computed(() => prop.columns.find(e => e.type === TABLE_CARD_TYPE.ACTION))
const hasSelectColumn = computed(() => prop.columns.some(e => e.type === TABLE_CARD_TYPE.SELECTED))
const mobileDataColumns = computed(() => prop.columns.filter(e => e.type !== TABLE_CARD_TYPE.ACTION && e.type !== TABLE_CARD_TYPE.SELECTED))

// The Action column doesn't carry an explicit `width` on most pages — default
// it to one fixed value so the meatball-menu column looks identical (not
// 100px on one list page and 120px on another) everywhere it's used. Columns
// with no width at all (the common case for every non-Action column) get no
// inline style, same as before this default existed.
const ACTION_COLUMN_WIDTH = 110
const columnStyle = (col: TableDataColumn): string => {
  const width = col.width || (col.type === TABLE_CARD_TYPE.ACTION ? ACTION_COLUMN_WIDTH : undefined)
  return width ? `width: ${width}px` : ''
}

// `isBorderBottom: true` on an action marks it as the last item in its group —
// a divider renders after it (e.g. between "View Detail"/"Edit" and a
// destructive "Delete"/"Deactivate"). Nuxt UI's UDropdownMenu draws that
// divider automatically when `items` is an array of groups (array of arrays),
// so split the flat action list into groups at each isBorderBottom boundary.
type ActionMenuItem = { label: string, onSelect: () => void }
const getActionMenuItems = (col: TableDataColumn, row: TableRowData, _rowIndex: number) => {
  if (!col.actions) return []
  const visible = col.actions.filter(action => !action.hideIf || !action.hideIf(row))
  const groups: ActionMenuItem[][] = []
  let currentGroup: ActionMenuItem[] = []
  visible.forEach((action) => {
    currentGroup.push({
      label: action.label,
      onSelect: () => emit(action.emitName as never, row),
    })
    if (action.isBorderBottom) {
      groups.push(currentGroup)
      currentGroup = []
    }
  })
  if (currentGroup.length > 0) groups.push(currentGroup)
  return groups
}

const innerField = ref('')
const innerSortBy = ref('desc')

const onSort = (isSort: boolean | undefined, field: string) => {
  if (isSort) {
    innerSortBy.value = innerField.value === field && innerSortBy.value === 'asc' ? 'desc' : 'asc'
    innerField.value = field
    emit('sort', field, innerSortBy.value)
  }
}

// For the sortable <th>'s aria-sort — only the active sort column reports a
// direction; the other sortable columns are "none".
const ariaSort = (field: string): 'ascending' | 'descending' | 'none' => {
  if (innerField.value !== field) return 'none'
  return innerSortBy.value === 'asc' ? 'ascending' : 'descending'
}

const sortIcon = (field: string): string => {
  if (innerField.value !== field) return 'material-symbols:unfold-more'
  return innerSortBy.value === 'asc' ? 'material-symbols:arrow-upward' : 'material-symbols:arrow-downward'
}

const onChangePage = (value: number) => {
  emit('changePage', value)
}

const onChangePerPage = (value: number) => {
  emit('changePerPage', value)
}

// Esc clears the current selection; Cmd/Ctrl+A selects every row on the
// current page — only while the table itself (not some unrelated input) has
// focus, and only when row selection is actually enabled.
const onTableKeydown = (event: KeyboardEvent) => {
  if (!prop.isShowSelect) return
  if (event.key === 'Escape' && selected.value.length > 0) {
    selected.value = []
  } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
    event.preventDefault()
    selected.value = [...prop.rows]
  }
}
</script>
