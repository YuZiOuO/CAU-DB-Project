<script setup lang="tsx">
import { ref } from 'vue'
import { NDatePicker, NModal, NSpace, NText } from 'naive-ui'

interface Props {
  show: boolean
  rental: Entity.Rental | null
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'reject-extension', payload: { rentalId: number, originalDate: string }): void
}>()

const originalDateInput = ref<string>('')

function handlePositiveClick() {
  if (!props.rental)
    return

  if (!originalDateInput.value) {
    window.$message.error('请输入原始归还日期')
    return
  }
  try {
    const parsedDate = new Date(originalDateInput.value)
    if (Number.isNaN(parsedDate.getTime()))
      throw new Error('Invalid date')
    if (new Date(originalDateInput.value) >= new Date(props.rental.expected_return_date)) {
      window.$message.error('原始归还日期必须早于当前请求的归还日期。')
      return
    }
  }
  catch (e) {
    window.$message.error('原始归还日期格式无效，请使用 YYYY-MM-DD')
    return
  }
  emit('reject-extension', { rentalId: props.rental.rental_id, originalDate: originalDateInput.value })
  emit('update:show', false)
}

function handleClose() {
  originalDateInput.value = ''
  emit('update:show', false)
}
</script>

<template>
  <NModal
    :show="show"
    preset="dialog"
    title="拒绝延期请求"
    positive-text="确认拒绝"
    negative-text="取消"
    @positive-click="handlePositiveClick"
    @negative-click="handleClose"
    @close="handleClose"
    @esc="handleClose"
    @mask-click="handleClose"
  >
    <NSpace vertical>
      <NText>
        当前请求的归还日期: {{ rental?.expected_return_date }}
      </NText>
      <NText>请输入该租借单在发起延期请求前的“原始归还日期”以拒绝延期：</NText>
      <NDatePicker
        v-model:formatted-value="originalDateInput"
        type="date"
        value-format="yyyy-MM-dd"
        placeholder="YYYY-MM-DD"
        style="width: 100%;"
        clearable
      />
    </NSpace>
  </NModal>
</template>
