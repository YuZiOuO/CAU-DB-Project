<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NDatePicker, NPopconfirm, NSelect, NSpace, NTag, useDialog } from 'naive-ui'
import { useAuthStore, useRentalStore } from '@/store'
import { storeToRefs } from 'pinia'

const rentalStore = useRentalStore()
const authStore = useAuthStore()
const dialog = useDialog()

const { displayedItems, loading, itemLoading, vehicleOptions, vehicleLoading } = storeToRefs(rentalStore)
const { userInfo } = storeToRefs(authStore)
// 更新 userRole 计算属性以正确访问嵌套的 role，并确保在 userInfo.value 或 userInfo.value.user 不存在时安全处理
const userRole = computed(() => userInfo.value?.user?.role || [])

onMounted(() => {
  rentalStore.fetchRentalsList()
  rentalStore.fetchVehicleTypes() // Fetch all vehicle types for display
  // Preload vehicle options if user might approve rentals
  // fetchVehicleOptions is assumed to load vehicle data into the store for getVehicleById
  if (userRole.value?.includes('admin') || userRole.value?.includes('super')) {
    rentalStore.fetchVehicleOptions()
  }
})

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

const columns: DataTableColumns<Entity.Rental> = [
  { title: 'ID', key: 'rental_id', align: 'center', width: 80 },
  { title: '用户', key: 'user.name', align: 'center', render: row => row.user?.name || 'N/A' },
  {
    title: '车辆',
    key: 'vehicle',
    align: 'center',
    render: (row) => {
      if (row.vehicle_id && row.vehicle_id !== -1) {
        // Assume rentalStore.getVehicleById and rentalStore.getVehicleTypeById exist
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
        // Assume rentalStore.getVehicleTypeById exists
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
    width: 280,
    render: (row) => {
      // 更新 userRole 的获取方式，从 userInfo.value.user.role 获取
      const userRole = userInfo.value?.user?.role || []
      // 更新 isStoreAdmin 的判断，从 userInfo.value.user.managed_store_id 获取
      const isStoreAdmin = userRole.includes('admin') && userInfo.value?.user?.managed_store_id
      const isSuperAdmin = userRole.includes('super')
      const isAdmin = isStoreAdmin || isSuperAdmin
      // 更新 isOwner 的判断，从 userInfo.value.user.user_id 获取
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
          {canApprove && (
            <NButton size="small" type="primary" loading={itemLoading.value[row.rental_id]} onClick={() => handleApprove(row)}>批准</NButton>
          )}
          {canReturn && (
            <NPopconfirm onPositiveClick={() => rentalStore.returnRental(row.rental_id)}>
              {{ default: () => '确认车辆已归还?', trigger: () => <NButton size="small" type="info" loading={itemLoading.value[row.rental_id]}>归还</NButton> }}
            </NPopconfirm>
          )}
          {canRequestExtension && (
            <NButton size="small" type="warning" loading={itemLoading.value[row.rental_id]} onClick={() => handleRequestExtension(row)}>请求延期</NButton>
          )}
          {canManageExtension && (
            <>
              <NPopconfirm onPositiveClick={() => rentalStore.approveRentalExtension(row.rental_id)}>
                {{ default: () => '批准延期?', trigger: () => <NButton size="small" type="success" loading={itemLoading.value[row.rental_id]}>批准延期</NButton> }}
              </NPopconfirm>
              <NButton size="small" type="error" loading={itemLoading.value[row.rental_id]} onClick={() => handleRejectExtension(row)}>拒绝延期</NButton>
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

function handleApprove(rental: Entity.Rental) {
  let selectedVehicleId: number | null = null

  // 根据当前租借单的 vehicle_type_id 筛选车辆选项
  // vehicleOptions is already from Pinia store.
  // Each option in vehicleOptions should have a 'type_id' property for this filter to work.
  const filteredOptions = computed(() => {
    if (!vehicleOptions.value)
      return []
    // option should have type_id, e.g. { label: string, value: number, type_id: number }
    return vehicleOptions.value.filter(
      option => (option as any).type_id === rental.vehicle_type_id,
    )
  })

  dialog.create({
    title: '批准租借并分配车辆',
    content: () => (
      <NSelect
        placeholder="请选择车辆"
        options={filteredOptions.value} // 使用计算后的筛选选项
        loading={vehicleLoading.value} // 仍然使用全局的车辆选项加载状态
        filterable
        onUpdateValue={(value) => { selectedVehicleId = value }}
      />
    ),
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      if (selectedVehicleId) {
        rentalStore.approveRental(rental.rental_id, selectedVehicleId)
      }
      else {
        if (!vehicleLoading.value && filteredOptions.value.length === 0) {
          window.$message.error(`当前没有符合所请求车辆类型 (ID: ${rental.vehicle_type_id}) 且可用的车辆。`)
        }
        else {
          window.$message.error('请选择一辆车')
        }
        return false // Prevent dialog from closing
      }
    },
  })
}

function handleRequestExtension(rental: Entity.Rental) {
  let newDate: string | null = rental.expected_return_date // Default to current
  const todayTimestamp = new Date(rental.expected_return_date).getTime()

  dialog.create({
    title: '请求延长归还日期',
    content: () => (
      <NDatePicker
        type="date"
        defaultValue={todayTimestamp}
        isDateDisabled={ts => ts <= todayTimestamp} // Must be after current expected return date
        onUpdateFormattedValue={(value) => { newDate = value }}
        valueFormat="yyyy-MM-dd"
        style={{ width: '100%' }}
      />
    ),
    positiveText: '提交请求',
    negativeText: '取消',
    onPositiveClick: () => {
      if (newDate && newDate > rental.expected_return_date) {
        rentalStore.requestRentalExtension(rental.rental_id, newDate)
      }
      else {
        window.$message.error('新的归还日期必须晚于当前归还日期')
        return false
      }
    },
  })
}

function handleRejectExtension(rental: Entity.Rental) {
  // API requires original_return_date. This is problematic as frontend might not have it.
  // For now, we'll prompt or use a placeholder. This needs a better solution.
  // The `rental.expected_return_date` at this point is the *newly requested* date.
  // We need the date *before* the extension was requested.
  let originalDateInput: string = '' // Placeholder for prompt
  dialog.create({
    title: '拒绝延期请求',
    content: () => (
      <NSpace vertical>
        <p>
          当前请求的归还日期:
          {rental.expected_return_date}
        </p>
        <p>请输入该租借单在发起延期请求前的“原始归还日期”以拒绝延期：</p>
        <NDatePicker
          type="date"
          onUpdateFormattedValue={(value) => { originalDateInput = value as string }}
          valueFormat="yyyy-MM-dd"
          placeholder="YYYY-MM-DD"
          style={{ width: '100%' }}
        />
      </NSpace>
    ),
    positiveText: '确认拒绝',
    negativeText: '取消',
    onPositiveClick: () => {
      if (!originalDateInput) {
        window.$message.error('请输入原始归还日期')
        return false
      }
      // Validate originalDateInput format if necessary
      try {
        const parsedDate = new Date(originalDateInput)
        if (isNaN(parsedDate.getTime()))
          throw new Error('Invalid date')
        // Further validation: originalDateInput should ideally be before rental.expected_return_date (the new one)
        if (new Date(originalDateInput) >= new Date(rental.expected_return_date)) {
          window.$message.error('原始归还日期必须早于当前请求的归还日期。')
          return false
        }
      }
      catch (e) {
        window.$message.error('原始归还日期格式无效，请使用 YYYY-MM-DD')
        return false
      }
      rentalStore.rejectRentalExtension(rental.rental_id, originalDateInput)
    },
  })
}
</script>

<template>
  <n-card title="租借单列表">
    <NSpace vertical size="large">
      <n-data-table
        :columns="columns"
        :data="displayedItems"
        :loading="loading"
        :scroll-x="1800"
        remote
        striped
      />
      <!-- Add pagination if needed -->
    </NSpace>
  </n-card>
</template>

<style scoped>
</style>
