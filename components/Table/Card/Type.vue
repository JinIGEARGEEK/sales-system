<template>
  <div>
    <div v-if="prop.type === TABLE_CARD_TYPE.MULTI_LINE">
      <TableCardMultiLine
        :items="prop.item"
      />
    </div>
    <div v-else-if="prop.type === TABLE_CARD_TYPE.STATUS">
      <TableCardStatus
        :items="prop.item"
      />
    </div>
    <div v-else-if="prop.type === TABLE_CARD_TYPE.UPDATED_AT">
      <TableCardUpdatedAt
        :items="prop.item"
      />
    </div>
    <div v-else class="whitespace-pre-wrap static-body-sm text-[var(--color-black)]">
      {{ prop.item }}
    </div>
  </div>
</template>

<script setup lang="ts">
import TABLE_CARD_TYPE from '~/constants/tableCardType'

const prop = defineProps({
  type: {
    type: String,
    default: '',
  },
  item: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: [Object, Array, String, Number, Boolean] as PropType<any>,
    default: () => null,
  },
})

</script>
