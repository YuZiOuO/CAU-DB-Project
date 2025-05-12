<script setup lang="ts">
import { fetchCreateStores } from '@/service/api/stores'

interface Props {
  visible: boolean
  type?: ModalType
  modalData?: any
}
const {
  visible,
  type = 'add',
  modalData = null,
} = defineProps<Props>()

const emit = defineEmits<Emits>()
const defaultFormModal: Entity.Store = {
  store_id: 0, // 懒得删了
  store_name: '',
  address: '',
  phone_number: '',
}
const formModel = ref({ ...defaultFormModal })

interface Emits {
  (e: 'update:visible', visible: boolean): void
}

const modalVisible = computed({
  get() {
    return visible
  },
  set(visible) {
    closeModal(visible)
  },
})
function closeModal(visible = false) {
  emit('update:visible', visible)
}
type ModalType = 'add' | 'edit'
const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: '添加门店',
    edit: '编辑门店',
  }
  return titles[type]
})

function UpdateFormModelByModalType() {
  const handlers = {
    add: () => {
      formModel.value = { ...defaultFormModal }
    },
    edit: () => {
      if (modalData)
        formModel.value = { ...modalData }
    },
  }
  handlers[type]()
}
watch(
  () => visible,
  (newValue) => {
    if (newValue)
      UpdateFormModelByModalType()
  },
)

const isLoading = ref(false)
async function handleSubmit() {
  isLoading.value = true
  await fetchCreateStores(formModel.value)
  isLoading.value = false
  closeModal()
}
</script>

<template>
  <n-modal
    v-model:show="modalVisible"
    :mask-closable="false"
    preset="card"
    :title="title"
    class="w-700px"
    :segmented="{
      content: true,
      action: true,
    }"
  >
    <n-form label-placement="left" :model="formModel" label-align="left" :label-width="80">
      <n-grid :cols="24" :x-gap="18">
        <n-form-item-grid-item :span="12" label="id" path="name">
          <n-input-number v-model:value="formModel.store_id" :show-button="false" :disabled="true" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="名称" path="age">
          <n-input v-model:value="formModel.store_name" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="地址" path="gender">
          <n-input v-model:value="formModel.address" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="电话" path="email">
          <n-input v-model:value="formModel.phone_number" />
        </n-form-item-grid-item>
      </n-grid>
    </n-form>
    <template #action>
      <n-space justify="center">
        <n-button @click="closeModal()">
          取消
        </n-button>
        <n-button type="primary" :loading="isLoading" @click="handleSubmit">
          提交
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped></style>
