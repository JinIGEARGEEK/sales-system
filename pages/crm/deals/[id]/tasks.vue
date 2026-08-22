<template>
  <div>
    <ContainerTemplate>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('crm.deals.detail.tasksTitle') }}</h3>
        <ButtonPrimary
          :label="t('crm.deals.detail.addTask')"
          icon="material-symbols:add"
          small
          @click="openAddTask"
        />
      </div>
      <CrmTaskList :tasks="dealTasks" @toggle="onToggleTask" @remove="onRemoveTask" @edit="openEditTask" />
    </ContainerTemplate>

    <CrmAddTaskModal
      v-model:open="addTaskOpen"
      :task="editingTask"
      @submit="onSubmitTask"
      @update="onUpdateTask"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const dealId = Number(route.params.id)

const { tasks: dealTasks, addTaskOpen, editingTask, openAddTask, openEditTask, onSubmitTask, onUpdateTask, onToggleTask, onRemoveTask } = useTaskList('deal', dealId, 'crm.deals.detail.addTaskSuccess', 'crm.deals.detail.editTaskSuccess')
</script>
