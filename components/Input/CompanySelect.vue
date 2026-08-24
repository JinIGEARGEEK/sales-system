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
        :create-item="{ when: 'empty' }"
        :loading="props.loading || searching || creating"
        :disabled="props.disable"
        :size="props.size"
        :aria-invalid="errors.length > 0"
        :aria-describedby="errors.length ? errorId : undefined"
        class="w-full"
        @update:model-value="emit('update:model-value', $event)"
        @create="onCreate"
      >
        <slot />
      </USelectMenu>
    </InputFormField>
  </div>
</template>

<script setup lang="ts">
// Resolves to a real Company.id, unlike InputCombobox (which stays a plain
// string, e.g. for Project names) — picking an existing Company links to
// that exact record; typing a name that doesn't match one creates a real
// Company immediately (POST /companies) and resolves to its new id, so a
// Lead's company_id is always a genuine FK, never a free-text stand-in.
// USelectMenu's own `create-item` only ever synthesizes { [valueKey]:
// searchTerm } — no label, no id — so creation is handled here instead of
// letting it fall through: @create hands us the typed string directly.
//
// Search-as-you-type against the server (companiesStore.fetchList), not a
// preloaded/cached list: companiesStore.items (via fetchAll) is capped at
// 200 rows, newest-first (the backend's own per-page ceiling) — a company
// past that cutoff would otherwise never show up here at all, however
// exactly its name was typed. `ignore-filter` tells USelectMenu the results
// are already server-filtered, so it doesn't additionally hide server
// matches that don't happen to substring-match its own search-term copy.
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
})

const emit = defineEmits(['update:model-value'])

const companiesStore = useCompaniesStore()
const { notifyApiError } = useApiErrorNotifier()
const creating = ref(false)
const searching = ref(false)
const searchTerm = ref('')
const searchResults = ref<Company[]>([])

const runSearch = async (term: string) => {
  searching.value = true
  try {
    const { items } = await companiesStore.fetchList({ search: term || undefined, per_page: 20, sort: 'name' })
    searchResults.value = items
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

// Ensures whatever Company modelValue already points at (e.g. opening the
// edit page for a Lead linked to one) is loaded and thus resolvable to a
// label, even if it's outside the current search results — without this,
// the trigger button would show blank/the raw id until a matching search
// happened to surface it.
const ensureSelectedLoaded = async (id: number) => {
  if (companiesStore.items.some(c => c.id === id) || searchResults.value.some(c => c.id === id)) return
  try {
    await companiesStore.fetchOne(id)
  } catch (err) {
    notifyApiError(err)
  }
}

onMounted(() => {
  runSearch('')
  if (props.modelValue) ensureSelectedLoaded(props.modelValue)
})

watch(() => props.modelValue, (id) => {
  if (id) ensureSelectedLoaded(id)
})

const options = computed<Select[]>(() => {
  const list = [...searchResults.value]
  if (props.modelValue !== null && !list.some(c => c.id === props.modelValue)) {
    const selected = companiesStore.items.find(c => c.id === props.modelValue)
    if (selected) list.unshift(selected)
  }
  return list.map(c => ({ label: c.name, value: c.id }))
})

const onCreate = async (name: string) => {
  creating.value = true
  try {
    // Authoritative server-side check, not just the local cache (findByName
    // over companiesStore.items would miss a match outside whatever's
    // currently loaded) — reuse an existing Company on a case/whitespace-
    // insensitive name match rather than creating a near-duplicate, same
    // check the backend's Lead→Deal convert flow now also does
    // (internal/handlers/leads.go's Convert, api-system-spec.md §3).
    const { items: matches } = await companiesStore.fetchList({ search: name, per_page: 5 })
    const existing = matches.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase())
    const company = existing ?? await companiesStore.add({
      name,
      industry: '',
      size: '',
      revenue_size: '',
      website: '',
      tags: [],
      notes: '',
      status: 'active',
      legal_name: null,
      address: null,
      tax_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    })
    if (!searchResults.value.some(c => c.id === company.id)) searchResults.value = [company, ...searchResults.value]
    emit('update:model-value', company.id)
  } catch (err) {
    notifyApiError(err)
  } finally {
    creating.value = false
  }
}
</script>
