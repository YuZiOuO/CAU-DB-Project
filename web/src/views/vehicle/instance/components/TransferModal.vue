<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FormInst, FormRules, SelectOption } from 'naive-ui'
import { useVehicleTransferStore } from '@/store'

interface Props {
  visible: boolean
  vehicleData: Entity.Vehicle | null
  storeOptions: SelectOption[]
}
const props = defineProps<Props>()

const emit = defineEmits<Emits>()
interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'success'): void
}
const vehicleTransferStore = useVehicleTransferStore()

const formRef = ref<FormInst | null>(null)
const defaultFormModel = {
  destination_store_id: null as number | null,
  notes: '',
}
const formModel = ref({ ...defaultFormModel })

const modalVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val),
})

watch(() => props.visible, (val) => {
  if (val) {
    formModel.value = { ...defaultFormModel }
    formRef.value?.restoreValidation()
  }
})

const rules: FormRules = {
  destination_store_id: [
    { required: true, type: 'number', message: '请选择目标门店', trigger: ['blur', 'change'] },
    {
      validator: (rule, value) => {
        if (value === props.vehicleData?.store_id) {
          return new Error('目标门店不能与当前门店相同')
        }
        return true
      },
      trigger: ['blur', 'change'],
    },
  ],
}

const filteredStoreOptions = computed(() => {
  if (!props.vehicleData)
    return props.storeOptions
  return props.storeOptions.filter(option => option.value !== props.vehicleData!.store_id)
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    if (!props.vehicleData) {
      window.$message.error('车辆数据不存在')
      return
    }

    const success = await vehicleTransferStore.createVehicleTransfer({
      vehicle_id: props.vehicleData.vehicle_id,
      source_store_id: props.vehicleData.store_id,
      destination_store_id: formModel.value.destination_store_id!,
      notes: formModel.value.notes || undefined,
    })

    if (success) {
      emit('success')
      modalVisible.value = false
    }
  }
  catch (error) {
    // 校验错误会被naive-ui捕获
    console.error('流转提交错误:', error)
  }
}

function handleCloseModal() {
  modalVisible.value = false
}
</script>

<template>
  <n-modal
    v-model:show="modalVisible"
    preset="card"
    title="发起车辆流转"
    style="width: 600px"
    :mask-closable="false"
    :segmented="{ content: true, action: true }"
    @after-leave="formModel = { ...defaultFormModel }"
  >
    <n-form
      ref="formRef"
      :model="formModel"
      :rules="rules"
      label-placement="left"
      label-width="auto"
    >
      <n-form-item label="当前车辆">
        <n-text>
          {{ vehicleData?.type?.brand }} {{ vehicleData?.type?.model }} (ID: {{ vehicleData?.vehicle_id }})
        </n-text>
      </n-form-item>
      <n-form-item label="当前门店">
        <n-text>
          {{ vehicleData?.store?.store_name }} (ID: {{ vehicleData?.store_id }})
        </n-text>
      </n-form-item>
      <n-form-item label="目标门店" path="destination_store_id">
        <n-select
          v-model:value="formModel.destination_store_id"
          placeholder="请选择目标门店"
          :options="filteredStoreOptions"
          filterable
        />
      </n-form-item>
      <n-form-item label="备注" path="notes">
        <n-input
          v-model:value="formModel.notes"
          type="textarea"
          placeholder="请输入备注信息（可选）"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </n-form-item>
    </n-form>
    <template #action>
      <n-space justify="end">
        <n-button @click="handleCloseModal">
          取消
        </n-button>
        <n-button type="primary" :loading="vehicleTransferStore.loading" @click="handleSubmit">
          确认发起
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
