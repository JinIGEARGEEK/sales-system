<template>
  <div :class="$attrs.class">
    <InputFormField
      v-slot="{ field, errors, fieldId, errorId }"
      :model-value="props.modelValue"
      :name="props.name"
      :rules="props.rules"
      :label="props.label"
      :data-cy="props.dataCy"
      @update:model-value="emit('update:model-value', $event)"
    >
      <USelectMenu
        v-bind="field"
        :id="fieldId"
        v-model:search-term="searchTerm"
        :model-value="props.modelValue"
        :data-cy="dataCy"
        :placeholder="placeholder || undefined"
        :items="options"
        ignore-filter
        value-key="value"
        label-key="label"
        :loading="props.loading || searching"
        :disabled="props.disable"
        :size="props.size"
        :aria-invalid="errors.length > 0"
        :aria-describedby="errors.length ? errorId : undefined"
        class="w-full"
        @update:model-value="emit('update:model-value', $event)"
      >
        <slot />
      </USelectMenu>
    </InputFormField>
  </div>
</template>

<script setup lang="ts">
// Generic search-as-you-type picker backed by a caller-supplied server
// search function — for entities that can be picked but not created inline
// (Deal, Contact, Lead), unlike components/Input/CompanySelect.vue, which
// adds create-on-the-fly. Same rationale as that component: a
// fetchAll()-based preloaded list (see stores/companies.ts's fetchAll doc
// for the full explanation) is capped at 200 rows, newest-first, and can
// silently miss an older record — this searches the server on every
// keystroke instead. `ignore-filter` tells USelectMenu the results are
// already server-filtered, so it doesn't additionally hide matches that
// don't happen to substring-match its own copy of the search term.
const props = defineProps({
  modelValue: {
    type: Number as PropType<number | null>,
    default: null,
  },
  ...useInputBaseProps(),
  loading: {
    type: Boolean,
    default: false,
  },
  disable: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'md',
  },
  // Returns the options matching `term` (called once with '' up front too,
  // for an initial browse list before the user types anything). Typically a
  // thin wrapper over one store's fetchList.
  search: {
    type: Function as PropType<(term: string) => Promise<Select[]>>,
    required: true,
  },
  // Resolves the option for one specific id when it isn't present in the
  // latest search results — e.g. opening an edit page whose linked record
  // doesn't match whatever's currently typed/browsed. Optional: omit if the
  // caller already guarantees modelValue's label is resolvable some other
  // way (e.g. it's always shown from data already loaded elsewhere).
  resolveSelected: {
    type: Function as PropType<(id: number) => Promise<Select | null>>,
    default: null,
  },
})

const emit = defineEmits(['update:model-value'])

const { notifyApiError } = useApiErrorNotifier()
const searching = ref(false)
const searchTerm = ref('')
const results = ref<Select[]>([])
const selectedOption = ref<Select | null>(null)

const runSearch = async (term: string) => {
  searching.value = true
  try {
    results.value = await props.search(term)
  } catch (err) {
    notifyApiError(err)
  } finally {
    searching.value = false
  }
}

// Debounced the same way useServerListPage's own search does (plain
// setTimeout, no extra dependency) — fires on every keystroke otherwise.
let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(searchTerm, (term) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => runSearch(term), 300)
})

const ensureSelectedLoaded = async (id: number) => {
  if (results.value.some(o => o.value === id) || selectedOption.value?.value === id) return
  if (!props.resolveSelected) return
  try {
    selectedOption.value = await props.resolveSelected(id)
  } catch (err) {
    notifyApiError(err)
  }
}

onMounted(() => {
  runSearch('')
  if (props.modelValue !== null) ensureSelectedLoaded(props.modelValue)
})

watch(() => props.modelValue, (id) => {
  if (id !== null) ensureSelectedLoaded(id)
})

const options = computed<Select[]>(() => {
  const list = [...results.value]
  if (props.modelValue !== null && !list.some(o => o.value === props.modelValue) && selectedOption.value) {
    list.unshift(selectedOption.value)
  }
  return list
})
</script>
