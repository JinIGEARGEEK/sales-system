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
        :model-value="props.modelValue"
        :data-cy="dataCy"
        :placeholder="placeholder || undefined"
        :items="options"
        value-key="value"
        label-key="label"
        :create-item="{ when: 'empty' }"
        :loading="props.loading || creating"
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

onMounted(() => {
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
})

const options = computed<Select[]>(() => companiesStore.items.map(c => ({ label: c.name, value: c.id })))

const onCreate = async (name: string) => {
  creating.value = true
  try {
    // Reuse an existing Company on a case/whitespace-insensitive name match
    // (companiesStore.findByName) rather than creating a near-duplicate —
    // same check the backend's Lead→Deal convert flow now also does
    // (internal/handlers/leads.go's Convert, api-system-spec.md §3).
    const existing = companiesStore.findByName(name)
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
    emit('update:model-value', company.id)
  } catch (err) {
    notifyApiError(err)
  } finally {
    creating.value = false
  }
}
</script>
