<template>
  <div>
    <div class="static-body-sm text-[var(--color-black)]">
      {{ dateTimeFormat(props.items.updatedAt || '') }}
    </div>
    <div>
      <span class="static-body-xs text-[var(--color-dark-gray)]">
        {{ $t('global.updated.updatedBy') }}
      </span>
      <NuxtLink :to="props.items.updatedById === 0 ? '' : props.items.path">
        <span
          :class="[
            'text-primary',
            props.items.updatedById === 0 ? 'static-body-xs' : 'static-link-sm'
          ]"
        >
          {{ props.items.updatedById === 0 ? '-' : props.items.updatedByName }}
        </span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  items: {
    type: Object as PropType<TableTypeUpdatedAt>,
    default: () => ({}),
  },
})

const { dateTimeFormat } = useFormatter()

</script>
