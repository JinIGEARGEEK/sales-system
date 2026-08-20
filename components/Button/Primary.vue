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
      // Nuxt UI's disabled state only dims opacity — it doesn't stop :hover
      // from still swapping in the hover background/ring, so a disabled
      // button visibly (and confusingly) reacts to mouseover. Kill pointer
      // interaction entirely so hover styles never trigger while disabled.
      'disabled:pointer-events-none',
      { 'w-full': props.block },
      { '!min-w-fit': props.fitContent },
      { 'text-sm py-1': props.small },
      // Nuxt UI's default outline ring is a 50%-opacity ring/50, which reads
      // as barely-there against this app's pastel content background —
      // bump it to a solid, full-opacity ring in the button's own color.
      outlineRingClass,
      // Disabled state dims via opacity alone, so an outline button's ring
      // and label just fade to a washed-out version of their own color
      // (still reads as bluish/reddish) instead of looking neutrally
      // switched off — force both to the app's disabled gray, faded further
      // so the whole button reads as quietly switched off rather than
      // drawing the eye.
      'disabled:ring-(--color-gray)/30 disabled:text-(--color-gray)/40',
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
  // Shorthand for the app's standard "Cancel" button: neutral outline,
  // regardless of `color`/`outline` — Cancel is a dismissive, non-destructive
  // action and shouldn't compete visually with an actually destructive
  // confirm button (see ConfirmDeleteModal).
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

const buttonColor = computed(() => props.cancel ? 'neutral' : props.color)

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
