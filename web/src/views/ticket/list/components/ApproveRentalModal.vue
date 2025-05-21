<script setup lang="tsx">
import { computed, ref, watch } from 'vue'
import { NModal, NSelect, NSpin } from 'naive-ui'

interface Props {
  show: boolean
  rental: Entity.Rental | null
  vehicleOptions: Array<{ label: string, value: number, type_id: number, store_id: number | undefined }> // Added store_id to vehicleOptions type
  vehicleLoading: boolean
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'approve', payload: { rentalId: number, vehicleId: number }): void
}>()

const selectedVehicleId = ref<number | null>(null)

// Reset selectedVehicleId when modal is opened or rental changes
watch(() => [props.show, props.rental], () => {
  if (props.show) {
    selectedVehicleId.value = null
  }
})

const filteredOptions = computed(() => {
  if (!props.vehicleOptions || !props.rental || !props.rental.rental_store_id)
    return []
  return props.vehicleOptions.filter(
    option =>
      option.type_id === props.rental!.vehicle_type_id
      && option.store_id === props.rental!.rental_store_id, // 确保车辆属于租借门店
  )
})

function handlePositiveClick() {
  if (props.rental && selectedVehicleId.value) {
    emit('approve', { rentalId: props.rental.rental_id, vehicleId: selectedVehicleId.value })
    emit('update:show', false) // Close modal on success
  }
  else {
    if (!props.rental) {
      window.$message.error('租借单信息错误。')
    }
    else if (!selectedVehicleId.value) {
      window.$message.error('请选择一辆车。')
    }
    if (!props.vehicleLoading && filteredOptions.value.length === 0 && props.rental) {
      window.$message.error(`当前租借门店 (ID: ${props.rental.rental_store_id}) 没有符合所请求车辆类型 (ID: ${props.rental.vehicle_type_id}) 且可用的车辆。`)
    }
    return false // Prevent dialog from closing
  }
}

function handleClose() {
  selectedVehicleId.value = null
  emit('update:show', false)
}
</script>

<template>
  <NModal
    :show="show"
    preset="dialog"
    title="批准租借并分配车辆"
    positive-text="确定"
    negative-text="取消"
    @positive-click="handlePositiveClick"
    @negative-click="handleClose"
    @close="handleClose"
    @esc="handleClose"
    @mask-click="handleClose"
  >
    <NSpin :show="vehicleLoading">
      <NSelect
        v-model:value="selectedVehicleId"
        placeholder="请选择车辆"
        :options="filteredOptions"
        filterable
        clearable
        style="width: 100%;"
      />
    </NSpin>
  </NModal>
</template>
