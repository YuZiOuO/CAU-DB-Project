<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { fetchCreateVehicleType, fetchUpdateVehicleType } from '@/service/api/vehicle_type'

interface Props {
  visible: boolean
  type?: ModalType
  modalData?: Entity.VehicleType | null
}
const {
  visible,
  type = 'add',
  modalData = null,
} = defineProps<Props>()

const emit = defineEmits<Emits>()

// 添加新车辆类型时的默认表单模型
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
    add: '添加车辆类型',
    edit: '编辑车辆类型',
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
    brand: formModel.value.brand || '',
    model: formModel.value.model || '',
    daily_rent_price: formModel.value.daily_rent_price || 0,
  }

  try {
    if (type === 'edit') {
      if (formModel.value.type_id === undefined) {
        console.error('更新车辆类型时缺少类型ID')
        window.$message.error('更新失败：车辆类型ID缺失')
        isLoading.value = false
        return
      }
      // TODO: 在全局请求拦截或具体业务场景中处理API返回值校验
      await fetchUpdateVehicleType(formModel.value.type_id, dataToSend)
      window.$message.success('车辆类型信息更新成功')
    }
    else {
      // TODO: 在全局请求拦截或具体业务场景中处理API返回值校验
      await fetchCreateVehicleType(dataToSend)
      window.$message.success('车辆类型添加成功')
    }
    emit('success')
    closeModal()
  }
  catch (error) {
    console.error('提交车辆类型数据失败:', error)
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
