<template>
  <h3 class="mb-2 flex items-center justify-between border-b border-(--color-light-gray-2) pb-2">
    <span class="text-sm font-semibold text-(--color-black)">{{ title }}</span>
    <NuxtLink
      v-if="linkTo"
      :to="linkTo"
      class="flex items-center gap-0.5 text-xs font-medium text-(--color-primary) hover:underline"
    >
      {{ linkText }}
      <UIcon name="material-symbols:arrow-forward-rounded" class="size-3.5" />
    </NuxtLink>
  </h3>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  // Omit for a title-only header (most dashboard sections); pass both
  // linkTo/linkText to add a "view full report"-style deep link.
  linkTo?: string
  linkText?: string
}>(), {
  linkTo: undefined,
  linkText: undefined,
})
</script>
