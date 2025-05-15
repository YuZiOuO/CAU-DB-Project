import { defineStore } from 'pinia'
import { fetchCreateVehicleType, fetchDeleteVehicleType, fetchGetVehicleTypes, fetchUpdateVehicleType } from '@/service/api/vehicle_type'

interface VehicleTypeState {
  items: Entity.VehicleType[]
  displayedItems: Entity.VehicleType[]
  loading: boolean
  searchLoading: boolean
  filterModel: {
    brand: string
    model: string
  }
}

const initialFilterModel = {
  brand: '',
  model: '',
}

export const useVehicleTypeStore = defineStore('vehicle-type', {
  state: (): VehicleTypeState => ({
    items: [],
    displayedItems: [],
    loading: false,
    searchLoading: false,
    filterModel: { ...initialFilterModel },
  }),
  actions: {
    async fetchVehicleTypes() {
      this.loading = true
      try {
        const res: any = await fetchGetVehicleTypes()
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
        console.error('获取车辆类型列表失败:', error)
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
      const brandFilter = this.filterModel.brand.trim().toLowerCase()
      const modelFilter = this.filterModel.model.trim().toLowerCase()

      if (brandFilter)
        filteredData = filteredData.filter(vt => vt.brand.toLowerCase().includes(brandFilter))

      if (modelFilter)
        filteredData = filteredData.filter(vt => vt.model.toLowerCase().includes(modelFilter))

      this.displayedItems = filteredData
      this.loading = false
      this.searchLoading = false
    },
    resetFilters() {
      this.filterModel = { ...initialFilterModel }
      this.displayedItems = [...this.items]
    },
    async createVehicleType(itemData: Omit<Entity.VehicleType, 'type_id'>) {
      this.loading = true
      try {
        const res: any = await fetchCreateVehicleType(itemData)
        if (res.isSuccess) {
          window.$message.success('车辆类型添加成功')
          await this.fetchVehicleTypes()
        }
      }
      catch (error) {
        console.error('添加车辆类型失败:', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },
    async updateVehicleType(typeId: number, itemData: Omit<Entity.VehicleType, 'type_id'>) {
      this.loading = true
      try {
        const res: any = await fetchUpdateVehicleType(typeId, itemData)
        if (res.isSuccess) {
          window.$message.success('车辆类型信息更新成功')
          await this.fetchVehicleTypes()
        }
      }
      catch (error) {
        console.error('更新车辆类型失败:', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },
    async deleteVehicleType(typeId: number) {
      this.loading = true
      try {
        const res: any = await fetchDeleteVehicleType(typeId)
        if (res.isSuccess) {
          window.$message.success('删除成功')
          await this.fetchVehicleTypes()
        }
      }
      catch (error) {
        console.error('删除车辆类型失败:', error)
      }
      finally {
        this.loading = false
      }
    },
  },
})
