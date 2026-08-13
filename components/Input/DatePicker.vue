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
    <UPopover>
      <UInput
        readonly
        v-bind="field"
        :data-cy="dataCy"
        :placeholder="placeholder"
        :model-value="dateOnlyFormat"
        :disabled="disable"
        class="w-full cursor-pointer"
        style="text-align: left"
      >
        <template #trailing>
          <UIcon name="material-symbols:calendar-today-outline" class="text-[var(--color-dark-gray)]" />
        </template>
      </UInput>
      <template #content>
        <UCalendar v-model="calendarValue" class="p-2" />
      </template>
    </UPopover>
  </InputFormField>
</template>

<script setup lang="ts">
import { parseDate } from '@internationalized/date'
import type { CalendarDate } from '@internationalized/date'

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
  placeholder: {
    type: String,
    default: 'DD/MM/YYYY',
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

const { dateFormat } = useFormatter()

const dateOnlyFormat = computed(() => {
  if (props.modelValue) {
    return `${dateFormat(props.modelValue)}`
  }
  return ''
})

const emit = defineEmits(['update:model-value'])

const calendarValue = computed({
  get: () => {
    if (!props.modelValue) return null
    try {
      return parseDate(props.modelValue)
    } catch {
      return null
    }
  },
  set: (value: CalendarDate | null) => {
    emit('update:model-value', value ? value.toString() : '')
  },
})
</script>
