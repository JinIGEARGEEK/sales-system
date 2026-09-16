<template>
  <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
    <div class="flex min-w-0 flex-wrap items-center gap-3">
      <UButton
        icon="material-symbols:arrow-back"
        variant="ghost"
        color="neutral"
        class="cursor-pointer p-0 hover:bg-transparent"
        :aria-label="t('global.back')"
        @click="emit('back')"
      />
      <div v-if="subtitle" class="min-w-0">
        <h2 class="max-w-full truncate text-xl font-black">{{ title }}</h2>
        <p class="text-sm text-(--color-gray)">{{ subtitle }}</p>
      </div>
      <h2 v-else class="max-w-full truncate text-xl font-black">{{ title }}</h2>
      <!-- Badges, status pills, popovers — whatever a caller wants next to the title. -->
      <slot />
    </div>
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  title: string
  // Report pages stack a description line under the title; detail pages
  // (which use the default slot for status badges instead) leave this unset.
  subtitle?: string
}>()

// Caller owns the actual navigation (most pages' own `goBack` from
// useBackNavigation, a couple with a bespoke `navigateTo` target instead) —
// this component only renders the button and reports the click.
const emit = defineEmits<{ back: [] }>()
</script>
