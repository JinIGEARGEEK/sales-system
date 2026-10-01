import type { WritableComputedRef } from 'vue'

// useQuerySyncedRef for a positive whole number (a list's page / per-page):
// a missing, non-numeric or < 1 value in the URL reads as `defaultValue`, and
// `defaultValue` itself is left out of the URL.
export const useQuerySyncedNumber = (key: string, defaultValue: number): WritableComputedRef<number> => {
  const raw = useQuerySyncedRef(key, String(defaultValue))
  return computed({
    get: () => {
      const parsed = Number(raw.value)
      return Number.isInteger(parsed) && parsed >= 1 ? parsed : defaultValue
    },
    set: (value: number) => {
      raw.value = String(value)
    },
  })
}
