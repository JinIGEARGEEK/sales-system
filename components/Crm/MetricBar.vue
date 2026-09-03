<template>
  <component
    :is="linkTag"
    :to="linkTo"
    class="flex items-center gap-3 rounded-md"
    :class="to ? '-mx-2 px-2 py-0.5 transition-colors hover:bg-[var(--color-light-gray-1)]' : ''"
  >
    <span class="w-32 shrink-0 truncate text-sm">{{ label }}</span>
    <UTooltip :text="tooltip || `${label} — ${percent}%`">
      <div class="h-3 flex-1 overflow-hidden rounded-full bg-[var(--color-light-gray-2)]">
        <div
          class="h-full rounded-full transition-[filter] duration-150 hover:brightness-110"
          :class="barClass"
          :style="`width: ${percent}%`"
        />
      </div>
    </UTooltip>
    <slot />
  </component>
</template>

<script setup lang="ts">
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  percent: {
    type: Number,
    required: true,
  },
  barClass: {
    type: String,
    // See biz_spec/design-system.md §2.6 — deliberately not --color-primary
    // (dark navy reads poorly as a progress-bar fill against a light track).
    default: 'bg-sky-400',
  },
  // Optional hover-tooltip text; falls back to "label — percent%" so every
  // bar gets a hover affordance even where the caller doesn't pass one.
  tooltip: {
    type: String,
    default: '',
  },
  // Optional deep-link target (e.g. `/crm/deals?stage=Qualified`) — when set,
  // the whole row becomes a NuxtLink into the filtered list view behind this
  // bar's data, with a hover affordance; omit to keep the row inert, same as
  // before this prop existed. See useOptionalLink.
  to: {
    type: String,
    default: '',
  },
})

const { linkTag, linkTo } = useOptionalLink(toRef(props, 'to'))
</script>
