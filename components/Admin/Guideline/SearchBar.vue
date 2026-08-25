<template>
  <!-- Sticks below the layout's own sticky header, then turns to glass once it's actually floating -->
  <div ref="searchBarSentinelRef" />
  <UCard
    class="sticky top-3 z-20 mb-4 transition-[background-color,backdrop-filter,box-shadow] duration-200 md:top-[calc(var(--layout-header-height)+12px)]"
    :ui="searchBarCardUi"
  >
    <div
      v-if="isSearchBarStuck"
      class="pointer-events-none absolute inset-x-4 -bottom-px h-px bg-linear-to-r from-transparent via-[rgba(250,204,21,0.8)] to-[rgba(96,165,250,0.8)] opacity-80 shadow-[0_0_8px_1px_rgba(96,165,250,0.5)]"
    />
    <div class="relative">
      <UInput
        v-model="modelValue"
        icon="material-symbols:search"
        :placeholder="t('admin.guideline.searchPlaceholder')"
        class="w-full"
        autocomplete="off"
        @focus="isSearchFocused = true"
        @blur="onSearchBlur"
        @keydown.escape="modelValue = ''"
      >
        <template v-if="modelValue" #trailing>
          <UButton
            icon="material-symbols:close"
            variant="ghost"
            color="neutral"
            size="xs"
            :aria-label="t('admin.guideline.clearSearch')"
            @click="modelValue = ''"
          />
        </template>
      </UInput>

      <!-- Live search preview: a command-palette-style dropdown, not a page replacement -->
      <div
        v-if="showSearchPreview"
        class="absolute inset-x-0 top-full z-20 mt-1.5 max-h-96 overflow-y-auto rounded-lg border border-[rgba(96,165,250,0.45)] bg-white shadow-xl"
      >
        <button
          v-for="result in results"
          :key="result.id"
          type="button"
          class="flex w-full items-start gap-3 border-b border-[var(--color-gray)]/10 px-3 py-2.5 text-left last:border-b-0 hover:bg-[var(--color-primary-bg)]"
          @click="emit('select', result)"
        >
          <UIcon :name="result.icon" class="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium">{{ result.title }}</span>
            <span class="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--color-gray)]">
              {{ result.topicTitle }}
              <UIcon name="material-symbols:chevron-right" class="size-3.5 shrink-0" />
              <span class="text-[var(--color-accent-green)]">{{ result.roleLabel }}</span>
            </span>
          </span>
        </button>

        <p v-if="results.length === 0" class="px-3 py-4 text-center text-sm text-[var(--color-gray)]">
          {{ t('admin.guideline.noResultsTitle') }}
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SearchPreviewResult } from './types'

const modelValue = defineModel<string>({ required: true })

defineProps<{
  results: SearchPreviewResult[]
}>()

const emit = defineEmits<{
  select: [result: SearchPreviewResult]
}>()

const { t } = useI18n()

const isSearching = computed(() => modelValue.value.trim() !== '')

const isSearchFocused = ref(false)
const BLUR_CLOSE_DELAY_MS = 150
const onSearchBlur = () => {
  // Delay so a click on a dropdown row registers before the dropdown unmounts.
  setTimeout(() => { isSearchFocused.value = false }, BLUR_CLOSE_DELAY_MS)
}

const showSearchPreview = computed(() => isSearchFocused.value && isSearching.value)

// Same sticky-then-glass mechanism as the dashboard filter bar (pages/index.vue):
// a zero-height sentinel right above the sticky card flips this ref the instant
// the card starts floating, so it can pick up the frosted look at that point.
const isSearchBarStuck = ref(false)
const searchBarSentinelRef = ref<HTMLElement | null>(null)
onMounted(() => {
  const sentinelEl = searchBarSentinelRef.value
  const mainEl = sentinelEl?.closest('main') ?? null
  if (!sentinelEl || !mainEl) return
  const observer = new IntersectionObserver(
    ([entry]) => { isSearchBarStuck.value = !entry.isIntersecting },
    { root: mainEl, threshold: 0 },
  )
  observer.observe(sentinelEl)
  onUnmounted(() => observer.disconnect())
})

// UCard's root defaults to `overflow-hidden`, which clips the search preview
// dropdown below it — override that so the dropdown can extend past the card.
// The stuck state picks up the same yellow-to-blue gradient ring used on the
// sidebar nav items (see .guideline-search-card below), instead of a plain
// blue ring.
const searchBarCardUi = computed(() => ({
  root: `overflow-visible guideline-search-card ${isSearchBarStuck.value
    ? 'is-stuck bg-white/10 backdrop-blur-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]'
    : ''}`,
  body: 'p-2 sm:p-3',
}))
</script>

<style scoped>
/*
 * Search bar stuck border: same yellow-to-blue gradient ring treatment as
 * the sidebar nav items (.sidebar-nav-link in layouts/default.vue), drawn
 * via a mask-clipped ::before since border-color can't take a gradient.
 * Only shown once the bar is actually floating (is-stuck).
 *
 * No `position: relative` here on purpose: this class lives on the same
 * element as the `sticky` Tailwind utility (merged in via UCard's root ui +
 * the component's own `class`). Both are single-class selectors of equal
 * specificity, so adding `position: relative` here risked the cascade
 * flipping `position: sticky` back to `relative` and breaking the float —
 * `position: sticky` already establishes a positioning context for the
 * absolutely-positioned ::before below, so it isn't needed anyway.
 */
.guideline-search-card.is-stuck {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 0 12px rgba(250, 204, 21, 0.25), 0 0 18px rgba(96, 165, 250, 0.25);
}

.guideline-search-card.is-stuck::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.9), rgba(96, 165, 250, 0.9));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
</style>
