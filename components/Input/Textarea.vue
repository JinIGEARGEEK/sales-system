<template>
  <div :class="$attrs.class">
    <InputFormField
      :model-value="props.modelValue"
      :name="props.name"
      :rules="props.rules"
      :label="props.label"
      :data-cy="props.dataCy"
      @update:model-value="emit('update:model-value', $event)"
    >
      <template #default="{ field, errors, fieldId, errorId }">
        <UTextarea
          :id="fieldId"
          :model-value="props.modelValue"
          v-bind="field"
          :data-cy="props.dataCy"
          :placeholder="props.placeholder"
          :rows="Number(props.rows)"
          :maxlength="props.maxlength"
          :aria-invalid="errors.length > 0"
          :aria-describedby="errors.length ? errorId : undefined"
          class="w-full"
          :ui="{ base: 'text-base' }"
        >
          <slot />
        </UTextarea>
      </template>

      <template #footer="{ errors, errorId }">
        <div
          :class="[
            'flex items-center',
            errors.length ? 'justify-between' : 'justify-end'
          ]"
        >
          <div v-if="errors.length" :id="errorId" class="text-xs text-[var(--color-danger-toast)]" :data-cy="`error-input-${props.dataCy}`">
            {{ errors[0] }}
          </div>
          <div v-if="props.counter" class="text-xs text-[var(--color-dark-gray)]">
            {{ props.modelValue.length }} / {{ props.maxlength }}
          </div>
        </div>
      </template>
    </InputFormField>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  ...useInputBaseProps(),
  rows: {
    type: String,
    default: '10',
  },
  counter: {
    type: Boolean,
    default: false,
  },
  maxlength: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:model-value'])
</script>
