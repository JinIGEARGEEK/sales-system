<template>
  <div :class="$attrs.class">
    <InputFormField
      v-slot="{ field }"
      :model-value="props.modelValue"
      :name="props.name"
      :rules="props.rules"
      :label="props.label"
      :data-cy="props.dataCy"
      @update:model-value="emit('update:model-value', $event)"
    >
      <USelect
        v-bind="field"
        :model-value="props.modelValue"
        :data-cy="dataCy"
        :placeholder="placeholder"
        :items="props.options"
        :loading="props.loading"
        :disabled="props.disable"
        value-key="value"
        label-key="label"
        class="w-full"
        :class="{ 'text-sm': props.small }"
        @update:model-value="emit('update:model-value', $event)"
      >
        <slot />
      </USelect>
    </InputFormField>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: [String, Number] as PropType<number | string | null>,
    default: null,
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
  options: {
    type: Array as PropType<Select[]>,
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
  placeholder: {
    type: String,
    default: '',
  },
  small: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:model-value'])
</script>
