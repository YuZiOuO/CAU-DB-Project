<script setup lang="tsx">
import { onMounted, ref } from 'vue'
import type { DataTableColumns, FormInst } from 'naive-ui'
import { NButton, NSpace, NTag } from 'naive-ui'
import { useAuthStore, useStoreModule, useUserManagementStore } from '@/store'
import { storeToRefs } from 'pinia'
import { useBoolean, usePermission } from '@/hooks'
import EditUserModal from './components/EditUserModal.vue'
import ChangeRoleModal from './components/ChangeRoleModal.vue'
import type { JSX } from 'vue/jsx-runtime'

const userManagementStore = useUserManagementStore()
const authStore = useAuthStore()
const storeModule = useStoreModule()

const { displayedUsers, loading, itemLoading, filterModel, storeOptions } = storeToRefs(userManagementStore) // allRoles and loadingRoles removed
const { userInfo } = storeToRefs(authStore)
const { hasPermission } = usePermission()

const { bool: isEditModalVisible, setTrue: openEditModal, setFalse: closeEditModal } = useBoolean(false)
const { bool: isChangeRoleModalVisible, setTrue: openChangeRoleModal, setFalse: closeChangeRoleModal } = useBoolean(false)

const editingUser = ref<Entity.User | null>(null)
const formRef = ref<FormInst | null>(null)

onMounted(async () => {
  userManagementStore.fetchUsers()
  // userManagementStore.fetchAllRoles() // 已移除
  userManagementStore.fetchStoreOptionsForSelect()
  if (storeModule.items.length === 0) {
    storeModule.fetchStores()
  }
})

function handleEdit(user: Entity.User) {
  editingUser.value = { ...user }
  openEditModal()
}

function handleChangeRole(user: Entity.User) {
  editingUser.value = { ...user } // Pass the whole user object
  openChangeRoleModal()
}

function getStoreName(storeId: number | null | undefined): string {
  if (!storeId)
    return 'N/A'
  const store = storeModule.items.find(s => s.store_id === storeId)
  return store ? store.store_name : `ID: ${storeId}`
}

function getUserRoleTag(user: Entity.User): JSX.Element {
  if (user.role?.includes('super')) {
    if (user.managed_store_id) {
      return <NTag type="success">门店管理员</NTag>
    }
    return <NTag type="error">超级管理员</NTag>
  }
  return <NTag type="info">普通用户</NTag>
}

const columns: DataTableColumns<Entity.User> = [
  { title: 'ID', key: 'id', align: 'center', width: 80 },
  { title: '用户名', key: 'user_name', align: 'center' },
  { title: '真实姓名', key: 'name', align: 'center', render: row => row.name || '未设置' },
  { title: '邮箱', key: 'email', align: 'center', render: row => row.email || '未设置' },
  {
    title: '角色',
    key: 'role', // Key can remain, but rendering changes
    align: 'center',
    render: row => getUserRoleTag(row),
  },
  {
    title: '管理门店',
    key: 'managed_store_id',
    align: 'center',
    render: row => (row.managed_store_id ? getStoreName(row.managed_store_id) : 'N/A'),
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center',
    fixed: 'right',
    width: 200,
    render: (row) => {
      // Ensure Entity.User has is_admin and id properties
      const canChangeRole = hasPermission(['super']) && row.user_id !== userInfo.value?.user?.user_id
      // Super can edit anyone. Admin can edit self if user.user_id matches.
      const canEdit = hasPermission(['super']) || (userInfo.value?.user?.user_id === row.user_id)

      return (
        <NSpace justify="center">
          {canEdit && (
            <NButton size="small" type="primary" onClick={() => handleEdit(row)} loading={itemLoading.value[row.user_id]}>
              修改
            </NButton>
          )}
          {canChangeRole && (
            <NButton size="small" type="warning" onClick={() => handleChangeRole(row)} loading={itemLoading.value[row.user_id]}>
              改变权限
            </NButton>
          )}
        </NSpace>
      )
    },
  },
]

function handleSearch() {
  userManagementStore.fetchUsers() // Refetch with new filters
}

function handleReset() {
  userManagementStore.resetFilters()
}
</script>

<template>
  <NSpace vertical size="large">
    <n-card :bordered="false">
      <n-form ref="formRef" :model="filterModel" label-placement="left" inline :show-feedback="false">
        <n-flex>
          <n-form-item label="用户名" path="user_name">
            <n-input v-model:value="filterModel.user_name" placeholder="请输入用户名" />
          </n-form-item>
          <n-form-item label="真实姓名" path="name">
            <n-input v-model:value="filterModel.name" placeholder="请输入真实姓名" />
          </n-form-item>
          <n-form-item label="邮箱" path="email">
            <n-input v-model:value="filterModel.email" placeholder="请输入邮箱" />
          </n-form-item>
          <n-flex class="ml-auto">
            <NButton type="primary" @click="handleSearch">
              <template #icon>
                <icon-park-outline-search />
              </template>
              搜索
            </NButton>
            <NButton strong secondary @click="handleReset">
              <template #icon>
                <icon-park-outline-redo />
              </template>
              重置
            </NButton>
          </n-flex>
        </n-flex>
      </n-form>
    </n-card>

    <n-card title="用户列表">
      <n-data-table
        :columns="columns"
        :data="displayedUsers"
        :loading="loading"
        :scroll-x="1200"
        remote
        striped
      />
    </n-card>

    <EditUserModal
      v-model:show="isEditModalVisible"
      :user-data="editingUser"
      @success="() => { userManagementStore.fetchUsers(); closeEditModal(); }"
    />
    <ChangeRoleModal
      v-model:show="isChangeRoleModalVisible"
      :user-data="editingUser"
      :store-options="storeOptions"
      @success="() => { userManagementStore.fetchUsers(); closeChangeRoleModal(); }"
    />
  </NSpace>
</template>

<style scoped>
.mr-1 {
  margin-right: 4px;
}
.mb-1 {
  margin-bottom: 4px;
}
</style>
