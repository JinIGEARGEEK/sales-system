<template>
  <InputFormField
    :model-value="props.modelValue"
    :name="props.name"
    :rules="props.rules"
    :label="props.label"
    :data-cy="props.dataCy"
    @update:model-value="emit('update:model-value', $event)"
  >
    <template v-if="$slots['label-suffix']" #label-suffix>
      <slot name="label-suffix" />
    </template>
    <template #default="{ field, errors, fieldId, errorId }">
      <UInput
        v-bind="field"
        :id="fieldId"
        ref="input"
        :model-value="props.thousands ? displayValue : props.modelValue"
        :data-cy="props.dataCy"
        :placeholder="props.placeholder"
        :type="props.thousands ? 'text' : props.type"
        :inputmode="props.thousands ? 'numeric' : undefined"
        :disabled="props.disable"
        :maxlength="props.maxlength"
        :size="props.size"
        :aria-invalid="errors.length > 0"
        :aria-describedby="errors.length ? errorId : undefined"
        autocomplete="off"
        :class="['w-full', { 'text-sm': props.small }]"
        @keypress="onInput($event)"
        @update:model-value="onUpdateModelValue($event)"
        @input="props.thousands ? onThousandsInput($event) : undefined"
      >
        <slot />
      </UInput>
    </template>
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
  // Displays a whole-number modelValue with thousands separators (e.g.
  // 3000000 -> "3,000,000") while typing, forcing the underlying input to
  // `type="text"` (a native `type="number"` input rejects commas outright,
  // so this can't just be a display-only overlay on top of it). modelValue
  // itself stays a plain number (or null when empty) either way — only the
  // on-screen text gets the separators, via displayValue/onThousandsInput
  // below, not props.modelValue itself.
  thousands: {
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

const onUpdateModelValue = (value: unknown) => {
  // In thousands mode, onThousandsInput below is the only source of truth
  // for what gets emitted — UInput's own update:model-value here would
  // otherwise carry the comma-formatted *display* string (e.g. "3,000,000")
  // straight up as if it were the real value.
  if (props.thousands) return
  emit('update:model-value', value)
}

const formatThousands = (value: string | number): string => {
  if (value === '' || value === null || value === undefined) return ''
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(num) ? '' : num.toLocaleString('en-US')
}

const displayValue = ref(formatThousands(props.modelValue))

// Resyncs from genuinely external changes (a form reset, a store value
// loading in after this field already mounted) — while the user is actively
// typing, onThousandsInput below already keeps displayValue current, so
// this only fires when modelValue changed for some other reason. Gated on
// `thousands` so every other InputText in the app (the vast majority) isn't
// carrying a watcher it has no use for.
if (props.thousands) {
  watch(() => props.modelValue, (value) => {
    const digits = displayValue.value.replace(/[^0-9]/g, '')
    const currentNumeric = digits ? Number(digits) : null
    const incomingNumeric = value === '' || value === null || value === undefined ? null : Number(value)
    if (currentNumeric !== incomingNumeric) displayValue.value = formatThousands(value)
  })
}

// Reformats with separators on every keystroke while preserving cursor
// position — without the manual re-placement below, inserting a comma
// ahead of the cursor (or removing one behind it) would otherwise silently
// snap the cursor to the end of the field on every character typed.
const onThousandsInput = async (event: Event) => {
  const el = event.target as HTMLInputElement
  const cursorBefore = el.selectionStart ?? el.value.length
  const digitsBeforeCursor = el.value.slice(0, cursorBefore).replace(/[^0-9]/g, '').length
  const digitsOnly = el.value.replace(/[^0-9]/g, '')
  const formatted = digitsOnly ? Number(digitsOnly).toLocaleString('en-US') : ''

  displayValue.value = formatted
  emit('update:model-value', digitsOnly ? Number(digitsOnly) : null)

  await nextTick()
  let seen = 0
  let cursorAfter = formatted.length
  for (let i = 0; i < formatted.length; i++) {
    if (/[0-9]/.test(formatted.charAt(i))) seen++
    if (seen === digitsBeforeCursor) {
      cursorAfter = i + 1
      break
    }
  }
  if (digitsBeforeCursor === 0) cursorAfter = 0
  el.setSelectionRange(cursorAfter, cursorAfter)
}
</script>
