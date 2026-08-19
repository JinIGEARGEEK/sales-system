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
        :placeholder="placeholder || undefined"
        :items="props.options"
        :loading="props.loading"
        :disabled="props.disable"
        :size="props.size"
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
  ...useInputBaseProps(),
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
  // Legacy font-size-only tweak (adds `text-sm`) — does NOT change the
  // select's height/padding. Prefer `size` for new call sites; `small` is
  // kept only because many existing forms rely on the font-only look
  // without touching height. Don't pass both on the same select — pair
  // `size="sm"` with a `text-sm` value already built into that variant.
  small: {
    type: Boolean,
    default: false,
  },
  // Real Nuxt UI size variant (`2xs`|`xs`|`sm`|`md`|`lg`|`xl`), forwarded
  // to the underlying USelect — controls height/padding as well as font size.
  size: {
    type: String,
    default: 'md',
  },
})

const emit = defineEmits(['update:model-value'])
</script>
