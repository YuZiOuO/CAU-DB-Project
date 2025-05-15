<script setup lang="tsx">
// 导入所需模块和类型
import { computed, onMounted, ref } from 'vue'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui'
import { useAuthStore, useRentalStore, useVehicleTypeStore } from '@/store'
import { storeToRefs } from 'pinia'
import RentalSearchForm from './components/RentalSearchForm.vue'
import ApproveRentalModal from './components/ApproveRentalModal.vue'
import RequestExtensionModal from './components/RequestExtensionModal.vue'
import RejectExtensionModal from './components/RejectExtensionModal.vue'
import RentalHistoryModal from './components/RentalHistoryModal.vue' // 新增导入

// 初始化 Store
const rentalStore = useRentalStore()
const authStore = useAuthStore()
const vehicleTypeStore = useVehicleTypeStore()

// 从 Store 中获取响应式数据
const { displayedItems, loading, itemLoading, vehicleOptions, vehicleLoading } = storeToRefs(rentalStore)
const { userInfo } = storeToRefs(authStore)
const { items: allVehicleTypes, loading: vehicleTypesLoading } = storeToRefs(vehicleTypeStore)

// 计算当前用户角色
const userRole = computed(() => userInfo.value?.user?.role || [])

// 定义激活的筛选条件
const activeFilterUserName = ref('')
const activeFilterVehicleType = ref<number[] | null>(null)
const activeFilterStatus = ref<string[] | null>(null)

// 计算车辆类型下拉选项
const vehicleTypeSelectOptions = computed<SelectOption[]>(() => {
  if (!allVehicleTypes.value)
    return []
  return allVehicleTypes.value.map(vt => ({
    label: `${vt.brand} ${vt.model}`,
    value: vt.type_id,
  }))
})

// 定义状态下拉选项
const statusOptions: SelectOption[] = [
  { label: '待处理', value: 'pending' },
  { label: '进行中', value: 'active' },
  { label: '已归还', value: 'returned' },
  { label: '已取消', value: 'cancelled' },
  { label: '请求延期中', value: 'extension_requested' },
]

// 处理搜索操作
function handleDoSearch(filters: { userName: string, vehicleType: number[] | null, status: string[] | null }) {
  activeFilterUserName.value = filters.userName
  activeFilterVehicleType.value = filters.vehicleType
  activeFilterStatus.value = filters.status
}

// 处理清除搜索操作
function handleDoClearSearch() {
  activeFilterUserName.value = ''
  activeFilterVehicleType.value = null
  activeFilterStatus.value = null
}

// 计算筛选后的租借单列表
const filteredDisplayedItems = computed(() => {
  const userNameFilter = activeFilterUserName.value.toLowerCase().trim()
  const vehicleTypeIdArray = activeFilterVehicleType.value
  const statusFilterArray = activeFilterStatus.value

  if (!userNameFilter && (!vehicleTypeIdArray || vehicleTypeIdArray.length === 0) && (!statusFilterArray || statusFilterArray.length === 0)) {
    return displayedItems.value
  }

  return displayedItems.value.filter((row) => {
    let matchesUserName = true
    if (userNameFilter) {
      matchesUserName = row.user?.name?.toLowerCase().includes(userNameFilter) ?? false
    }

    let matchesVehicleType = true
    if (vehicleTypeIdArray && vehicleTypeIdArray.length > 0) {
      let vehicleTypeMatched = false
      if (row.vehicle_id && row.vehicle_id !== -1) {
        const vehicle = rentalStore.getVehicleById(row.vehicle_id)
        if (vehicle && vehicle.type_id && vehicleTypeIdArray.includes(vehicle.type_id)) {
          vehicleTypeMatched = true
        }
      }
      if (!vehicleTypeMatched && row.vehicle_type_id && vehicleTypeIdArray.includes(row.vehicle_type_id)) {
        vehicleTypeMatched = true
      }
      matchesVehicleType = vehicleTypeMatched
    }

    let matchesStatus = true
    if (statusFilterArray && statusFilterArray.length > 0) {
      matchesStatus = row.rental_status ? statusFilterArray.includes(row.rental_status) : false
    }

    return matchesUserName && matchesVehicleType && matchesStatus
  })
})

// 组件挂载时获取初始数据
onMounted(() => {
  rentalStore.fetchRentalsList()
  // Ensure vehicle types are fetched for the main list and history modal
  if (vehicleTypeStore.items.length === 0) {
    vehicleTypeStore.fetchVehicleTypes()
  }
  // Ensure vehicle instances are fetched if admin, for approve modal and potentially history details
  if (userRole.value?.includes('admin') || userRole.value?.includes('super')) {
    if (rentalStore.vehicleOptions.length === 0) { // vehicleOptions might be vehicle instances
      rentalStore.fetchVehicleOptions()
    }
  }
})

