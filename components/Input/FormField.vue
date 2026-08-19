<template>
  <div>
    <Field
      v-slot="{ field, errors }"
      :model-value="modelValue"
      :name="name"
      :label="label || undefined"
      :rules="rules"
      @update:model-value="emit('update:model-value', $event)"
    >
      <div>
        <div v-if="label" class="mb-1 text-sm">
          <label :for="fieldId" :class="errors.length ? 'text-[var(--color-danger-toast)]' : 'text-[var(--color-black)]'">
            {{ label }}
          </label>
          <span v-if="rules.includes('required')" class="text-[var(--color-danger-toast)]">*</span>
        </div>
        <slot :field="field" :errors="errors" :field-id="fieldId" :error-id="errorId" />
        <slot name="footer" :errors="errors">
          <div v-if="errors.length" :id="errorId" class="text-xs text-[var(--color-danger-toast)] mt-1" :data-cy="`error-input-${dataCy}`">
            {{ errors[0] }}
          </div>
        </slot>
      </div>
    </Field>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: [String, Number] as PropType<string | number | null>,
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  rules: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  dataCy: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:model-value'])

// Stable ids so the label/error text can be programmatically associated with
// whichever Nuxt UI primitive the caller renders in the default slot (via
// `:id="fieldId"` / `:aria-describedby="errorId"`) — `name` is required by
// Vee-Validate to be unique within a form already, so it doubles as a safe id
// source; `useId()` only covers the rare case a wrapper is used without one.
const generatedId = useId()
const fieldId = computed(() => `input-${props.name || generatedId}`)
const errorId = computed(() => `error-input-${props.dataCy || props.name || generatedId}`)
</script>
