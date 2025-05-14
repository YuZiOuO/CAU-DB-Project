import { defineStore } from 'pinia'
import { fetchCreateStores, fetchDeleteStore, fetchGetStores, fetchUpdateStore } from '@/service/api/stores'

interface StoreState {
  items: Entity.Store[]
  displayedItems: Entity.Store[]
  loading: boolean
  searchLoading: boolean
  filterModel: {
    name: string
    address: string
    phone: string
  }
}

const initialFilterModel = {
  name: '',
  address: '',
  phone: '',
}

export const useStoreModule = defineStore('store-module', {
  state: (): StoreState => ({
    items: [],
    displayedItems: [],
    loading: false,
    searchLoading: false,
    filterModel: { ...initialFilterModel },
  }),
  actions: {
    async fetchStores() {
      this.loading = true
      try {
        const res: any = await fetchGetStores()
        if (res.isSuccess) {
          this.items = res.data || []
          this.displayedItems = [...this.items]
        }
        else {
          this.items = []
          this.displayedItems = []
        }
      }
      catch (error) {
        console.error('获取门店列表失败:', error)
        this.items = []
        this.displayedItems = []
      }
      finally {
        this.loading = false
      }
    },
    applyFilters() {
      this.searchLoading = true
      this.loading = true
      let filteredData = [...this.items]
      const nameFilter = this.filterModel.name.trim().toLowerCase()
      const addressFilter = this.filterModel.address.trim().toLowerCase()
      const phoneFilter = this.filterModel.phone.trim().toLowerCase()

      if (nameFilter)
        filteredData = filteredData.filter(store => store.store_name.toLowerCase().includes(nameFilter))

      if (addressFilter)
        filteredData = filteredData.filter(store => store.address.toLowerCase().includes(addressFilter))

      if (phoneFilter)
        filteredData = filteredData.filter(store => store.phone_number && store.phone_number.toLowerCase().includes(phoneFilter))

      this.displayedItems = filteredData
      this.loading = false
      this.searchLoading = false
    },
    resetFilters() {
      this.filterModel = { ...initialFilterModel }
      this.displayedItems = [...this.items]
    },
    async createStore(itemData: Omit<Entity.Store, 'store_id'>) {
      this.loading = true
      const dataToSave = {
        ...itemData,
        phone_number: itemData.phone_number || '',
      }
      try {
        const res: any = await fetchCreateStores(dataToSave)
        if (res.isSuccess) {
          window.$message.success('门店添加成功')
          await this.fetchStores()
        }
      }
      catch (error) {
        console.error('添加门店失败:', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },
    async updateStore(storeId: number, itemData: Omit<Entity.Store, 'store_id'>) {
      this.loading = true
      const dataToSave = {
        ...itemData,
        phone_number: itemData.phone_number || '',
      }
      try {
        const res: any = await fetchUpdateStore(storeId, dataToSave)
        if (res.isSuccess) {
          window.$message.success('门店信息更新成功')
          await this.fetchStores()
        }
      }
      catch (error) {
        console.error('更新门店失败:', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },
    async deleteStore(storeId: number) {
      this.loading = true
      try {
        const res: any = await fetchDeleteStore(String(storeId))
        if (res.isSuccess) {
          window.$message.success('删除成功')
          await this.fetchStores()
        }
      }
      catch (error) {
        console.error('删除门店失败:', error)
      }
      finally {
        this.loading = false
      }
    },
  },
})
