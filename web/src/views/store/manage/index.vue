<script setup lang="tsx">
import type { DataTableColumns, FormInst } from 'naive-ui'
import { useBoolean } from '@/hooks'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import TableModal from './components/TableModal.vue'
import { fetchDeleteStore, fetchGetStores } from '@/service/api/stores'

const { bool: loading, setTrue: startLoading, setFalse: endLoading } = useBoolean(false)
const { bool: visible, setTrue: openModal } = useBoolean(false)

const initialModel = {
  condition_1: '',
  condition_2: '',
  condition_3: '',
  condition_4: '',
}
const model = ref({ ...initialModel })

const formRef = ref<FormInst | null>()

async function handleDelete(id: number) {
  await fetchDeleteStore(String(id))
  getStoreList()
}
const columns: DataTableColumns<Entity.Store> = [
  {
    title: 'id',
    align: 'center',
    key: 'store_id',
  },
  {
    title: '名称',
    align: 'center',
    key: 'store_name',
  },
  {
    title: '地址',
    align: 'center',
    key: 'address',
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
          <NPopconfirm onPositiveClick={() => handleDelete(row.store_id)}>
            {{
              default: () => '确认删除',
              trigger: () => <NButton size="small">删除</NButton>,
            }}
          </NPopconfirm>
        </NSpace>
      )
    },
  },
]

const listData = ref<Entity.User[]>([])

onMounted(() => {
  getStoreList()
})
async function getStoreList() {
  startLoading()
  await fetchGetStores().then((res: any) => {
    listData.value = res.data
    endLoading()
  })
}
function changePage(page: number, size: number) {
  window.$message.success(`分页器:${page},${size}`)
}
function handleResetSearch() {
  model.value = { ...initialModel }
}

  type ModalType = 'add' | 'edit'
const modalType = ref<ModalType>('add')
function setModalType(type: ModalType) {
  modalType.value = type
}

const editData = ref<Entity.Store | null>(null)
function setEditData(data: Entity.Store | null) {
  editData.value = data
}

function handleEditTable(row: Entity.Store) {
  setEditData(row)
  setModalType('edit')
  openModal()
}
function handleAddTable() {
  openModal()
  setModalType('add')
}
</script>

<template>
  <NSpace vertical size="large">
    <n-card>
      <n-form ref="formRef" :model="model" label-placement="left" inline :show-feedback="false">
        <n-flex>
          <n-form-item label="姓名" path="condition_1">
            <n-input v-model:value="model.condition_1" placeholder="请输入" />
          </n-form-item>
          <n-form-item label="年龄" path="condition_2">
            <n-input v-model:value="model.condition_2" placeholder="请输入" />
          </n-form-item>
          <n-form-item label="性别" path="condition_3">
            <n-input v-model:value="model.condition_3" placeholder="请输入" />
          </n-form-item>
          <n-form-item label="地址" path="condition_4">
            <n-input v-model:value="model.condition_4" placeholder="请输入" />
          </n-form-item>
          <n-flex class="ml-auto">
            <NButton type="primary" @click="getUserList">
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
            新建
          </NButton>
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
        <n-data-table :columns="columns" :data="listData" :loading="loading" />
        <Pagination :count="100" @change="changePage" />
        <TableModal v-model:visible="visible" :type="modalType" :modal-data="editData" />
      </NSpace>
    </n-card>
  </NSpace>
</template>
