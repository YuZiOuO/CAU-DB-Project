<script setup lang="tsx">
import { onMounted, ref, computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NSpace, NTag, NPopconfirm, useDialog, NSelect, NDatePicker } from 'naive-ui';
import { useRentalStore, useAuthStore } from '@/store';
import { storeToRefs } from 'pinia';

const rentalStore = useRentalStore();
const authStore = useAuthStore();
const dialog = useDialog();

const { displayedItems, loading, itemLoading, vehicleOptions, vehicleLoading } = storeToRefs(rentalStore);
const { userInfo } = storeToRefs(authStore);

onMounted(() => {
  rentalStore.fetchRentalsList();
  // Preload vehicle options if user might approve rentals
  if (userInfo.value.role?.includes('admin') || userInfo.value.role?.includes('super')) {
    rentalStore.fetchVehicleOptions();
  }
});

const getStatusType = (status: Entity.RentalStatus) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'active': return 'success';
    case 'returned': return 'default';
    case 'cancelled': return 'error';
    case 'extension_requested': return 'info';
    default: return 'default';
  }
};

const columns: DataTableColumns<Entity.Rental> = [
  { title: 'ID', key: 'rental_id', align: 'center', width: 80 },
  { title: '用户', key: 'user.name', align: 'center', render: row => row.user?.name || 'N/A' },
  {
    title: '车辆',
    key: 'vehicle',
    align: 'center',
    render: row => (row.vehicle && row.vehicle.type ? `${row.vehicle.type.brand} ${row.vehicle.type.model}` : (row.rental_status === 'pending' ? '待分配' : 'N/A')),
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
      const userRole = userInfo.value.role || [];
      const isStoreAdmin = userRole.includes('admin') && userInfo.value.managed_store_id;
      const isSuperAdmin = userRole.includes('super');
      const isAdmin = isStoreAdmin || isSuperAdmin;
      const isOwner = row.user_id === userInfo.value.user_id;

      const canApprove = isAdmin && row.rental_status === 'pending' &&
        (isSuperAdmin || (isStoreAdmin && row.rental_store_id === userInfo.value.managed_store_id));

      const canReturn = isAdmin && row.rental_status === 'active' &&
        (isSuperAdmin || (isStoreAdmin && row.return_store_id === userInfo.value.managed_store_id));
      
      const canRequestExtension = isOwner && row.rental_status === 'active';

      const canManageExtension = isAdmin && row.rental_status === 'extension_requested' &&
        (isSuperAdmin || (isStoreAdmin && (row.rental_store_id === userInfo.value.managed_store_id || row.return_store_id === userInfo.value.managed_store_id)));

      const canCancelUser = isOwner && row.rental_status === 'pending';
      const canCancelAdmin = isAdmin && row.rental_status !== 'returned' && row.rental_status !== 'cancelled' &&
        (isSuperAdmin || (isStoreAdmin && (row.rental_store_id === userInfo.value.managed_store_id || row.return_store_id === userInfo.value.managed_store_id)));

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
      );
    },
  },
];

function handleApprove(rental: Entity.Rental) {
  let selectedVehicleId: number | null = null;
  dialog.create({
    title: '批准租借并分配车辆',
    content: () => (
      <NSelect
        placeholder="请选择车辆"
        options={vehicleOptions.value}
        loading={vehicleLoading.value}
        filterable
        onUpdateValue={(value) => { selectedVehicleId = value; }}
      />
    ),
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      if (selectedVehicleId) {
        rentalStore.approveRental(rental.rental_id, selectedVehicleId);
      } else {
        window.$message.error('请选择一辆车');
        return false; // Prevent dialog from closing
      }
    },
  });
}

function handleRequestExtension(rental: Entity.Rental) {
  let newDate: string | null = rental.expected_return_date; // Default to current
  const todayTimestamp = new Date(rental.expected_return_date).getTime();

  dialog.create({
    title: '请求延长归还日期',
    content: () => (
      <NDatePicker
        type="date"
        defaultValue={todayTimestamp}
        isDateDisabled={(ts) => ts <= todayTimestamp} // Must be after current expected return date
        onUpdateFormattedValue={(value) => { newDate = value; }}
        valueFormat="yyyy-MM-dd"
        style={{width: "100%"}}
      />
    ),
    positiveText: '提交请求',
    negativeText: '取消',
    onPositiveClick: () => {
      if (newDate && newDate > rental.expected_return_date) {
        rentalStore.requestRentalExtension(rental.rental_id, newDate);
      } else {
        window.$message.error('新的归还日期必须晚于当前归还日期');
        return false;
      }
    },
  });
}

function handleRejectExtension(rental: Entity.Rental) {
  // API requires original_return_date. This is problematic as frontend might not have it.
  // For now, we'll prompt or use a placeholder. This needs a better solution.
  // The `rental.expected_return_date` at this point is the *newly requested* date.
  // We need the date *before* the extension was requested.
  let originalDateInput: string = ''; // Placeholder for prompt
  dialog.create({
    title: '拒绝延期请求',
    content: () => (
      <NSpace vertical>
        <p>当前请求的归还日期: {rental.expected_return_date}</p>
        <p>请输入该租借单在发起延期请求前的“原始归还日期”以拒绝延期：</p>
        <NDatePicker
            type="date"
            onUpdateFormattedValue={(value) => { originalDateInput = value as string; }}
            valueFormat="yyyy-MM-dd"
            placeholder="YYYY-MM-DD"
            style={{width: "100%"}}
        />
      </NSpace>
    ),
    positiveText: '确认拒绝',
    negativeText: '取消',
    onPositiveClick: () => {
      if (!originalDateInput) {
          window.$message.error('请输入原始归还日期');
          return false;
      }
      // Validate originalDateInput format if necessary
      try {
        const parsedDate = new Date(originalDateInput);
        if (isNaN(parsedDate.getTime())) throw new Error("Invalid date");
         // Further validation: originalDateInput should ideally be before rental.expected_return_date (the new one)
        if (new Date(originalDateInput) >= new Date(rental.expected_return_date)) {
            window.$message.error('原始归还日期必须早于当前请求的归还日期。');
            return false;
        }
      } catch(e) {
          window.$message.error('原始归还日期格式无效，请使用 YYYY-MM-DD');
          return false;
      }
      rentalStore.rejectRentalExtension(rental.rental_id, originalDateInput);
    },
  });
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
