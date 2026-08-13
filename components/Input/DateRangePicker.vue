<template>
  <InputFormField
    v-slot="{ field }"
    :model-value="props.modelValue?.start"
    :name="props.name"
    :rules="props.rules"
    :label="props.label"
    :data-cy="props.dataCy"
  >
    <UPopover>
      <UInput
        readonly
        v-bind="field"
        :data-cy="dataCy"
        :placeholder="placeholder"
        :model-value="rangeLabel"
        :disabled="disable"
        :ui="{ base: 'truncate pr-8' }"
        class="w-full cursor-pointer"
        style="text-align: left"
      >
        <template #trailing>
          <UIcon name="material-symbols:date-range-outline" class="shrink-0 text-[var(--color-dark-gray)]" />
        </template>
      </UInput>
      <template #content>
        <UCalendar v-model="calendarValue" range class="p-2" />
      </template>
    </UPopover>
  </InputFormField>
</template>

<script setup lang="ts">
import { parseDate } from '@internationalized/date'
import type { DateRange } from 'reka-ui'

const props = defineProps({
  modelValue: {
    type: Object as PropType<{ start: string; end: string } | null>,
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
  placeholder: {
    type: String,
    default: 'DD/MM/YYYY - DD/MM/YYYY',
  },
  dataCy: {
    type: String,
    default: '',
  },
  disable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:model-value'])

const { dateFormat } = useFormatter()

const rangeLabel = computed(() => {
  if (!props.modelValue?.start || !props.modelValue?.end) return ''
  return `${dateFormat(props.modelValue.start)} - ${dateFormat(props.modelValue.end)}`
})

// reka-ui's RangeCalendarRoot only manages its own internal start/end state when its bound
// value is `undefined` ("passive" mode) — passing `null` instead makes it treat the range as
// externally controlled and immediately read `.start` off that `null`, crashing on open. So
// "no range yet" must be represented as `undefined` here, never `null`.
const fromProp = (value: { start: string; end: string } | null): DateRange | undefined => {
  if (!value?.start || !value?.end) return undefined
  try {
    return { start: parseDate(value.start), end: parseDate(value.end) }
  } catch {
    return undefined
  }
}

// A range calendar needs to hold a mid-selection state (start picked, end not yet) while
// the user is clicking through it. Binding the calendar directly to a computed derived from
// props.modelValue would collapse that mid-selection back to empty on every first click,
// since the parent's value isn't a complete range yet — so a plain local ref holds the
// calendar's live state instead, and only fires the parent update once a range completes.
const calendarValue = ref<DateRange | undefined>(fromProp(props.modelValue))

// Guard both directions on value equality, not object identity — fromProp()/emit() build a
// fresh plain object every time, so without this the two watchers would ping-pong forever
// even when the actual dates haven't changed.
watch(() => props.modelValue, (value) => {
  const start = value?.start ?? null
  const end = value?.end ?? null
  const current = calendarValue.value
  if ((current?.start.toString() ?? null) === start && (current?.end.toString() ?? null) === end) return
  calendarValue.value = fromProp(value)
})

watch(calendarValue, (value) => {
  if (!value?.start || !value?.end) return
  const start = value.start.toString()
  const end = value.end.toString()
  if (props.modelValue?.start === start && props.modelValue?.end === end) return
  emit('update:model-value', { start, end })
})
</script>
