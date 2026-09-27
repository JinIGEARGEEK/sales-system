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
    <UPopover>
      <UInput
        :id="fieldId"
        readonly
        v-bind="omitFieldValue(field)"
        :data-cy="dataCy"
        :placeholder="placeholder || t('global.input.datePlaceholder')"
        :model-value="dateOnlyFormat"
        :disabled="disable"
        :aria-invalid="errors.length > 0"
        :aria-describedby="errors.length ? errorId : undefined"
        class="w-full cursor-pointer"
        style="text-align: left"
      >
        <template #trailing>
          <UIcon name="material-symbols:calendar-today-outline" class="text-(--color-dark-gray)" />
        </template>
      </UInput>
      <template #content>
        <InputCalendar v-model="calendarValue" class="p-2" />
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
  ...useInputBaseProps(),
  disable: {
    type: Boolean,
    default: false,
  },
})

// The default placeholder (global.input.date*Placeholder) mirrors the
// Buddhist-era date the field shows.
const { t } = useI18n()
const { dateFormat } = useFormatter()

const dateOnlyFormat = computed(() => {
  if (props.modelValue) {
    return `${dateFormat(props.modelValue)}`
  }
  return ''
})

const emit = defineEmits(['update:model-value'])

// Same fix as InputText's: vee-validate's `field.value` (the raw
// 'YYYY-MM-DD') would otherwise fall through onto the native <input> and win
// over the Buddhist-era `dateOnlyFormat` shown via :model-value, so a
// prefilled date (an edit modal, a "today" default) read "2026-09-27"
// instead of "27/09/2569".
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const omitFieldValue = (field: any) => {
  const { value: _value, ...rest } = field
  return rest
}

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
