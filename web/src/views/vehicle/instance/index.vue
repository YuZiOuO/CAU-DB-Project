<script setup lang="tsx">
import { onMounted, ref } from 'vue'
import type { DataTableColumns, FormInst } from 'naive-ui'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import TableModal from './components/TableModal.vue'
import { useVehicleInstanceStore } from '@/store'
import { storeToRefs } from 'pinia'
import { useBoolean } from '@/hooks' // 引入 useBoolean

const vehicleInstanceStore = useVehicleInstanceStore()
const {
  displayedItems,
  loading,
  searchLoading,
  filterModel,
} = storeToRefs(vehicleInstanceStore)

const { bool: isModalVisible, setTrue: openModal, setFalse: closeModal } = useBoolean(false)
const modalType = ref<'add' | 'edit'>('add')
const editingItem = ref<Entity.Vehicle | null>(null)

const formRef = ref<FormInst | null>(null)

onMounted(() => {
  vehicleInstanceStore.fetchVehicles()
  // Optionally load types if not already loaded by modal logic
  if (vehicleInstanceStore.vehicleTypeOptions.length === 0) {
    vehicleInstanceStore.loadVehicleTypes()
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

const columns: DataTableColumns<Entity.Vehicle> = [
  {
    title: 'ID',
    align: 'center',
    key: 'vehicle_id',
  },
  {
    title: '品牌',
    align: 'center',
    key: 'type.brand', // 从嵌套的 type 对象获取
    render: row => row.type?.brand || 'N/A',
  },
  {
    title: '型号',
    align: 'center',
    key: 'type.model', // 从嵌套的 type 对象获取
    render: row => row.type?.model || 'N/A',
  },
  {
    title: '生产日期', // 之前是 '年份'
    align: 'center',
    key: 'manufacture_date',
  },
  {
    title: '日租金',
    align: 'center',
    key: 'type.daily_rent_price', // 从嵌套的 type 对象获取
    render: row => (row.type?.daily_rent_price ? `￥${row.type.daily_rent_price.toFixed(2)}` : 'N/A'),
  },
  // 移除了车牌号、状态、店铺ID的列
  {
    title: '操作',
    align: 'center',
    key: 'actions',
    render: (row) => {
      return (
        <NSpace justify="center">
          <NButton
            size="small"
            onClick={() => handleEditTable(row)}
          >
            编辑
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row.vehicle_id)}>
            {{
              default: () => '确认删除',
              trigger: () => <NButton size="small" type="error">删除</NButton>,
            }}
          </NPopconfirm>
        </NSpace>
      )
    },
  },
]

function changePage(page: number, size: number) {
  window.$message.success(`分页器:${page},${size}`)
  // Add actual pagination logic if needed
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
          <!-- 移除了车牌号和状态的筛选输入框 -->
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
          <NButton type="primary" @click="handleAddTable">
            <template #icon>
              <icon-park-outline-add-one />
            </template>
            新建车辆
          </NButton>
          <!-- Placeholder for other buttons -->
          <NButton strong secondary>
            <template #icon>
              <icon-park-outline-afferent />
            </template>
            批量导入
          </NButton>
          <NButton strong secondary class="ml-a">
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
      </NSpace>
    </n-card>
  </NSpace>
</template>
