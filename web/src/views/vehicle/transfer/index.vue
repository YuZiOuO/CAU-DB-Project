<script setup lang="tsx">
import { computed, onMounted } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui'
import { useAuthStore, useVehicleTransferStore } from '@/store' // 引入 useAuthStore
import { storeToRefs } from 'pinia'
import { usePermission } from '@/hooks'
import { useRouter } from 'vue-router'

const vehicleTransferStore = useVehicleTransferStore()
const { displayedItems, loading, itemLoading } = storeToRefs(vehicleTransferStore)
const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)

const { hasPermission } = usePermission()
const router = useRouter()

onMounted(() => {
  // 修改权限检查，允许 admin 和 super 访问
  if (!hasPermission(['super', 'admin'])) {
    router.push('/403')
    return
  }
  vehicleTransferStore.fetchVehicleTransfers()
})

function getStatusType(status: Entity.VehicleTransferStatus) {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'approved':
      return 'info'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

async function handleApprove(transferId: number) {
  await vehicleTransferStore.approveVehicleTransfer(transferId)
}

async function handleComplete(transferId: number) {
  await vehicleTransferStore.completeVehicleTransfer(transferId)
}

async function handleCancel(transferId: number) {
  await vehicleTransferStore.cancelVehicleTransfer(transferId)
}

function canApprove(transfer: Entity.VehicleTransfer) {
  if (userInfo.value?.user?.role?.includes('super')) {
    return true
  }
  if (userInfo.value?.user?.role?.includes('admin') && userInfo.value?.user?.managed_store_id === transfer.source_store_id) {
    return true
  }
  return false
}

function canComplete(transfer: Entity.VehicleTransfer) {
  if (userInfo.value?.user?.role?.includes('super')) {
    return true
  }
  if (userInfo.value?.user?.role?.includes('admin') && userInfo.value?.user?.managed_store_id === transfer.destination_store_id) {
    return true
  }
  return false
}

function canCancel(transfer: Entity.VehicleTransfer) {
  if (userInfo.value?.user?.role?.includes('super')) {
    return true
  }
  if (userInfo.value?.user?.role?.includes('admin')) {
    return userInfo.value?.user?.managed_store_id === transfer.source_store_id || userInfo.value?.user?.managed_store_id === transfer.destination_store_id
  }
  return false
}

const columns: DataTableColumns<Entity.VehicleTransfer> = [
  { title: 'ID', key: 'transfer_id', align: 'center', width: 80 },
  {
    title: '车辆信息',
    key: 'vehicle_info',
    align: 'center',
    render: row =>
      `${row.vehicle?.type?.brand || ''} ${row.vehicle?.type?.model || ''} (ID: ${row.vehicle_id})`,
  },
  { title: '源门店', key: 'source_store.store_name', align: 'center', render: row => row.source_store?.store_name || 'N/A' },
  { title: '目标门店', key: 'destination_store.store_name', align: 'center', render: row => row.destination_store?.store_name || 'N/A' },
  { title: '发起日期', key: 'transfer_date', align: 'center' },
  {
    title: '状态',
    key: 'transfer_status',
    align: 'center',
    render: row => <NTag type={getStatusType(row.transfer_status)}>{row.transfer_status.toUpperCase()}</NTag>,
  },
  { title: '批准人', key: 'approver.name', align: 'center', render: row => row.approver?.name || (row.transfer_status === 'pending' ? '待批准' : 'N/A') },
  { title: '完成日期', key: 'completed_date', align: 'center', render: row => row.completed_date || 'N/A' },
  { title: '备注', key: 'notes', align: 'center', ellipsis: { tooltip: true } },
  {
    title: '操作',
    key: 'actions',
    align: 'center',
    fixed: 'right',
    width: 280,
    render: (row) => {
      const isLoading = computed(() => itemLoading.value[row.transfer_id])
      return (
        <NSpace justify="center">
          {row.transfer_status === 'pending' && canApprove(row) && (
            <NButton
              size="small"
              type="primary"
              loading={isLoading.value}
              onClick={() => handleApprove(row.transfer_id)}
            >
              批准
            </NButton>
          )}
          {row.transfer_status === 'approved' && canComplete(row) && (
            <NButton
              size="small"
              type="success"
              loading={isLoading.value}
              onClick={() => handleComplete(row.transfer_id)}
            >
              完成
            </NButton>
          )}
          {(row.transfer_status === 'pending' || row.transfer_status === 'approved') && canCancel(row) && (
            <NPopconfirm onPositiveClick={() => handleCancel(row.transfer_id)}>
              {{
                default: () => '确认取消该流转请求？',
                trigger: () => (
                  <NButton size="small" type="error" loading={isLoading.value}>
                    取消
                  </NButton>
                ),
              }}
            </NPopconfirm>
          )}
        </NSpace>
      )
    },
  },
]
</script>

<template>
  <NSpace vertical size="large">
    <n-card title="车辆流转管理">
      <!-- <n-form ref="formRef" :model="filterModel" label-placement="left" inline :show-feedback="false">
        <n-flex>
          <n-form-item label="车辆ID" path="vehicleId">
            <n-input v-model:value="filterModel.vehicleId" placeholder="请输入车辆ID" />
          </n-form-item>
          <n-form-item label="状态" path="status">
            <n-select v-model:value="filterModel.status" placeholder="请选择状态" :options="statusOptions" clearable />
          </n-form-item>
          <n-flex class="ml-auto">
            <NButton type="primary" :loading="searchLoading" @click="vehicleTransferStore.applyFilters">
              搜索
            </NButton>
            <NButton strong secondary @click="vehicleTransferStore.resetFilters">
              重置
            </NButton>
          </n-flex>
        </n-flex>
      </n-form> -->
    </n-card>
    <n-card>
      <NSpace vertical size="large">
        <!-- <div class="flex gap-4">
          <NButton type="primary" @click="handleInitiateTransfer">
            <template #icon>
              <icon-park-outline-add-one />
            </template>
            发起新流转
          </NButton>
        </div> -->
        <n-data-table
          :columns="columns"
          :data="displayedItems"
          :loading="loading"
          remote
          :pagination="false"
          scroll-x="1200"
        />
      </NSpace>
    </n-card>
  </NSpace>
</template>

<style scoped>
</style>
