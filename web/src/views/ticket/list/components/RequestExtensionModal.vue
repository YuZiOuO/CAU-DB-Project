<script setup lang="tsx">
import { ref, watch } from 'vue'
import { NDatePicker, NModal } from 'naive-ui'

interface Props {
  show: boolean
  rental: Entity.Rental | null
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'request-extension', payload: { rentalId: number, newDate: string }): void
}>()

const newDate = ref<string | null>(null)
const defaultTimestamp = ref<number | null>(null)

watch(() => props.rental, (currentRental) => {
  if (currentRental) {
    newDate.value = currentRental.expected_return_date
    defaultTimestamp.value = new Date(currentRental.expected_return_date).getTime()
  }
  else {
    newDate.value = null
    defaultTimestamp.value = null
  }
}, { immediate: true })

function isDateDisabled(ts: number) {
  if (!props.rental)
    return true
  return ts <= new Date(props.rental.expected_return_date).getTime()
}

function handlePositiveClick() {
  if (props.rental && newDate.value && newDate.value > props.rental.expected_return_date) {
    emit('request-extension', { rentalId: props.rental.rental_id, newDate: newDate.value })
    emit('update:show', false)
  }
  else {
    window.$message.error('新的归还日期必须晚于当前归还日期')
    // return false; // NModal does not prevent close on its own for positive click
  }
}

function handleClose() {
  emit('update:show', false)
}
</script>

<template>
  <NModal
    :show="show"
    preset="dialog"
    title="请求延长归还日期"
    positive-text="提交请求"
    negative-text="取消"
    @positive-click="handlePositiveClick"
    @negative-click="handleClose"
    @close="handleClose"
    @esc="handleClose"
    @mask-click="handleClose"
  >
    <NDatePicker
      v-model:formatted-value="newDate"
      :default-value="defaultTimestamp || undefined"
      type="date"
      :is-date-disabled="isDateDisabled"
      value-format="yyyy-MM-dd"
      style="width: 100%;"
      clearable
    />
  </NModal>
</template>
