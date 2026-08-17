<template>
  <UButton
    v-bind="$attrs"
    :data-cy="props.dataCy"
    :label="props.label"
    :disabled="disabled"
    :color="buttonColor"
    :variant="buttonVariant"
    :loading-auto="props.loadingAuto"
    :class="[
      'min-w-24 justify-center rounded-full px-6',
      { 'w-full': props.block },
      { '!min-w-fit': props.fitContent },
      { 'text-sm py-1': props.small },
      // Nuxt UI's default outline ring is a 50%-opacity ring/50, which reads
      // as barely-there against this app's pastel content background —
      // bump it to a solid, full-opacity ring in the button's own color.
      outlineRingClass,
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
  // Shorthand for the app's standard "Cancel" button: red outline, regardless of `color`/`outline`.
  cancel: {
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
  // Nuxt UI's UButton wraps its own @click handler and shows a spinner +
  // auto-disables while that handler's returned promise is pending — every
  // async onSave/onDelete/onSubmit handler in this app already returns a
  // promise, so this gives every button loading feedback (and prevents
  // double-submit) for free, with zero changes needed at each call site.
  // Pass :loading-auto="false" on the rare button that shouldn't do this
  // (e.g. one whose @click is synchronous but kicks off unrelated async work).
  loadingAuto: {
    type: Boolean,
    default: true,
  },
})

const buttonVariant = computed(() => {
  if (props.cancel) return 'outline'
  if (props.flat) return 'ghost'
  if (props.outline) return 'outline'
  return 'solid'
})

const buttonColor = computed(() => props.cancel ? 'error' : props.color)

// Full literal class names (not a template-string interpolation) so Tailwind's
// static scanner can actually find and generate them — one per Nuxt UI
// semantic color this app uses `outline` with.
const OUTLINE_RING_CLASSES: Record<string, string> = {
  primary: 'bg-white ring-2 ring-primary',
  secondary: 'bg-white ring-2 ring-secondary',
  success: 'bg-white ring-2 ring-success',
  info: 'bg-white ring-2 ring-info',
  warning: 'bg-white ring-2 ring-warning',
  error: 'bg-white ring-2 ring-error',
  neutral: 'bg-white ring-2 ring-neutral',
}
const outlineRingClass = computed(() => {
  if (buttonVariant.value !== 'outline') return ''
  return OUTLINE_RING_CLASSES[buttonColor.value] ?? OUTLINE_RING_CLASSES.neutral
})
</script>
