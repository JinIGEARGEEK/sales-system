<template>
  <!-- With `active` set (true/false) the card is a toggle button with
  aria-pressed — e.g. the Outstanding Balance aging tiles that filter the
  table below; the caller's @click falls through to the button. -->
  <component
    :is="isToggle ? 'button' : linkTag"
    :to="isToggle ? undefined : linkTo"
    :type="isToggle ? 'button' : undefined"
    :aria-pressed="isToggle ? active : undefined"
    :class="isToggle || to ? 'block w-full text-left transition-shadow hover:shadow-md' : ''"
  >
    <UCard class="relative h-full overflow-hidden" :class="active ? 'ring-2 ring-(--color-primary)' : ''" :ui="{ body: 'p-3' }">
      <div
        v-if="accentGlassClass"
        class="absolute inset-y-0 left-0 w-1/2 backdrop-blur-md"
        :class="accentGlassClass"
      />
      <div class="relative flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-1">
            <!-- `#label` replaces the plain label text (e.g. a status badge). -->
            <slot name="label">
              <p class="truncate text-xs font-medium text-(--color-dark-gray)" :title="label">{{ label }}</p>
            </slot>
            <UTooltip v-if="tooltip" :text="tooltip">
              <UIcon name="material-symbols:info-outline" class="size-3 shrink-0 text-(--color-gray)" />
            </UTooltip>
          </div>
          <p class="mt-0.5 text-xl font-medium" :class="valueClass">
            <slot />
          </p>
          <!-- `reserveHintSpace` (opt-in, not global): reserves this line's
          height even when THIS card has no hint, so it doesn't sit shorter
          than a hint-bearing sibling in the same grid row. Only worth
          turning on for a grid that actually mixes hint and non-hint cards
          (e.g. PipelineOverview's) — every other caller has zero hint cards
          at all, so unconditionally reserving the space there would just add
          dead space to every card for no layout benefit. -->
          <p
            v-if="$slots.hint || reserveHintSpace"
            class="mt-0.5 text-[11px] leading-tight"
            :class="[hintClass, { 'min-h-3.5': reserveHintSpace }]"
          >
            <slot name="hint" />
          </p>
        </div>
        <div v-if="icon" class="flex size-8 shrink-0 items-center justify-center rounded-full" :class="iconBgClass">
          <UIcon :name="icon" class="size-4" :class="iconClass || valueClass" />
        </div>
      </div>
    </UCard>
  </component>
</template>

<script setup lang="ts">
const props = defineProps({
  // Required unless the `#label` slot is used instead.
  label: {
    type: String,
    default: '',
  },
  // Optional Material Symbols icon, shown as a colored chip — pairs a
  // color-only health signal (valueClass) with a shape, not just a hue.
  icon: {
    type: String,
    default: '',
  },
  // Icon color; falls back to valueClass so the two dynamic health cards
  // (Win Rate, Pipeline Coverage) can keep driving both from one prop.
  iconClass: {
    type: String,
    default: '',
  },
  // Chip background tint — a light `/15` opacity wash of the icon's hue,
  // matching the pattern already used for status-colored backgrounds.
  iconBgClass: {
    type: String,
    default: 'bg-(--color-light-gray-1)',
  },
  // A frosted-glass gradient panel covering the card's left ~50% width,
  // e.g. 'bg-gradient-to-r from-(--color-accent-green)/40 to-transparent'.
  // UCard's own `overflow-hidden` clips it to the card's rounded corners.
  accentGlassClass: {
    type: String,
    default: '',
  },
  valueClass: {
    type: String,
    default: '',
  },
  hintClass: {
    type: String,
    default: 'text-(--color-gray)',
  },
  // Explains how the value is calculated (e.g. "Sum of open deal value ×
  // win probability.") — shown via an info icon next to the label rather
  // than inline, so it doesn't compete with the always-visible hint slot
  // above (used for a dynamic on-track/below-target readout, not the
  // static calculation description).
  tooltip: {
    type: String,
    default: '',
  },
  // Optional deep-link target — when set, the whole card becomes a NuxtLink
  // into the filtered list view this stat summarizes, with a hover
  // affordance; omit to keep the card inert, same as before this prop
  // existed. Mirrors CrmMetricBar's own `to` prop; see useOptionalLink.
  to: {
    type: String,
    default: '',
  },
  // Set on every card in a grid where at least one sibling uses the `hint`
  // slot and at least one doesn't — reserves the hint line's height on
  // every card so hint-less ones don't sit shorter than their hint-bearing
  // siblings. Leave false (default) for a grid where no card ever has a
  // hint, so those stay compact instead of gaining unused blank space.
  reserveHintSpace: {
    type: Boolean,
    default: false,
  },
  // Set (true/false) to render the card as a toggle button with
  // aria-pressed and a primary ring while pressed; leave unset for a plain
  // or link card.
  active: {
    type: Boolean,
    default: undefined,
  },
})

const isToggle = computed(() => props.active !== undefined)

const { linkTag, linkTo } = useOptionalLink(toRef(props, 'to'))
</script>