// 根据租借状态获取对应的标签类型
function getStatusType(status: Entity.RentalStatus) {
  switch (status) {
    case 'pending': return 'warning'
    case 'active': return 'success'
    case 'returned': return 'default'
    case 'cancelled': return 'error'
    case 'extension_requested': return 'info'
    default: return 'default'
  }
}

// 模态框状态管理
const showApproveModal = ref(false)
const showRequestExtensionModal = ref(false)
const showRejectExtensionModal = ref(false)
const showRentalHistoryModal = ref(false) // 新增历史模态框状态
const currentRentalForModal = ref<Entity.Rental | null>(null)

// 打开批准模态框
function openApproveModal(rental: Entity.Rental) {
  currentRentalForModal.value = rental
  showApproveModal.value = true
}

// 处理批准操作
function handleApproveAction(payload: { rentalId: number, vehicleId: number }) {
  rentalStore.approveRental(payload.rentalId, payload.vehicleId)
}

// 打开请求延期模态框
function openRequestExtensionModal(rental: Entity.Rental) {
  currentRentalForModal.value = rental
  showRequestExtensionModal.value = true
}

// 处理请求延期操作
function handleRequestExtensionAction(payload: { rentalId: number, newDate: string }) {
  rentalStore.requestRentalExtension(payload.rentalId, payload.newDate)
}

// 打开拒绝延期模态框
function openRejectExtensionModal(rental: Entity.Rental) {
  currentRentalForModal.value = rental
  showRejectExtensionModal.value = true
}

// 处理拒绝延期操作
function handleRejectExtensionAction(payload: { rentalId: number, originalDate: string }) {
  rentalStore.rejectRentalExtension(payload.rentalId, payload.originalDate)
}

// 新增：打开历史模态框
function openRentalHistoryModal(rental: Entity.Rental) {
  currentRentalForModal.value = rental
  showRentalHistoryModal.value = true
}

