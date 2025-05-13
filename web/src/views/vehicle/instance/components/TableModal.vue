<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { fetchCreateVehicle, fetchUpdateVehicle } from '@/service/api/vehicles'
import { fetchGetVehicleTypes } from '@/service/api/vehicle_type'
import { fetchGetStores } from '@/service/api/stores'
import type { SelectOption } from 'naive-ui'

interface Props {
  visible: boolean
  type?: ModalType
  modalData?: Entity.Vehicle | null
}
const {
  visible,
  type = 'add',
  modalData = null,
} = defineProps<Props>()

const emit = defineEmits<Emits>()

// 获取车辆类型和店铺列表
const vehicleTypeOptions = ref<SelectOption[]>([])
const storeOptions = ref<SelectOption[]>([])
const isLoadingTypes = ref(false)
const isLoadingStores = ref(false)

async function loadVehicleTypes() {
  isLoadingTypes.value = true
  try {
    const res: any = await fetchGetVehicleTypes()
    if (res.data) {
      vehicleTypeOptions.value = res.data.map((vt: Entity.VehicleType) => ({
        label: `${vt.brand} ${vt.model} (￥${vt.daily_rent_price.toFixed(2)})`,
        value: vt.type_id,
      }))
    }
  }
  catch (error) {
    console.error('获取车辆类型失败:', error)
    window.$message.error('获取车辆类型失败')
  }
  finally {
    isLoadingTypes.value = false
  }
}

async function loadStores() {
  isLoadingStores.value = true
  try {
    const res: any = await fetchGetStores() // 假设 fetchGetStores 返回 Entity.Store[]
    if (res.data) {
      storeOptions.value = res.data.map((s: Entity.Store) => ({
        label: s.store_name,
        value: s.store_id,
      }))
    }
  }
  catch (error) {
    console.error('获取店铺列表失败:', error)
    window.$message.error('获取店铺列表失败')
  }
  finally {
    isLoadingStores.value = false
  }
}

// 调整表单模型以匹配新的 Entity.Vehicle 结构和后端API期望
const defaultFormModal: Omit<Entity.Vehicle, 'vehicle_id' | 'type'> = {
  type_id: 0, // 将被 n-select 填充
  manufacture_date: new Date().toISOString().split('T')[0], // 默认为当天 YYYY-MM-DD
}
const formModel = ref<Partial<Entity.Vehicle>>({ ...defaultFormModal })

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
      if (modalData) {
        formModel.value = {
          vehicle_id: modalData.vehicle_id,
          type_id: modalData.type_id,
          manufacture_date: modalData.manufacture_date,
        }
      }
    },
  }
  handlers[type]()
}

watch(
  () => visible,
  (newValue) => {
    if (newValue) {
      UpdateFormModelByModalType()
      if (vehicleTypeOptions.value.length === 0) {
        loadVehicleTypes()
      }
      if (storeOptions.value.length === 0) {
        loadStores()
      }
    }
  },
)

const isLoading = ref(false)
async function handleSubmit() {
  isLoading.value = true
  // 构建发送到后端的数据，严格按照后端API要求
  const dataToSend = {
    type_id: formModel.value.type_id as number,
    manufacture_date: formModel.value.manufacture_date as string,
  }

  // 校验关键字段
  if (!dataToSend.type_id) {
    window.$message.error('请选择车辆类型')
    isLoading.value = false
    return
  }
  if (!dataToSend.manufacture_date) {
    window.$message.error('请输入生产日期')
    isLoading.value = false
    return
  }

  try {
    if (type === 'edit') {
      if (formModel.value.vehicle_id === undefined) {
        console.error('更新车辆时缺少车辆ID')
        window.$message.error('更新失败：车辆ID缺失')
        isLoading.value = false
        return
      }
      await fetchUpdateVehicle(formModel.value.vehicle_id, dataToSend)
      window.$message.success('车辆信息更新成功')
    }
    else {
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
        <!-- 移除了车牌号、状态和所属店铺的表单项 -->
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
