<template>
  <component :is="as" :class="size === 'lg' ? 'text-lg font-medium' : 'text-base font-medium'">
    <slot />
  </component>
</template>

<script setup lang="ts">
// The heading inside a UCard's #header (or a card-like section) — one step
// below the page's `text-xl font-medium` <h2> (design-system.md §3.4).
// `md` (default) is the standard card/section title; `lg` is the Dashboard
// widget cards' slightly larger, lighter title (same as a modal title).
withDefaults(defineProps<{
  size?: 'md' | 'lg'
  as?: 'h3' | 'h4'
}>(), {
  size: 'md',
  as: 'h3',
})
</script>
