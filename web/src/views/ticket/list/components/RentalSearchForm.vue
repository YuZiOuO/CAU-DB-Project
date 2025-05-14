<script setup lang="ts">
import { ref } from 'vue'
import type { FormInst, SelectOption } from 'naive-ui'
import { NButton, NFlex, NForm, NFormItem, NInput, NSelect } from 'naive-ui'

interface Props {
  vehicleTypeSelectOptions: SelectOption[]
  vehicleTypesLoading: boolean
  statusOptions: SelectOption[]
}
defineProps<Props>()

const emit = defineEmits<{
  (e: 'search', filters: { userName: string, vehicleType: number[] | null, status: string[] | null }): void
  (e: 'clear'): void
}>()

const searchUserName = ref('')
const searchVehicleType = ref<number[] | null>(null)
const searchStatus = ref<string[] | null>(null)
const searchFormRef = ref<FormInst | null>(null)

function handleSearch() {
  emit('search', {
    userName: searchUserName.value,
    vehicleType: searchVehicleType.value,
    status: searchStatus.value,
  })
}

function handleClear() {
  searchUserName.value = ''
  searchVehicleType.value = null
  searchStatus.value = null
  emit('clear')
}
</script>

<template>
  <NForm ref="searchFormRef" label-placement="left" inline :show-feedback="false">
    <NFlex :wrap="true" :size="[16, 16]" align="center">
      <NFormItem label="用户名称" path="userName">
        <NInput v-model:value="searchUserName" placeholder="按用户名称搜索..." clearable />
      </NFormItem>
      <NFormItem label="车辆类型" path="vehicleType">
        <NSelect
          v-model:value="searchVehicleType"
          placeholder="按车辆类型搜索..."
          :options="vehicleTypeSelectOptions"
          :loading="vehicleTypesLoading"
          multiple
          clearable
          filterable
          style="min-width: 200px;"
        />
      </NFormItem>
      <NFormItem label="状态" path="status">
        <NSelect
          v-model:value="searchStatus"
          placeholder="按状态搜索..."
          :options="statusOptions"
          multiple
          clearable
          style="min-width: 200px;"
        />
      </NFormItem>
      <NFlex class="ml-auto">
        <NButton type="primary" @click="handleSearch">
          搜索
        </NButton>
        <NButton strong secondary @click="handleClear">
          重置
        </NButton>
      </NFlex>
    </NFlex>
  </NForm>
</template>
