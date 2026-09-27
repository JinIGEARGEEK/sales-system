<template>
  <!-- Placeholder for a detail page while its record is still loading, so the
       page doesn't flash NotFoundState first. Mirrors the PageHeader row
       (back button, title, badge) and a ContainerTemplate card of fields. -->
  <div role="status" :aria-label="t('global.loading')" aria-busy="true" data-cy="detail-skeleton">
    <div v-if="header" class="mb-4 flex items-center gap-3">
      <USkeleton class="size-6 rounded-full" />
      <USkeleton class="h-6 w-56 max-w-[60%]" />
      <USkeleton class="h-5 w-16 rounded-full" />
    </div>
    <ContainerTemplate>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div v-for="i in fields" :key="i" class="flex flex-col gap-2">
          <USkeleton class="h-3 w-24" />
          <USkeleton class="h-9 w-full" />
        </div>
      </div>
    </ContainerTemplate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

withDefaults(defineProps<{
  // How many label + input placeholders the card shows.
  fields?: number
  // Off for a page that keeps its real PageHeader rendered while loading
  // (admin user detail), so the header row isn't doubled.
  header?: boolean
}>(), {
  fields: 6,
  header: true,
})
</script>
