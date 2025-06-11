<script setup lang="tsx">
import { onMounted, ref } from 'vue'
import type { DataTableColumns, FormInst } from 'naive-ui'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import TableModal from './components/TableModal.vue'
import TransferModal from './components/TransferModal.vue'
import { useVehicleInstanceStore, useAuthStore } from '@/store' // 引入 useAuthStore
import { storeToRefs } from 'pinia'
import { useBoolean, usePermission } from '@/hooks'
import { useRouter } from 'vue-router'

const vehicleInstanceStore = useVehicleInstanceStore()
const {
  displayedItems,
  loading,
  searchLoading,
  filterModel,
  storeOptions,
} = storeToRefs(vehicleInstanceStore)

const authStore = useAuthStore() // 初始化 authStore
const { userInfo } = storeToRefs(authStore) // 获取 userInfo

const { hasPermission } = usePermission()
const router = useRouter()

const { bool: isModalVisible, setTrue: openModal, setFalse: closeModal } = useBoolean(false)
const modalType = ref<'add' | 'edit'>('add')
const editingItem = ref<Entity.Vehicle | null>(null)

const { bool: isTransferModalVisible, setTrue: openTransferModal, setFalse: closeTransferModal } = useBoolean(false) // 新增流转模态框状态
const transferItem = ref<Entity.Vehicle | null>(null) // 新增流转车辆数据

const formRef = ref<FormInst | null>(null)

onMounted(() => {
  if (!hasPermission(['admin', 'super'])) {
    router.push('/403')
    return
  }
  vehicleInstanceStore.fetchVehicles()
  if (vehicleInstanceStore.vehicleTypeOptions.length === 0) {
    vehicleInstanceStore.loadVehicleTypes()
  }
  if (vehicleInstanceStore.storeOptions.length === 0) {
    vehicleInstanceStore.loadStoreOptions()
  }
})

async function handleDelete(id: number) {
  await vehicleInstanceStore.deleteVehicle(id)
}

function handleAddTable() {
  modalType.value = 'add'
  editingItem.value = null
  openModal()
}

function handleEditTable(row: Entity.Vehicle) {
  modalType.value = 'edit'
  editingItem.value = { ...row }
  openModal()
}

function handleTransferTable(row: Entity.Vehicle) { // 新增处理流转函数
  transferItem.value = { ...row }
  openTransferModal()
}

const columns: DataTableColumns<Entity.Vehicle> = [
  {
    title: 'ID',
    align: 'center',
    key: 'vehicle_id',
  },
  {
    title: '品牌',
    align: 'center',
    key: 'type.brand',
    render: row => row.type?.brand || 'N/A',
  },
  {
    title: '型号',
    align: 'center',
    key: 'type.model',
    render: row => row.type?.model || 'N/A',
  },
  {
    title: '生产日期',
    align: 'center',
    key: 'manufacture_date',
  },
  {
    title: '日租金',
    align: 'center',
    key: 'type.daily_rent_price',
    render: row => (row.type?.daily_rent_price ? `￥${row.type.daily_rent_price.toFixed(2)}` : 'N/A'),
  },
  { // 新增：车辆所属门店列
    title: '所属门店',
    align: 'center',
    key: 'store.store_name',
    render: row => row.store?.store_name || 'N/A',
  },
  {
    title: '操作',
    align: 'center',
    key: 'actions',
    render: (row) => {
      const canPerformAdminSuperActions = hasPermission(['admin', 'super'])

      let shouldShowTransferButton = false
      if (hasPermission(['super'])) {
        shouldShowTransferButton = true
      }
      else if (hasPermission(['admin'])) {
        if (userInfo.value?.user?.managed_store_id && row.store_id && userInfo.value.user.managed_store_id === row.store_id) {
          shouldShowTransferButton = true
        }
      }

      return (
        <NSpace justify="center">
          <NButton
            size="small"
            onClick={() => handleEditTable(row)}
            disabled={!canPerformAdminSuperActions}
          >
            编辑
          </NButton>
          {shouldShowTransferButton && (
            <NButton // 流转按钮，根据条件显示
              size="small"
              type="info"
              onClick={() => handleTransferTable(row)}
              // 当按钮显示时，用户应有权操作，无需额外 disabled 判断权限
            >
              流转
            </NButton>
          )}
          <NPopconfirm onPositiveClick={() => handleDelete(row.vehicle_id)} disabled={!canPerformAdminSuperActions}>
            {{
              default: () => '确认删除',
              trigger: () => <NButton size="small" type="error" disabled={!canPerformAdminSuperActions}>删除</NButton>,
            }}
          </NPopconfirm>
        </NSpace>
      )
    },
  },
]

function changePage(page: number, size: number) {
  window.$message.success(`分页器:${page},${size}`)
}
</script>

<template>
  <NSpace vertical size="large">
    <n-card>
      <n-form ref="formRef" :model="filterModel" label-placement="left" inline :show-feedback="false">
        <n-flex>
          <n-form-item label="品牌" path="brand">
            <n-input v-model:value="filterModel.brand" placeholder="请输入车辆品牌" />
          </n-form-item>
          <n-form-item label="型号" path="model">
            <n-input v-model:value="filterModel.model" placeholder="请输入车辆型号" />
          </n-form-item>
          <!-- 可以考虑添加按门店筛选的功能 -->
          <n-flex class="ml-auto">
            <NButton type="primary" :loading="searchLoading" @click="vehicleInstanceStore.applyFilters">
              <template #icon>
                <icon-park-outline-search />
              </template>
              搜索
            </NButton>
            <NButton strong secondary @click="vehicleInstanceStore.resetFilters">
              <template #icon>
                <icon-park-outline-redo />
              </template>
              重置
            </NButton>
          </n-flex>
        </n-flex>
      </n-form>
    </n-card>
    <n-card>
      <NSpace vertical size="large">
        <div class="flex gap-4">
          <NButton type="primary" :disabled="!hasPermission(['admin', 'super'])" @click="handleAddTable">
            <template #icon>
              <icon-park-outline-add-one />
            </template>
            新建车辆
          </NButton>
          <!-- Placeholder for other buttons -->
          <NButton strong secondary disabled>
            <template #icon>
              <icon-park-outline-afferent />
            </template>
            批量导入
          </NButton>
          <NButton strong secondary class="ml-a" disabled>
            <template #icon>
              <icon-park-outline-download />
            </template>
            下载
          </NButton>
        </div>
        <n-data-table :columns="columns" :data="displayedItems" :loading="loading" />
        <!-- Replace Pagination with actual component if you have one, or Naive UI's pagination -->
        <Pagination :count="displayedItems.length" @change="changePage" /> <!-- Adjust count prop -->
        <TableModal v-model:visible="isModalVisible" :type="modalType" :modal-data="editingItem" @success="() => { vehicleInstanceStore.fetchVehicles(); closeModal(); }" />
        <TransferModal
          v-model:visible="isTransferModalVisible"
          :vehicle-data="transferItem"
          :store-options="storeOptions"
          @success="() => { closeTransferModal(); }"
        />
      </NSpace>
    </n-card>
  </NSpace>
</template>
