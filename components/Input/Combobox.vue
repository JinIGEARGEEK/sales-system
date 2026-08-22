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
        :items="props.options"
        :create-item="createItem"
        :loading="props.loading"
        :disabled="props.disable"
        :size="props.size"
        :aria-invalid="errors.length > 0"
        :aria-describedby="errors.length ? errorId : undefined"
        class="w-full"
        :class="{ 'text-sm': props.small }"
        @update:model-value="emit('update:model-value', $event)"
        @create="emit('update:model-value', $event)"
      >
        <slot />
      </USelectMenu>
    </InputFormField>
  </div>
</template>

<script setup lang="ts">
// A "creatable" combobox: same InputFormField/Vee-Validate wiring as
// InputSelect, but backed by USelectMenu so the user can either pick one of
// `options` (a plain string[] of previously-used values, e.g. existing
// Project names) or type a new value that doesn't exist yet — modelValue
// stays a plain string either way, matching InputText's contract.
const props = defineProps({
  modelValue: {
    type: String as PropType<string | null>,
    default: null,
  },
  ...useInputBaseProps(),
  options: {
    type: Array as PropType<string[]>,
    default: () => ([]),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disable: {
    type: Boolean,
    default: false,
  },
  small: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'md',
  },
  // Only offer "create new" when the typed text doesn't already match an
  // option — matches InputSelect's read-only-list feel while still letting
  // a genuinely new name through.
  createItem: {
    type: [Boolean, String, Object] as PropType<boolean | 'always' | { position?: 'top' | 'bottom', when?: 'empty' | 'always' }>,
    default: () => ({ when: 'empty' }),
  },
})

const emit = defineEmits(['update:model-value'])
</script>
