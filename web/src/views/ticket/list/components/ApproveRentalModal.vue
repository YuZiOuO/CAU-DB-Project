<script setup lang="tsx">
import { computed, ref } from 'vue'
import type { SelectOption } from 'naive-ui'
import { NModal, NSelect, NSpin } from 'naive-ui'

interface Props {
  show: boolean
  rental: Entity.Rental | null
  vehicleOptions: SelectOption[]
  vehicleLoading: boolean
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'approve', payload: { rentalId: number, vehicleId: number }): void
}>()

const selectedVehicleId = ref<number | null>(null)

const filteredOptions = computed(() => {
  if (!props.vehicleOptions || !props.rental)
    return []
  return props.vehicleOptions.filter(
    option => (option as any).type_id === props.rental!.vehicle_type_id,
  )
})

function handlePositiveClick() {
  if (props.rental && selectedVehicleId.value) {
    emit('approve', { rentalId: props.rental.rental_id, vehicleId: selectedVehicleId.value })
  }
  else {
    if (!props.vehicleLoading && filteredOptions.value.length === 0 && props.rental) {
      window.$message.error(`当前没有符合所请求车辆类型 (ID: ${props.rental.vehicle_type_id}) 且可用的车辆。`)
    }
    else {
      window.$message.error('请选择一辆车')
    }
    return false // Prevent dialog from closing if handled by NModal's onPositiveClick
  }
  emit('update:show', false) // Close modal on success
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
