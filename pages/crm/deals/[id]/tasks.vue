<template>
  <div>
    <ContainerTemplate>
      <div class="mb-4 flex items-center justify-between">
        <CardTitle>{{ t('crm.deals.detail.tasksTitle') }}</CardTitle>
        <ButtonPrimary
          :label="t('crm.deals.detail.addTask')"
          icon="material-symbols:add"
          small
          @click="openAddTask"
        />
      </div>
      <CrmTaskList :tasks="dealTasks" :loading="tasksLoading && dealTasks.length === 0" @edit="openEditTask" />
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

const { tasks: dealTasks, loading: tasksLoading, addTaskOpen, editingTask, openAddTask, openEditTask, onSubmitTask, onUpdateTask } = useTaskList('deal', dealId, 'crm.deals.detail.addTaskSuccess', 'crm.deals.detail.editTaskSuccess')
</script>
