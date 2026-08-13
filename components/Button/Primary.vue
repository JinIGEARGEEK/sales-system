<template>
  <UButton
    v-bind="$attrs"
    :data-cy="props.dataCy"
    :label="props.label"
    :disabled="disabled"
    :color="props.color"
    :variant="buttonVariant"
    :class="[
      'min-w-24 justify-center rounded-full px-6',
      { 'w-full': props.block },
      { '!min-w-fit': props.fitContent },
      { 'text-sm py-1': props.small },
    ]"
  >
    <slot />
  </UButton>
</template>

<script setup lang="ts">
const props = defineProps({
  dataCy: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: 'primary',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
  flat: {
    type: Boolean,
    default: false,
  },
  outline: {
    type: Boolean,
    default: false,
  },
  fitContent: {
    type: Boolean,
    default: false,
  },
  small: {
    type: Boolean,
    default: false,
  },
})

const buttonVariant = computed(() => {
  if (props.flat) return 'ghost'
  if (props.outline) return 'outline'
  return 'solid'
})
</script>
