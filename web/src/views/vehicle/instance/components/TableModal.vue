<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useVehicleInstanceStore } from '@/store' // 引入 useStoreModule
import { storeToRefs } from 'pinia'

interface Props {
  visible: boolean
  type?: ModalType
  modalData?: Entity.Vehicle | null
}
const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const vehicleInstanceStore = useVehicleInstanceStore()
const { vehicleTypeOptions, isLoadingTypes, storeOptions, isLoadingStores } = storeToRefs(vehicleInstanceStore)

const defaultFormModal: { type_id: number | null, manufacture_date: string, store_id: number | null } = {
  type_id: null,
  manufacture_date: new Date().toISOString().split('T')[0],
  store_id: null, // 新增 store_id
}
const formModel = ref<{ type_id: number | null, manufacture_date: string, vehicle_id?: number, store_id: number | null }>({ ...defaultFormModal })

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
    add: '添加车辆',
    edit: '编辑车辆',
  }
  return titles[props.type || 'add']
})

watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      if (props.type === 'edit' && props.modalData) {
        formModel.value = {
          vehicle_id: props.modalData.vehicle_id,
          type_id: props.modalData.type_id,
          manufacture_date: props.modalData.manufacture_date,
          store_id: props.modalData.store_id,
        }
      }
      else {
        formModel.value = { ...defaultFormModal }
      }
      // Ensure types are loaded if modal is visible and types aren't loaded
      if (vehicleInstanceStore.vehicleTypeOptions.length === 0 && !isLoadingTypes.value) {
        vehicleInstanceStore.loadVehicleTypes()
      }
      // 新增：确保门店选项已加载
      if (vehicleInstanceStore.storeOptions.length === 0 && !isLoadingStores.value) {
        vehicleInstanceStore.loadStoreOptions()
      }
    }
  },
  { immediate: true },
)

const isLoading = ref(false)
async function handleSubmit() {
  isLoading.value = true
  const dataToSubmit = {
    type_id: formModel.value.type_id as number,
    manufacture_date: formModel.value.manufacture_date as string,
    store_id: formModel.value.store_id as number, // 添加 store_id
  }

  if (!dataToSubmit.type_id) {
    window.$message.error('请选择车辆类型')
    isLoading.value = false
    return
  }
  if (!dataToSubmit.manufacture_date) {
    window.$message.error('请输入生产日期')
    isLoading.value = false
    return
  }
  if (!dataToSubmit.store_id) { // 新增：校验 store_id
    window.$message.error('请选择所属门店')
    isLoading.value = false
    return
  }

  try {
    if (props.type === 'edit' && props.modalData && props.modalData.vehicle_id !== undefined) {
      // For edit, only send changed fields or all fields as per backend requirement
      // Backend PUT /vehicles/{id} can handle partial updates for type_id, manufacture_date, store_id
      const updatePayload: Partial<typeof dataToSubmit> = {}
      if (formModel.value.type_id !== props.modalData.type_id)
        updatePayload.type_id = dataToSubmit.type_id
      if (formModel.value.manufacture_date !== props.modalData.manufacture_date)
        updatePayload.manufacture_date = dataToSubmit.manufacture_date
      if (formModel.value.store_id !== props.modalData.store_id)
        updatePayload.store_id = dataToSubmit.store_id

      if (Object.keys(updatePayload).length > 0) {
        await vehicleInstanceStore.updateVehicle(props.modalData.vehicle_id, updatePayload)
      }
      else {
        window.$message.info('没有检测到更改')
        emit('success') // Or handle as no-op
        isLoading.value = false
        return
      }
    }
    else {
      await vehicleInstanceStore.createVehicle(dataToSubmit)
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
        <n-form-item-grid-item :span="12" label="车辆类型" path="type_id">
          <n-select
            v-model:value="formModel.type_id"
            filterable
            placeholder="请选择车辆类型"
            :options="vehicleTypeOptions"
            :loading="isLoadingTypes"
            clearable
          />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="生产日期" path="manufacture_date">
          <n-date-picker
            v-model:formatted-value="formModel.manufacture_date"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择生产日期"
            class="w-full"
          />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="所属门店" path="store_id">
          <n-select
            v-model:value="formModel.store_id"
            filterable
            placeholder="请选择所属门店"
            :options="storeOptions"
            :loading="isLoadingStores"
            clearable
          />
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
