<template>
  <div class="flex justify-between items-center mt-4">
    <div class="text-xs text-[var(--color-dark-gray)]">
      <span v-if="props.isShowTotal">
        {{ $t('global.table.pagination.allItem') }} : {{ props.total }}
      </span>
    </div>
    <div class="flex items-center">
      <div class="text-xs text-[var(--color-black)]">
        {{ $t('global.table.pagination.rowPerPage') }}
      </div>
      <div class="px-5">
        <USelect
          v-model="perPage"
          :items="perPageOptions"
          class="w-20"
          @update:model-value="emit('changePerPage', $event)"
        />
      </div>
      <div class="pr-2 text-xs text-[var(--color-black)]">
        {{ getPaginationText }}
      </div>
      <div
        v-if="props.totalPage > 1"
        class="flex items-center gap-x-1"
      >
        <div
          :class="[
            'flex items-center justify-center rounded-full w-7 h-7',
            { 'hover:bg-[var(--color-light-gray-2)] cursor-pointer': !disabledChevronLeft }
          ]"
          @click="onPrevPage"
        >
          <UIcon
            name="material-symbols:chevron-left"
            :class="[
              'text-[var(--color-gray)]',
              { 'text-[var(--color-light-gray-2)]': disabledChevronLeft }
            ]"
          />
        </div>
        <!-- Direct page entry — only worth showing once there are enough pages
        that clicking through one-at-a-time would actually be tedious. -->
        <UInput
          v-if="props.totalPage > 5"
          v-model="pageJumpInput"
          class="w-12"
          size="xs"
          :ui="{ base: 'text-center px-1' }"
          @keyup.enter="onJumpToPage"
          @blur="onJumpToPage"
        />
        <div
          :class="[
            'flex items-center justify-center rounded-full w-7 h-7',
            { 'hover:bg-[var(--color-light-gray-2)] cursor-pointer': !disabledChevronRight }
          ]"
          @click="onNextPage"
        >
          <UIcon
            name="material-symbols:chevron-right"
            :class="[
              'text-[var(--color-gray)]',
              { 'text-[var(--color-light-gray-2)]': disabledChevronRight }
            ]"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
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
    default: 1,
  },
  perPage: {
    type: Number,
    default: 10,
  },
  isShowTotal: {
    type: Boolean,
    default: true,
  },
})

const currentPage = ref(props.page)
const perPage = ref(props.perPage)
const perPageOptions = ref([10, 50, 100])
const pageJumpInput = ref(String(props.page))

// Remembers the user's last-chosen page size across sessions so a table
// doesn't reset to 10 rows every time they come back — falls back silently
// if localStorage is unavailable (private mode, etc). Namespaced by route
// path: this component is mounted by ~30 different tables across the app
// (Leads, Deals, Contacts, admin panels, reports, ...), and a single shared
// key would mean picking "100 rows" on one table silently forced every
// other table in the app to 100 rows too.
const PER_PAGE_STORAGE_KEY = `table-per-page:${useRoute().path}`

onMounted(() => {
  try {
    const stored = Number(localStorage.getItem(PER_PAGE_STORAGE_KEY))
    if (stored && perPageOptions.value.includes(stored) && stored !== props.perPage) {
      perPage.value = stored
      emit('changePerPage', stored)
    }
  } catch {
    // localStorage unavailable — just use the default perPage prop.
  }
})

watch(
  () => props.page,
  (value) => {
    currentPage.value = value
    pageJumpInput.value = String(value)
  },
)

watch(
  () => props.perPage,
  (value) => {
    perPage.value = value
    try {
      localStorage.setItem(PER_PAGE_STORAGE_KEY, String(value))
    } catch {
      // Ignore — persistence is a convenience, not a requirement.
    }
  },
)

const emit = defineEmits(['changePage', 'changePerPage'])

const disabledChevronLeft = computed(() => {
  return currentPage.value === 1
})

const disabledChevronRight = computed(() => {
  return currentPage.value === props.totalPage
})

const startItem = computed(() => {
  return (currentPage.value - 1) * perPage.value + 1
})

const endItem = computed(() => {
  return Math.min(currentPage.value * perPage.value, props.total)
})

const getPaginationText = computed(() => {
  return `${startItem.value}-${endItem.value} of ${props.total}`
})

const onPrevPage = () => {
  if (disabledChevronLeft.value) {
    return
  }
  currentPage.value -= 1
  emit('changePage', currentPage.value)
}

const onNextPage = () => {
  if (disabledChevronRight.value) {
    return
  }
  currentPage.value += 1
  emit('changePage', currentPage.value)
}

const onJumpToPage = () => {
  const value = Math.min(Math.max(Math.trunc(Number(pageJumpInput.value)) || currentPage.value, 1), props.totalPage)
  pageJumpInput.value = String(value)
  if (value !== currentPage.value) {
    currentPage.value = value
    emit('changePage', value)
  }
}
</script>
