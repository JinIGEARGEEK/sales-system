<template>
  <div>
    <ContainerTemplate>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('crm.companies.detail.tasksTitle') }}</h3>
        <ButtonPrimary
          :label="t('crm.companies.detail.addTask')"
          icon="material-symbols:add"
          small
          @click="openAddTask"
        />
      </div>
      <CrmTaskList :tasks="companyTasks" @toggle="onToggleTask" @remove="onRemoveTask" />
    </ContainerTemplate>

    <CrmAddTaskModal
      v-model:open="addTaskOpen"
      @submit="onSubmitTask"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const companyId = Number(route.params.id)

const { tasks: companyTasks, addTaskOpen, openAddTask, onSubmitTask, onToggleTask, onRemoveTask } = useTaskList('company', companyId, 'crm.companies.detail.addTaskSuccess')
</script>
