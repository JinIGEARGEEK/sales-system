<template>
  <InputFormField
    v-slot="{ field }"
    :model-value="props.modelValue"
    :name="props.name"
    :rules="props.rules"
    :label="props.label"
    :data-cy="props.dataCy"
    @update:model-value="emit('update:model-value', $event)"
  >
    <UInput
      :model-value="props.modelValue"
      v-bind="field"
      :type="showPassword ? 'password' : 'text'"
      :data-cy="dataCy"
      :placeholder="props.placeholder"
      autocomplete="off"
      :class="['w-full', { 'text-sm': props.small }]"
    >
      <template #trailing>
        <UButton
          :icon="showPassword ? 'material-symbols:visibility-off-outline' : 'material-symbols:visibility-outline'"
          variant="ghost"
          color="neutral"
          size="xs"
          @click="showPassword = !showPassword"
        />
      </template>
    </UInput>
  </InputFormField>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: String,
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
  placeholder: {
    type: String,
    default: '',
  },
  small: {
    type: Boolean,
    default: false,
  },
})

const showPassword = ref(true)
const emit = defineEmits(['update:model-value'])
</script>
