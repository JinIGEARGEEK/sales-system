<template>
  <UCalendar
    v-bind="$attrs"
    :weekday-format="isThai ? 'short' : undefined"
    @update:placeholder="onPlaceholder"
  >
    <template #heading>
      {{ heading }}
    </template>
    <template #week-day="{ day }">
      {{ isThai ? (THAI_WEEKDAYS[EN_SHORT_WEEKDAYS.indexOf(day)] ?? day) : day }}
    </template>
  </UCalendar>
</template>

<script setup lang="ts">
// Thin wrapper around <UCalendar> used by InputDatePicker/InputDateRangePicker.
//
// The text fields show dates in the Buddhist era (dayjs `BBBB`, see
// useFormatter), but UCalendar formats its heading with Nuxt UI's own locale
// (English, since <UApp> isn't given a `locale`), so the popover used to say
// "September 2026" right under a field showing "25/09/2569". This renders
// the heading with the Buddhist-era year in every locale, like the field
// ("กันยายน 2569" / "September 2569"), plus Thai weekday abbreviations in
// the Thai locale.
//
// Display only: the dates flowing through v-model are untouched Gregorian
// `CalendarDate`s, so the picker still emits a plain Gregorian ISO
// `YYYY-MM-DD` — nothing about stored values changes.
import { getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { BUDDHIST_ERA_OFFSET } from '~/composables/utils/useFormatter'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
const { locale } = useI18n()

const isThai = computed(() => locale.value === 'th')

// Reka's `weekdayFormat: 'short'` in its (English) locale yields these, in
// weekday order — used as a lookup key to swap in the Thai abbreviation.
const EN_SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const THAI_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

const initialPlaceholder = (): DateValue => {
  const value = attrs.modelValue as DateValue | { start?: DateValue } | null | undefined
  if (value && 'start' in value && value.start) return value.start
  if (value && 'year' in value) return value
  return today(getLocalTimeZone())
}

// The month currently on screen — Reka emits `update:placeholder` whenever
// the user pages months/years or the selected value moves the view.
const shownMonth = ref<DateValue>(initialPlaceholder())
const onPlaceholder = (value: DateValue) => {
  shownMonth.value = value
}

const heading = computed(() => {
  const month = new Intl.DateTimeFormat(isThai.value ? 'th-TH' : 'en-US', { month: 'long' })
    .format(shownMonth.value.toDate(getLocalTimeZone()))
  return `${month} ${shownMonth.value.year + BUDDHIST_ERA_OFFSET}`
})
</script>
