<script setup lang="tsx">
import { onMounted, ref } from 'vue'
import type { DataTableColumns, FormInst } from 'naive-ui'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import TableModal from './components/TableModal.vue'
import { useStoreModule } from '@/store'
import { storeToRefs } from 'pinia'
import { useBoolean } from '@/hooks' // 引入 useBoolean

const storeModule = useStoreModule()
const {
  displayedItems,
  loading,
  searchLoading, // searchLoading is available from store
  filterModel,
} = storeToRefs(storeModule)

const { bool: isModalVisible, setTrue: openModal, setFalse: closeModal } = useBoolean(false)
const modalType = ref<'add' | 'edit'>('add')
const editingItem = ref<Entity.Store | null>(null)

const formRef = ref<FormInst | null>(null)

onMounted(() => {
  storeModule.fetchStores()
})

async function handleDelete(id: number) {
  await storeModule.deleteStore(id)
}

function handleAddTable() {
  modalType.value = 'add'
  editingItem.value = null
  openModal()
}

function handleEditTable(row: Entity.Store) {
  modalType.value = 'edit'
  editingItem.value = { ...row }
  openModal()
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
    title: '电话',
    align: 'center',
    key: 'phone_number',
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
              trigger: () => <NButton size="small" type="error">删除</NButton>, // Changed to error type for consistency
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
          <n-form-item label="名称" path="name">
            <n-input v-model:value="filterModel.name" placeholder="请输入店铺名称" />
          </n-form-item>
          <n-form-item label="地址" path="address">
            <n-input v-model:value="filterModel.address" placeholder="请输入店铺地址" />
          </n-form-item>
          <n-form-item label="电话" path="phone">
            <n-input v-model:value="filterModel.phone" placeholder="请输入店铺电话" />
          </n-form-item>
          <n-flex class="ml-auto">
            <NButton type="primary" :loading="searchLoading" @click="storeModule.applyFilters">
              <template #icon>
                <icon-park-outline-search />
              </template>
              搜索
            </NButton>
            <NButton strong secondary @click="storeModule.resetFilters">
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
        <n-data-table :columns="columns" :data="displayedItems" :loading="loading" />
        <Pagination :count="displayedItems.length" @change="changePage" /> <!-- Use displayedItems.length -->
        <TableModal v-model:visible="isModalVisible" :type="modalType" :modal-data="editingItem" @success="() => { storeModule.fetchStores(); closeModal(); }" />
      </NSpace>
    </n-card>
  </NSpace>
</template>
