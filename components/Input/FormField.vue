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
          <span :class="errors.length ? 'text-[var(--color-danger-toast)]' : 'text-[var(--color-black)]'">
            {{ label }}
          </span>
          <span v-if="rules.includes('required')" class="text-[var(--color-danger-toast)]">*</span>
        </div>
        <slot :field="field" :errors="errors" />
        <slot name="footer" :errors="errors">
          <div v-if="errors.length" class="text-xs text-[var(--color-danger-toast)] mt-1" :data-cy="`error-input-${dataCy}`">
            {{ errors[0] }}
          </div>
        </slot>
      </div>
    </Field>
  </div>
</template>

<script setup lang="ts">
defineProps({
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
</script>
