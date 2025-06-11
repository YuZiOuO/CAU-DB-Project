<script setup lang="tsx">
import { onMounted, ref } from 'vue'
import type { DataTableColumns, FormInst } from 'naive-ui'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import TableModal from './components/TableModal.vue'
import { useVehicleTypeStore } from '@/store'
import { storeToRefs } from 'pinia'
import { useBoolean, usePermission } from '@/hooks' // 引入 usePermission

const vehicleTypeStore = useVehicleTypeStore()
const {
  displayedItems,
  loading,
  searchLoading,
  filterModel,
} = storeToRefs(vehicleTypeStore)

const { bool: isModalVisible, setTrue: openModal, setFalse: closeModal } = useBoolean(false)
const modalType = ref<'add' | 'edit'>('add')
const editingItem = ref<Entity.VehicleType | null>(null)

const formRef = ref<FormInst | null>(null)
const { hasPermission } = usePermission() // 初始化 usePermission

onMounted(() => {
  vehicleTypeStore.fetchVehicleTypes()
})

async function handleDelete(type_id: number) {
  await vehicleTypeStore.deleteVehicleType(type_id)
}

function handleAddTable() {
  modalType.value = 'add'
  editingItem.value = null
  openModal()
}

function handleEditTable(row: Entity.VehicleType) {
  modalType.value = 'edit'
  editingItem.value = { ...row }
  openModal()
}

const columns: DataTableColumns<Entity.VehicleType> = [
  {
    title: '类型ID',
    align: 'center',
    key: 'type_id',
  },
  {
    title: '品牌',
    align: 'center',
    key: 'brand',
  },
  {
    title: '型号',
    align: 'center',
    key: 'model',
  },
  {
    title: '日租金',
    align: 'center',
    key: 'daily_rent_price',
    render: row => `￥${row.daily_rent_price.toFixed(2)}`,
  },
  {
    title: '操作',
    align: 'center',
    key: 'actions',
    render: (row) => {
      if (hasPermission(['admin', 'super'])) {
        return (
          <NSpace justify="center">
            <NButton
              size="small"
              onClick={() => handleEditTable(row)}
            >
              编辑
            </NButton>
            <NPopconfirm onPositiveClick={() => handleDelete(row.type_id)}>
              {{
                default: () => '确认删除',
                trigger: () => <NButton size="small" type="error">删除</NButton>,
              }}
            </NPopconfirm>
          </NSpace>
        )
      }
      return null // 如果没有 'admin' 或 'super' 权限，则不渲染任何内容
    },
  },
]
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
          <n-flex class="ml-auto">
            <NButton type="primary" :loading="searchLoading" @click="vehicleTypeStore.applyFilters">
              <template #icon>
                <icon-park-outline-search />
              </template>
              搜索
            </NButton>
            <NButton strong secondary @click="vehicleTypeStore.resetFilters">
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
            新建车辆类型
          </NButton>
          <!-- 其他按钮占位符 -->
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
        <TableModal v-model:visible="isModalVisible" :type="modalType" :modal-data="editingItem" @success="() => { vehicleTypeStore.fetchVehicleTypes(); closeModal(); }" />
      </NSpace>
    </n-card>
  </NSpace>
</template>
