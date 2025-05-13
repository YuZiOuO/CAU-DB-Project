<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { fetchCreateVehicle, fetchUpdateVehicle } from '@/service/api/vehicles'

interface Props {
  visible: boolean
  type?: ModalType
  modalData?: Entity.Vehicle | null // 使用 Entity.Vehicle
}
const {
  visible,
  type = 'add',
  modalData = null,
} = defineProps<Props>()

const emit = defineEmits<Emits>()

// 添加新车辆时的默认表单模型
const defaultFormModal: Omit<Entity.Vehicle, 'vehicle_id'> = {
  make: '',
  model: '',
  year: new Date().getFullYear(), // 默认为当前年份
  license_plate: '',
  status: 'available', // 默认状态
  daily_rate: 0,
  store_id: 0, // 或者一个默认的店铺ID (如果适用)
}
const formModel = ref<Partial<Entity.Vehicle>>({ ...defaultFormModal }) // 使用 Entity.Vehicle

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'success'): void
}

const modalVisible = computed({
  get() {
    return visible
  },
  set(newVisible) {
    closeModal(newVisible)
  },
})

function closeModal(newVisible = false) {
  emit('update:visible', newVisible)
}

type ModalType = 'add' | 'edit'
const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: '添加车辆',
    edit: '编辑车辆',
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
  // 发送到后端的数据
  const dataToSend = {
    make: formModel.value.make || '',
    model: formModel.value.model || '',
    year: formModel.value.year || new Date().getFullYear(),
    license_plate: formModel.value.license_plate || '',
    status: formModel.value.status || 'available',
    daily_rate: formModel.value.daily_rate || 0,
    store_id: formModel.value.store_id || 0, // 确保 store_id 被包含
  }

  try {
    if (type === 'edit') {
      if (formModel.value.vehicle_id === undefined) {
        console.error('更新车辆时缺少车辆ID')
        window.$message.error('更新失败：车辆ID缺失')
        isLoading.value = false
        return
      }
      // TODO: 在全局请求拦截或具体业务场景中处理API返回值校验
      await fetchUpdateVehicle(formModel.value.vehicle_id, dataToSend)
      window.$message.success('车辆信息更新成功')
    }
    else {
      // TODO: 在全局请求拦截或具体业务场景中处理API返回值校验
      await fetchCreateVehicle(dataToSend)
      window.$message.success('车辆添加成功')
    }
    emit('success')
    closeModal()
  }
  catch (error) {
    console.error('提交车辆数据失败:', error)
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
        <n-form-item-grid-item :span="12" label="品牌" path="make">
          <n-input v-model:value="formModel.make" placeholder="请输入车辆品牌" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="型号" path="model">
          <n-input v-model:value="formModel.model" placeholder="请输入车辆型号" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="年份" path="year">
          <n-input-number v-model:value="formModel.year" :show-button="false" placeholder="请输入年份" class="w-full" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="车牌号" path="license_plate">
          <n-input v-model:value="formModel.license_plate" placeholder="请输入车牌号" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="状态" path="status">
          <!-- 考虑为预定义状态使用 n-select -->
          <n-input v-model:value="formModel.status" placeholder="例如: available, rented" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="日租金" path="daily_rate">
          <n-input-number v-model:value="formModel.daily_rate" :min="0" placeholder="请输入日租金" class="w-full">
            <template #prefix>
              ￥
            </template>
          </n-input-number>
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="12" label="所属店铺ID" path="store_id">
          <!-- 考虑使用 n-select 来选择店铺 -->
          <n-input-number v-model:value="formModel.store_id" :min="0" placeholder="请输入店铺ID" class="w-full" />
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
