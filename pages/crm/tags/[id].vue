<template>
  <div class="p-5">
    <div v-if="tag">
      <div class="mb-4">
        <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('crm.tags.detail.heading') }}</h2>
      </div>

      <ContainerTemplate>
        <Form @submit="onSave">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InputText v-model="form.name" :label="t('crm.tags.detail.name')" name="name" rules="required" />
            <InputSelect
              v-model="form.category"
              :options="TAG_CATEGORY_OPTIONS"
              :label="t('crm.tags.detail.category')"
              name="category"
              rules="required"
            />
            <InputSelect
              v-model="form.status"
              :options="TAG_STATUS_FORM_OPTIONS"
              :label="t('crm.tags.detail.status')"
              name="status"
              rules="required"
            />
            <div class="md:col-span-2">
              <InputTextarea v-model="form.description" :label="t('crm.tags.detail.description')" name="description" rules="required" />
            </div>
          </div>

          <div class="mt-4 flex gap-3">
            <ButtonPrimary :label="t('crm.tags.detail.saveChanges')" type="submit" />
            <ButtonPrimary :label="t('crm.tags.create.cancel')" cancel @click="navigateTo('/crm/tags')" />
          </div>
        </Form>
      </ContainerTemplate>
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.tags.detail.tagNotFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TAG_CATEGORY_OPTIONS, TAG_STATUS_FORM_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.tags.detail.pageTitle') })

const route = useRoute()
const { success } = useNotify()
const tagsStore = useTagsStore()

const tagId = Number(route.params.id)
const tag = computed(() => tagsStore.items.find(tg => tg.id === tagId))

const form = reactive({
  name: tag.value?.name || '',
  category: tag.value?.category || '',
  status: tag.value?.status || 'active',
  description: tag.value?.description || '',
})

const onSave = () => {
  if (tag.value) {
    tag.value.name = form.name
    tag.value.category = form.category as TagCategory
    tag.value.status = form.status as TagStatus
    tag.value.description = form.description
  }
  success(t('crm.tags.detail.updateSuccess'))
  navigateTo('/crm/tags')
}
</script>
