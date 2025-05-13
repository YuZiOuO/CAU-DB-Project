<script setup lang="tsx">
import { onMounted, ref } from 'vue'
import type { DataTableColumns, FormInst } from 'naive-ui'
import { useBoolean } from '@/hooks'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import TableModal from './components/TableModal.vue'
import { fetchDeleteVehicle, fetchGetVehicles } from '@/service/api/vehicles'

const { bool: loading, setTrue: startLoading, setFalse: endLoading } = useBoolean(false)
const { bool: visible, setTrue: openModal } = useBoolean(false)
const { bool: searchLoading, setTrue: startSearchLoading, setFalse: endSearchLoading } = useBoolean(false)

const initialModel = {
  condition_1: '', // 对应品牌 (来自 type.brand)
  condition_2: '', // 对应型号 (来自 type.model)
  // 移除了车牌号和状态的筛选条件
}
const model = ref({ ...initialModel })

const formRef = ref<FormInst | null>()

async function handleDelete(id: number) {
  // TODO: 在全局请求拦截或具体业务场景中处理API返回值校验
  await fetchDeleteVehicle(id)
  getVehicleList()
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

const allVehiclesData = ref<Entity.Vehicle[]>([])
const displayData = ref<Entity.Vehicle[]>([])

onMounted(() => {
  getVehicleList()
})

async function getVehicleList() {
  startLoading() // 使用 setTrue
  try {
    const res: any = await fetchGetVehicles() // Assuming fetchGetVehicles is defined
    allVehiclesData.value = res.data || [] // 后端返回的数据应包含嵌套的 type 对象
    displayData.value = [...allVehiclesData.value]
  }
  catch (error) {
    console.error('获取车辆列表失败:', error)
    allVehiclesData.value = []
    displayData.value = []
  }
  finally {
    endLoading() // 使用 setFalse
  }
}

function handleFilter() {
  startSearchLoading() // 使用 setTrue
  startLoading() // 使用 setTrue

  let filteredData = [...allVehiclesData.value]

  const brandFilter = model.value.condition_1.trim().toLowerCase() // 对应品牌
  const modelFilter = model.value.condition_2.trim().toLowerCase() // 对应型号

  if (brandFilter) {
    filteredData = filteredData.filter(vehicle =>
      vehicle.type?.brand?.toLowerCase().includes(brandFilter),
    )
  }
  if (modelFilter) {
    filteredData = filteredData.filter(vehicle =>
      vehicle.type?.model?.toLowerCase().includes(modelFilter),
    )
  }
  // 移除了基于 license_plate 和 status 的筛选逻辑

  displayData.value = filteredData
  endLoading() // 使用 setFalse
  endSearchLoading() // 使用 setFalse
}

function changePage(page: number, size: number) {
  window.$message.success(`分页器:${page},${size}`)
  // Add actual pagination logic if needed
}
function handleResetSearch() {
  model.value = { ...initialModel }
  displayData.value = [...allVehiclesData.value]
}

type ModalType = 'add' | 'edit'
const modalType = ref<ModalType>('add')
function setModalType(type: ModalType) {
  modalType.value = type
}

const editData = ref<Entity.Vehicle | null>(null)
function setEditData(data: Entity.Vehicle | null) {
  editData.value = data
}

function handleEditTable(row: Entity.Vehicle) {
  setEditData(row)
  setModalType('edit')
  openModal()
}
function handleAddTable() {
  setEditData(null) // Ensure editData is null for add mode
  setModalType('add')
  openModal()
}
</script>

<template>
  <NSpace vertical size="large">
    <n-card>
      <n-form ref="formRef" :model="model" label-placement="left" inline :show-feedback="false">
        <n-flex>
          <n-form-item label="品牌" path="condition_1">
            <n-input v-model:value="model.condition_1" placeholder="请输入车辆品牌" />
          </n-form-item>
          <n-form-item label="型号" path="condition_2">
            <n-input v-model:value="model.condition_2" placeholder="请输入车辆型号" />
          </n-form-item>
          <!-- 移除了车牌号和状态的筛选输入框 -->
          <n-flex class="ml-auto">
            <NButton type="primary" :loading="searchLoading" @click="handleFilter">
              <template #icon>
                <icon-park-outline-search />
              </template>
              搜索
            </NButton>
            <NButton strong secondary @click="handleResetSearch">
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
        <n-data-table :columns="columns" :data="displayData" :loading="loading" />
        <!-- Replace Pagination with actual component if you have one, or Naive UI's pagination -->
        <Pagination :count="displayData.length" @change="changePage" /> <!-- Adjust count prop -->
        <TableModal v-model:visible="visible" :type="modalType" :modal-data="editData" @success="getVehicleList" />
      </NSpace>
    </n-card>
  </NSpace>
</template>
