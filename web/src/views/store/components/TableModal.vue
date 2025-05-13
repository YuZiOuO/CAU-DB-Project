<script setup lang="ts">
import { fetchCreateStores, fetchUpdateStore } from '@/service/api/stores'

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
const defaultFormModal: Omit<Entity.Store, 'store_id'> = {
  store_name: '',
  address: '',
  phone_number: '',
}
const formModel = ref<Partial<Entity.Store>>({ ...defaultFormModal })

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'success'): void // Add success event
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
  // TODO: 在全局请求拦截或具体业务场景中处理API返回值校验
  const dataToSend: { store_name: string, address: string, phone_number: string } = {
    store_name: formModel.value.store_name || '',
    address: formModel.value.address || '',
    phone_number: formModel.value.phone_number || '',
  }

  try {
    if (type === 'edit') {
      if (formModel.value.store_id === undefined) {
        // Should not happen if modalData is correctly passed for edit mode
        console.error('Store ID is missing for update')
        window.$message.error('更新失败：门店ID缺失')
        isLoading.value = false
        return
      }
      // TODO: 在全局请求拦截或具体业务场景中处理API返回值校验
      await fetchUpdateStore(formModel.value.store_id, dataToSend)
      window.$message.success('门店信息更新成功')
    }
    else {
      // TODO: 在全局请求拦截或具体业务场景中处理API返回值校验
      await fetchCreateStores(dataToSend)
      window.$message.success('门店添加成功')
    }
    emit('success') // Emit success event
    closeModal()
  }
  catch (error) {
    console.error('Failed to submit store data:', error)
    window.$message.error(type === 'edit' ? '更新失败' : '添加失败')
  }
  finally {
    isLoading.value = false
  }
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
        <n-form-item-grid-item :span="12" label="名称" path="store_name">
          <n-input v-model:value="formModel.store_name" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="地址" path="address">
          <n-input v-model:value="formModel.address" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="电话" path="phone_number">
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
