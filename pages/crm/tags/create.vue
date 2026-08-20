<template>
  <div class="p-5">
    <div class="mb-4">
      <div class="flex items-center gap-3">
        <UButton
          icon="material-symbols:arrow-back"
          variant="ghost"
          color="neutral"
          class="cursor-pointer p-0 hover:bg-transparent"
          :aria-label="t('global.back')"
          @click="goBack()"
        />
        <h2 class="text-xl font-black">{{ t('crm.tags.create.heading') }}</h2>
      </div>
      <p class="text-sm text-[var(--color-gray)]">{{ t('crm.tags.create.subheading') }}</p>
    </div>

    <ContainerTemplate>
      <Form @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InputText
            v-model="form.name"
            :label="t('crm.tags.create.name')"
            :placeholder="t('crm.tags.create.namePlaceholder')"
            name="name"
            rules="required"
          />
          <InputSelect
            v-model="form.category"
            :options="TAG_CATEGORY_OPTIONS"
            :label="t('crm.tags.create.category')"
            :placeholder="t('crm.tags.create.categoryPlaceholder')"
            name="category"
            rules="required"
          />
          <InputSelect
            v-model="form.status"
            :options="TAG_STATUS_FORM_OPTIONS"
            :label="t('crm.tags.create.status')"
            :placeholder="t('crm.tags.create.statusPlaceholder')"
            name="status"
            rules="required"
          />
          <div class="md:col-span-2">
            <InputTextarea
              v-model="form.description"
              :label="t('crm.tags.create.description')"
              :placeholder="t('crm.tags.create.descriptionPlaceholder')"
              name="description"
              rules="required"
            />
          </div>
        </div>

        <div class="mt-4 flex gap-3">
          <ButtonPrimary :label="t('crm.tags.create.createTag')" type="submit" :loading="loading" />
          <ButtonPrimary :label="t('crm.tags.create.cancel')" cancel @click="goBack()" />
        </div>
      </Form>
    </ContainerTemplate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TAG_CATEGORY_OPTIONS, TAG_STATUS_FORM_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.tags.create.pageTitle') })

const { success } = useNotify()
const tagsStore = useTagsStore()
const goBack = useBackNavigation('/crm/tags')

const form = reactive({
  name: '',
  category: '',
  status: 'active',
  description: '',
})

const { loading, guard } = useSubmitGuard()

const onSubmit = guard(async () => {
  await tagsStore.add({
    name: form.name,
    category: form.category as TagCategory,
    status: form.status as TagStatus,
    description: form.description,
  })
  success(t('crm.tags.create.createSuccess'))
  navigateTo('/crm/tags')
})
</script>
