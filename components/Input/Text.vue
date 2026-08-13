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
      ref="input"
      v-bind="field"
      :model-value="props.modelValue"
      :data-cy="props.dataCy"
      :placeholder="props.placeholder"
      :type="props.type"
      :disabled="props.disable"
      :maxlength="props.maxlength"
      autocomplete="off"
      :class="['w-full', { 'text-sm': props.small }]"
      @keypress="onInput($event)"
      @update:model-value="emit('update:model-value', $event)"
    >
      <slot />
    </UInput>
  </InputFormField>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: [String, Number],
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
  disable: {
    type: Boolean,
    default: false,
  },
  small: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'text',
  },
  maxlength: {
    type: String,
    default: '',
  },
  isThOnly: {
    type: Boolean,
    default: false,
  },
  isEnOnly: {
    type: Boolean,
    default: false,
  },
})

const input = ref()
const emit = defineEmits(['update:model-value'])

const onInput = (event: KeyboardEvent) => {
  if (props.isThOnly || props.isEnOnly) {
    const char = String.fromCharCode(event.keyCode)
    const regex = props.isThOnly ? /^[ก-์\s]+$/ : /^[a-zA-Z\s]+$/
    if (regex.test(char)) {
      return true
    } else {
      event.preventDefault()
    }
  }
}
</script>
