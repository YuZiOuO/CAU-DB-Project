import { defineStore } from 'pinia'
import type { SelectOption } from 'naive-ui'
import { fetchGetUsers, fetchUpdateUser, fetchUpdateUserPermissions } from '@/service/api/users'
import { useStoreModule } from './storeModule' // To get store options

interface UserManagementState {
  users: Entity.User[]
  displayedUsers: Entity.User[]
  loading: boolean
  itemLoading: Record<number, boolean> // Loading state for individual user operations
  filterModel: {
    name: string
    email: string
    user_name: string
  }
  storeOptions: SelectOption[] // For assigning managed store
}

const initialFilterModel = {
  name: '',
  email: '',
  user_name: '',
}

export const useUserManagementStore = defineStore('user-management-store', {
  state: (): UserManagementState => ({
    users: [],
    displayedUsers: [],
    loading: false,
    itemLoading: {},
    filterModel: { ...initialFilterModel },
    storeOptions: [],
  }),
  actions: {
    async fetchUsers() {
      this.loading = true
      try {
        const res = await fetchGetUsers(this.filterModel)
        if (res.isSuccess && res.data) {
          this.users = res.data.map(u => ({
            ...u,
            id: u.user_id,
          })) as Entity.User[]
          this.applyFilters() // Apply initial/current filters
        }
        else {
          this.users = []
          this.displayedUsers = []
        }
      }
      catch (error) {
        console.error('获取用户列表失败:', error)
        this.users = []
        this.displayedUsers = []
      }
      finally {
        this.loading = false
      }
    },
    async fetchStoreOptionsForSelect() {
      const storeModule = useStoreModule()
      if (storeModule.items.length === 0 && !storeModule.loading) {
        await storeModule.fetchStores()
      }
      this.storeOptions = storeModule.items.map(store => ({
        label: store.store_name,
        value: store.store_id,
      }))
    },
    applyFilters() {
      this.loading = true // Can be set to a different loading like searchLoading if needed
      let filtered = [...this.users]

      const nameFilter = this.filterModel.name.trim().toLowerCase()
      const emailFilter = this.filterModel.email.trim().toLowerCase()
      const userNameFilter = this.filterModel.user_name.trim().toLowerCase()

      if (nameFilter) {
        filtered = filtered.filter(user => user.name && user.name.toLowerCase().includes(nameFilter))
      }
      if (emailFilter) {
        filtered = filtered.filter(user => user.email && user.email.toLowerCase().includes(emailFilter))
      }
      if (userNameFilter) {
        filtered = filtered.filter(user => user.name && user.name.toLowerCase().includes(userNameFilter))
      }
      this.displayedUsers = filtered
      this.loading = false
    },
    resetFilters() {
      this.filterModel = { ...initialFilterModel }
      this.fetchUsers() // Refetch or just re-apply if data is already client-side
    },
    async updateUser(userId: number, data: Partial<Pick<Entity.User, 'name' | 'email' | 'address' | 'phone_number'>>) {
      this.itemLoading[userId] = true
      try {
        const res = await fetchUpdateUser(userId, data)
        if (res.isSuccess) {
          window.$message.success('用户信息更新成功')
          await this.fetchUsers() // Refresh list
          return true
        }
        return false
      }
      catch (error) {
        console.error('更新用户信息失败:', error)
        return false
      }
      finally {
        delete this.itemLoading[userId]
      }
    },
    async updateUserPermissions(userId: number, isAdmin: boolean, managedStoreId?: number | null) {
      this.itemLoading[userId] = true
      try {
        const payload: { is_admin: boolean, managed_store_id?: number | null } = { is_admin: isAdmin }
        if (isAdmin && managedStoreId !== undefined) { // Only include managed_store_id if admin and provided
          payload.managed_store_id = managedStoreId
        }
        else if (!isAdmin) { // If not admin, explicitly set managed_store_id to null
          payload.managed_store_id = null
        }

        const res = await fetchUpdateUserPermissions(userId, payload)
        if (res.isSuccess) {
          window.$message.success('用户权限更新成功')
          await this.fetchUsers() // Refresh list
          return true
        }
        return false
      }
      catch (error) {
        console.error('更新用户权限失败:', error)
        return false
      }
      finally {
        delete this.itemLoading[userId]
      }
    },
  },
})
