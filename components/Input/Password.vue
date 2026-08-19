<template>
  <InputFormField
    v-slot="{ field }"
    :model-value="props.modelValue"
    :name="props.name"
    :rules="props.rules"
    :label="props.label"
    :data-cy="props.dataCy"
    @update:model-value="emit('update:model-value', $event)"
  >
    <UInput
      :model-value="props.modelValue"
      v-bind="field"
      :type="showPassword ? 'password' : 'text'"
      :data-cy="dataCy"
      :placeholder="props.placeholder"
      autocomplete="off"
      :class="['w-full', { 'text-sm': props.small }]"
    >
      <template #trailing>
        <UButton
          :icon="showPassword ? 'material-symbols:visibility-off-outline' : 'material-symbols:visibility-outline'"
          :aria-label="showPassword ? t('global.input.showPassword') : t('global.input.hidePassword')"
          variant="ghost"
          color="neutral"
          size="xs"
          @click="showPassword = !showPassword"
        />
      </template>
    </UInput>
  </InputFormField>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  ...useInputBaseProps(),
  small: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()
const showPassword = ref(true)
const emit = defineEmits(['update:model-value'])
</script>
