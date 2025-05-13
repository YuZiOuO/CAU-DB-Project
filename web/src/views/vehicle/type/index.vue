<script setup lang="tsx">
import { onMounted, ref } from 'vue'
import type { DataTableColumns, FormInst } from 'naive-ui'
import { useBoolean } from '@/hooks'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import TableModal from './components/TableModal.vue' // 确保路径正确
import { fetchDeleteVehicleType, fetchGetVehicleTypes } from '@/service/api/vehicle_type'

const { bool: loading, setTrue: startLoading, setFalse: endLoading } = useBoolean(false)
const { bool: visible, setTrue: openModal } = useBoolean(false)
const { bool: searchLoading, setTrue: startSearchLoading, setFalse: endSearchLoading } = useBoolean(false)

const initialModel = {
  condition_1: '', // 对应品牌 brand
  condition_2: '', // 对应型号 model
}
const model = ref({ ...initialModel })

const formRef = ref<FormInst | null>()

async function handleDelete(type_id: number) {
  // TODO: 在全局请求拦截或具体业务场景中处理API返回值校验
  await fetchDeleteVehicleType(type_id)
  getVehicleTypeList()
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
    },
  },
]

const allVehicleTypesData = ref<Entity.VehicleType[]>([])
const displayData = ref<Entity.VehicleType[]>([])

onMounted(() => {
  getVehicleTypeList()
})

async function getVehicleTypeList() {
  startLoading() // 使用 setTrue
  try {
    const res: any = await fetchGetVehicleTypes()
    allVehicleTypesData.value = res.data || []
    displayData.value = [...allVehicleTypesData.value]
  }
  catch (error) {
    console.error('获取车辆类型列表失败:', error)
    allVehicleTypesData.value = []
    displayData.value = []
  }
  finally {
    endLoading() // 使用 setFalse
  }
}

function handleFilter() {
  startSearchLoading() // 使用 setTrue
  startLoading() // 使用 setTrue

  let filteredData = [...allVehicleTypesData.value]

  const brandFilter = model.value.condition_1.trim().toLowerCase()
  const modelFilter = model.value.condition_2.trim().toLowerCase()

  if (brandFilter) {
    filteredData = filteredData.filter(vt =>
      vt.brand.toLowerCase().includes(brandFilter),
    )
  }
  if (modelFilter) {
    filteredData = filteredData.filter(vt =>
      vt.model.toLowerCase().includes(modelFilter),
    )
  }

  displayData.value = filteredData
  endLoading() // 使用 setFalse
  endSearchLoading() // 使用 setFalse
}

function changePage(page: number, size: number) {
  window.$message.success(`分页器:${page},${size}`)
  // 如果需要，在这里添加实际的分页逻辑
}
function handleResetSearch() {
  model.value = { ...initialModel }
  displayData.value = [...allVehicleTypesData.value]
}

type ModalType = 'add' | 'edit'
const modalType = ref<ModalType>('add')
function setModalType(type: ModalType) {
  modalType.value = type
}

const editData = ref<Entity.VehicleType | null>(null)
function setEditData(data: Entity.VehicleType | null) {
  editData.value = data
}

function handleEditTable(row: Entity.VehicleType) {
  setEditData(row)
  setModalType('edit')
  openModal()
}
function handleAddTable() {
  setEditData(null) // 确保添加模式下 editData 为 null
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
            新建车辆类型
          </NButton>
          <!-- 其他按钮占位符 -->
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
        <!-- 如果您有实际的分页组件，请替换 Pagination，或使用 Naive UI 的分页组件 -->
        <Pagination :count="displayData.length" @change="changePage" /> <!-- 调整 count 属性 -->
        <TableModal v-model:visible="visible" :type="modalType" :modal-data="editData" @success="getVehicleTypeList" />
      </NSpace>
    </n-card>
  </NSpace>
</template>
