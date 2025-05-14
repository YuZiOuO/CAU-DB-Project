<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStoreModule } from '@/store'

interface Props {
  visible: boolean
  type?: ModalType
  modalData?: Entity.Store | null
}
const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const storeModule = useStoreModule()

const defaultFormModal: Omit<Entity.Store, 'store_id'> = {
  store_name: '',
  address: '',
  phone_number: '',
}
const formModel = ref<Partial<Entity.Store>>({ ...defaultFormModal })

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'success'): void
}

const modalVisible = computed({
  get() {
    return props.visible
  },
  set(newVisible) {
    emit('update:visible', newVisible)
  },
})

function handleCloseModal() {
  emit('update:visible', false)
}

type ModalType = 'add' | 'edit'
const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: '添加门店',
    edit: '编辑门店',
  }
  return titles[props.type || 'add']
})

watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      if (props.type === 'edit' && props.modalData) {
        formModel.value = { ...props.modalData }
      }
      else {
        formModel.value = { ...defaultFormModal }
      }
    }
  },
  { immediate: true },
)

const isLoading = ref(false)
async function handleSubmit() {
  isLoading.value = true
  // Ensure phone_number is not null, provide default if necessary
  const dataToSend: Omit<Entity.Store, 'store_id'> = {
    store_name: formModel.value.store_name || '',
    address: formModel.value.address || '',
    phone_number: formModel.value.phone_number || '',
  }

  try {
    if (props.type === 'edit' && props.modalData && props.modalData.store_id !== undefined) {
      await storeModule.updateStore(props.modalData.store_id, dataToSend)
    }
    else {
      await storeModule.createStore(dataToSend)
    }
    emit('success')
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
        <n-button @click="handleCloseModal">
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
