<template>
  <InputFormField
    v-slot="{ field, errors, fieldId, errorId }"
    :model-value="props.modelValue"
    :name="props.name"
    :rules="props.rules"
    :label="props.label"
    :data-cy="props.dataCy"
    @update:model-value="emit('update:model-value', $event)"
  >
    <UInput
      v-bind="field"
      :id="fieldId"
      ref="input"
      :model-value="props.modelValue"
      :data-cy="props.dataCy"
      :placeholder="props.placeholder"
      :type="props.type"
      :disabled="props.disable"
      :maxlength="props.maxlength"
      :size="props.size"
      :aria-invalid="errors.length > 0"
      :aria-describedby="errors.length ? errorId : undefined"
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
  ...useInputBaseProps(),
  disable: {
    type: Boolean,
    default: false,
  },
  // Legacy font-size-only tweak (adds `text-sm`) — does NOT change the
  // input's height/padding. Prefer `size` for new call sites; `small` is
  // kept only because many existing forms rely on the font-only look
  // without touching height. Don't pass both on the same input — pair
  // `size="sm"` with a `text-sm` value already built into that variant.
  small: {
    type: Boolean,
    default: false,
  },
  // Real Nuxt UI size variant (`2xs`|`xs`|`sm`|`md`|`lg`|`xl`), forwarded
  // to the underlying UInput — controls height/padding as well as font size.
  size: {
    type: String,
    default: 'md',
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