// 定义数据表格的列
const columns: DataTableColumns<Entity.Rental> = [
  { title: 'ID', key: 'rental_id', align: 'center', width: 80 },
  { title: '用户', key: 'user.name', align: 'center', render: row => row.user?.name || 'N/A' },
  {
    title: '车辆',
    key: 'vehicle',
    align: 'center',
    render: (row) => {
      if (row.vehicle_id && row.vehicle_id !== -1) {
        const vehicle = rentalStore.getVehicleById(row.vehicle_id)
        if (vehicle && vehicle.type_id) {
          const vehicleType = rentalStore.getVehicleTypeById(vehicle.type_id)
          if (vehicleType)
            return `${vehicleType.brand} ${vehicleType.model}`
          return `车辆ID: ${row.vehicle_id} (类型未知)`
        }
        return `车辆ID: ${row.vehicle_id} (加载中...)`
      }
      return row.rental_status === 'pending' ? '待分配' : 'N/A'
    },
  },
  {
    title: '请求车辆类型',
    key: 'requested_vehicle_type',
    align: 'center',
    render: (row) => {
      if (row.vehicle_type_id) {
        const vehicleType = rentalStore.getVehicleTypeById(row.vehicle_type_id)
        if (vehicleType && vehicleType.brand && vehicleType.model) {
          return `${vehicleType.brand} ${vehicleType.model}`
        }
        return `类型ID: ${row.vehicle_type_id}`
      }
      return 'N/A'
    },
  },
  { title: '租借日期', key: 'rental_date', align: 'center' },
  { title: '预计归还日期', key: 'expected_return_date', align: 'center' },
  { title: '租借门店', key: 'rental_store.store_name', align: 'center', render: row => row.rental_store?.store_name || 'N/A' },
  { title: '归还门店', key: 'return_store.store_name', align: 'center', render: row => row.return_store?.store_name || 'N/A' },
  {
    title: '状态',
    key: 'rental_status',
    align: 'center',
    render: row => <NTag type={getStatusType(row.rental_status)}>{row.rental_status}</NTag>,
  },
  { title: '是否逾期', key: 'is_overdue', align: 'center', render: row => (row.is_overdue ? <NTag type="error">是</NTag> : '否') },
  {
    title: '操作',
    key: 'actions',
    align: 'center',
    fixed: 'right',
    width: 280, // Adjusted width if needed
    render: (row) => {
      const userRoleVal = userInfo.value?.user?.role || []
      const isStoreAdmin = userRoleVal.includes('admin') && userInfo.value?.user?.managed_store_id
      const isSuperAdmin = userRoleVal.includes('super')
      const isAdmin = isStoreAdmin || isSuperAdmin
      const isOwner = row.user_id === userInfo.value?.user?.user_id

      const canApprove = isAdmin && row.rental_status === 'pending'
        && (isSuperAdmin || (isStoreAdmin && row.rental_store_id === userInfo.value?.user?.managed_store_id))

      const canReturn = isAdmin && row.rental_status === 'active'
        && (isSuperAdmin || (isStoreAdmin && row.return_store_id === userInfo.value?.user?.managed_store_id))

      const canRequestExtension = isOwner && row.rental_status === 'active'

      const canManageExtension = isAdmin && row.rental_status === 'extension_requested'
        && (isSuperAdmin || (isStoreAdmin && userInfo.value?.user?.managed_store_id && (row.rental_store_id === userInfo.value.user.managed_store_id || row.return_store_id === userInfo.value.user.managed_store_id)))

      const canCancelUser = isOwner && row.rental_status === 'pending'
      const canCancelAdmin = isAdmin && row.rental_status !== 'returned' && row.rental_status !== 'cancelled'
        && (isSuperAdmin || (isStoreAdmin && userInfo.value?.user?.managed_store_id && (row.rental_store_id === userInfo.value.user.managed_store_id || row.return_store_id === userInfo.value.user.managed_store_id)))

      return (
        <NSpace justify="center">
          <NButton size="small" type="default" onClick={() => openRentalHistoryModal(row)}>查看</NButton>
          {canApprove && (
            <NButton size="small" type="primary" loading={itemLoading.value[row.rental_id]} onClick={() => openApproveModal(row)}>批准</NButton>
          )}
          {canReturn && (
            <NPopconfirm onPositiveClick={() => rentalStore.returnRental(row.rental_id)}>
              {{ default: () => '确认车辆已归还?', trigger: () => <NButton size="small" type="info" loading={itemLoading.value[row.rental_id]}>归还</NButton> }}
            </NPopconfirm>
          )}
          {canRequestExtension && (
            <NButton size="small" type="warning" loading={itemLoading.value[row.rental_id]} onClick={() => openRequestExtensionModal(row)}>请求延期</NButton>
          )}
          {canManageExtension && (
            <>
              <NPopconfirm onPositiveClick={() => rentalStore.approveRentalExtension(row.rental_id)}>
                {{ default: () => '批准延期?', trigger: () => <NButton size="small" type="success" loading={itemLoading.value[row.rental_id]}>批准延期</NButton> }}
              </NPopconfirm>
              <NButton size="small" type="error" loading={itemLoading.value[row.rental_id]} onClick={() => openRejectExtensionModal(row)}>拒绝延期</NButton>
            </>
          )}
          {(canCancelUser || canCancelAdmin) && (
            <NPopconfirm onPositiveClick={() => rentalStore.cancelRental(row.rental_id)}>
              {{ default: () => '确认取消此租借单?', trigger: () => <NButton size="small" type="error" loading={itemLoading.value[row.rental_id]}>取消</NButton> }}
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
    <n-card :bordered="false">
      <RentalSearchForm
        :vehicle-type-select-options="vehicleTypeSelectOptions"
        :vehicle-types-loading="vehicleTypesLoading"
        :status-options="statusOptions"
        @search="handleDoSearch"
        @clear="handleDoClearSearch"
      />
    </n-card>

    <n-card title="租借单列表">
      <n-data-table
        :columns="columns"
        :data="filteredDisplayedItems"
        :loading="loading"
        :scroll-x="1800"
        remote
        striped
      />
    </n-card>

    <ApproveRentalModal
      v-model:show="showApproveModal"
      :rental="currentRentalForModal"
      :vehicle-options="vehicleOptions"
      :vehicle-loading="vehicleLoading"
      @approve="handleApproveAction"
    />
    <RequestExtensionModal
      v-model:show="showRequestExtensionModal"
      :rental="currentRentalForModal"
      @request-extension="handleRequestExtensionAction"
    />
    <RejectExtensionModal
      v-model:show="showRejectExtensionModal"
      :rental="currentRentalForModal"
      @reject-extension="handleRejectExtensionAction"
    />
    <RentalHistoryModal
      v-model:show="showRentalHistoryModal"
      :rental="currentRentalForModal"
    />
  </NSpace>
</template>

<style scoped>
</style>
