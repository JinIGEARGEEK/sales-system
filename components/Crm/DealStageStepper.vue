<template>
  <!-- One button per active pipeline stage, in configured order. Scrolls
       sideways on a narrow screen (the current stage is scrolled into view)
       instead of wrapping into a ragged block. -->
  <nav
    ref="stripRef"
    class="overflow-x-auto scrollbar-hide"
    :aria-label="t('crm.deals.detail.stageStepper.label')"
    data-cy="deal-stage-stepper"
  >
    <ol class="flex w-max min-w-full items-stretch gap-1">
      <li v-for="(stage, index) in stages" :key="stage.name" class="flex">
        <button
          type="button"
          role="tab"
          :aria-selected="stage.name === current"
          :aria-current="stage.name === current ? 'step' : undefined"
          :disabled="disabled || stage.name === current"
          :title="stage.name === current ? undefined : t('crm.deals.detail.stageStepper.moveTo', { stage: stage.name })"
          :data-cy="`deal-stage-step-${stage.name}`"
          :class="[
            'flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-(--color-primary) md:text-sm',
            stepClass(stage, index),
            stage.name === current ? 'cursor-default' : 'cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
          ]"
          @click="emit('select', stage.name)"
        >
          <UIcon v-if="stepIcon(stage, index)" :name="stepIcon(stage, index)!" class="size-4 shrink-0" aria-hidden="true" />
          {{ stage.name }}
        </button>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// The Deal header's clickable stage strip (pages/crm/deals/[id].vue): picking
// a stage emits `select` — the page does the move through the narrow
// PATCH /deals/:id/stage, with the lost-reason prompt for a Lost stage and
// the Won hand-off for a Won one, exactly like the Kanban board.
const props = defineProps<{
  stages: PipelineStage[]
  current: string
  disabled?: boolean
}>()

const emit = defineEmits<{ select: [stage: string] }>()

const { t } = useI18n()

const currentIndex = computed(() => props.stages.findIndex(s => s.name === props.current))
const currentStage = computed(() => props.stages[currentIndex.value])

// Open stages before the current one read as "done"; a closed (won/lost)
// Deal leaves the open stages neutral, since it didn't necessarily pass
// through each of them.
const isPassed = (stage: PipelineStage, index: number) =>
  !stage.is_won_stage && !stage.is_lost_stage
  && !currentStage.value?.is_won_stage && !currentStage.value?.is_lost_stage
  && index < currentIndex.value

const stepClass = (stage: PipelineStage, index: number) => {
  const isCurrent = stage.name === props.current
  if (stage.is_won_stage) return isCurrent ? 'border-green-600 bg-green-600 text-white' : 'border-green-300 bg-white text-green-700 hover:bg-green-50'
  if (stage.is_lost_stage) return isCurrent ? 'border-red-600 bg-red-600 text-white' : 'border-red-300 bg-white text-red-700 hover:bg-red-50'
  if (isCurrent) return 'border-(--color-primary) bg-(--color-primary) text-white'
  if (isPassed(stage, index)) return 'border-(--color-primary) bg-(--color-primary-bg) text-(--color-primary) hover:bg-white'
  return 'border-(--color-light-gray-2) bg-white text-(--color-dark-gray) hover:border-(--color-primary) hover:text-(--color-primary)'
}

const stepIcon = (stage: PipelineStage, index: number) => {
  if (stage.is_won_stage) return 'material-symbols:check-circle-outline'
  if (stage.is_lost_stage) return 'material-symbols:cancel-outline'
  if (isPassed(stage, index)) return 'material-symbols:check'
  return undefined
}

const stripRef = useTemplateRef<HTMLElement>('stripRef')
useScrollActiveTabIntoView(stripRef, () => props.current)
</script>
