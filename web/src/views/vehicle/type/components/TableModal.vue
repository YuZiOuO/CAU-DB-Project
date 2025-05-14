<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useVehicleTypeStore } from '@/store'

interface Props {
  visible: boolean
  type?: ModalType
  modalData?: Entity.VehicleType | null
}
const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const vehicleTypeStore = useVehicleTypeStore()

const defaultFormModal: Omit<Entity.VehicleType, 'type_id'> = {
  brand: '',
  model: '',
  daily_rent_price: 0,
}
const formModel = ref<Partial<Entity.VehicleType>>({ ...defaultFormModal })

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
    add: '添加车辆类型',
    edit: '编辑车辆类型',
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
  const dataToSend = {
    brand: formModel.value.brand || '',
    model: formModel.value.model || '',
    daily_rent_price: formModel.value.daily_rent_price || 0,
  }

  try {
    if (props.type === 'edit' && props.modalData && props.modalData.type_id !== undefined) {
      await vehicleTypeStore.updateVehicleType(props.modalData.type_id, dataToSend)
    }
    else {
      await vehicleTypeStore.createVehicleType(dataToSend)
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
    <n-form label-placement="left" :model="formModel" label-align="left" :label-width="100">
      <n-grid :cols="24" :x-gap="18">
        <n-form-item-grid-item :span="12" label="品牌" path="brand">
          <n-input v-model:value="formModel.brand" placeholder="请输入车辆品牌" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="型号" path="model">
          <n-input v-model:value="formModel.model" placeholder="请输入车辆型号" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="日租金" path="daily_rent_price">
          <n-input-number v-model:value="formModel.daily_rent_price" :min="0" placeholder="请输入日租金" class="w-full">
            <template #prefix>
              ￥
            </template>
          </n-input-number>
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
