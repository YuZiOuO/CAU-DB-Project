import { defineStore } from 'pinia'
import { fetchCreateVehicle, fetchDeleteVehicle, fetchGetVehicles, fetchUpdateVehicle } from '@/service/api/vehicles'
import { fetchGetVehicleTypes } from '@/service/api/vehicle_type'
import type { SelectOption } from 'naive-ui'

interface VehicleInstanceState {
  items: Entity.Vehicle[]
  displayedItems: Entity.Vehicle[]
  loading: boolean
  searchLoading: boolean
  filterModel: {
    brand: string
    model: string
  }
  vehicleTypeOptions: SelectOption[]
  isLoadingTypes: boolean
}

const initialFilterModel = {
  brand: '',
  model: '',
}

export const useVehicleInstanceStore = defineStore('vehicle-instance', {
  state: (): VehicleInstanceState => ({
    items: [],
    displayedItems: [],
    loading: false,
    searchLoading: false,
    filterModel: { ...initialFilterModel },
    vehicleTypeOptions: [],
    isLoadingTypes: false,
  }),
  actions: {
    async fetchVehicles() {
      this.loading = true
      try {
        const res: any = await fetchGetVehicles()
        this.items = res.data || []
        this.displayedItems = [...this.items]
      }
      catch (error) {
        console.error('获取车辆列表失败:', error)
        this.items = []
        this.displayedItems = []
        window.$message.error('获取车辆列表失败')
      }
      finally {
        this.loading = false
      }
    },
    async loadVehicleTypes() {
      this.isLoadingTypes = true
      try {
        const res: any = await fetchGetVehicleTypes()
        if (res.data) {
          this.vehicleTypeOptions = res.data.map((vt: Entity.VehicleType) => ({
            label: `${vt.brand} ${vt.model} (￥${vt.daily_rent_price.toFixed(2)})`,
            value: vt.type_id,
          }))
        }
      }
      catch (error) {
        console.error('获取车辆类型失败:', error)
        window.$message.error('获取车辆类型失败')
      }
      finally {
        this.isLoadingTypes = false
      }
    },
    applyFilters() {
      this.searchLoading = true
      this.loading = true
      let filteredData = [...this.items]
      const brandFilter = this.filterModel.brand.trim().toLowerCase()
      const modelFilter = this.filterModel.model.trim().toLowerCase()

      if (brandFilter)
        filteredData = filteredData.filter(vehicle => vehicle.type?.brand?.toLowerCase().includes(brandFilter))

      if (modelFilter)
        filteredData = filteredData.filter(vehicle => vehicle.type?.model?.toLowerCase().includes(modelFilter))

      this.displayedItems = filteredData
      this.loading = false
      this.searchLoading = false
    },
    resetFilters() {
      this.filterModel = { ...initialFilterModel }
      this.displayedItems = [...this.items]
    },
    async createVehicle(itemData: { type_id: number, manufacture_date: string }) {
      this.loading = true
      try {
        await fetchCreateVehicle(itemData)
        window.$message.success('车辆添加成功')
        await this.fetchVehicles()
      }
      catch (error) {
        console.error('添加车辆失败:', error)
        window.$message.error('添加失败')
        throw error
      }
      finally {
        this.loading = false
      }
    },
    async updateVehicle(vehicleId: number, itemData: { type_id: number, manufacture_date: string }) {
      this.loading = true
      try {
        await fetchUpdateVehicle(vehicleId, itemData)
        window.$message.success('车辆信息更新成功')
        await this.fetchVehicles()
      }
      catch (error) {
        console.error('更新车辆失败:', error)
        window.$message.error('更新失败')
        throw error
      }
      finally {
        this.loading = false
      }
    },
    async deleteVehicle(vehicleId: number) {
      this.loading = true
      try {
        await fetchDeleteVehicle(vehicleId)
        window.$message.success('删除成功')
        await this.fetchVehicles()
      }
      catch (error) {
        console.error('删除车辆失败:', error)
        window.$message.error('删除失败')
      }
      finally {
        this.loading = false
      }
    },
  },
})
