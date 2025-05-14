import { defineStore } from 'pinia'
import type { SelectOption } from 'naive-ui'
import {
  fetchApproveExtension,
  fetchApproveRental,
  fetchCancelRental,
  fetchCreateRental,
  fetchGetRentals,
  fetchRejectExtension,
  fetchRequestExtension,
  fetchReturnRental,
} from '@/service/api/rentals'
import { useStoreModule } from './storeModule'
import { useVehicleInstanceStore } from './vehicle/instanceStore' // 用于获取车辆列表
import { useVehicleTypeStore } from './vehicle/typeStore' // 用于获取车辆类型列表

interface CreateRentalForm {
  rental_store_id: number | null
  expected_return_date: string | null // YYYY-MM-DD
  return_store_id: number | null
  vehicle_type_id: number | null
}

interface RentalState {
  items: Entity.Rental[]
  displayedItems: Entity.Rental[] // 如果需要前端筛选/分页
  loading: boolean
  itemLoading: Record<number, boolean> // 用于单个项目的加载状态
  storeOptions: SelectOption[]
  vehicleOptions: Array<{ label: string; value: number; type_id: number }> // 用于批准租借时选择车辆, 确保包含 type_id
  vehicleLoading: boolean
  // vehicleList 和 vehicleTypesList 不直接存储在此，而是通过各自的 store 获取
}

export const useRentalStore = defineStore('rental-store', {
  state: (): RentalState => ({
    items: [],
    displayedItems: [],
    loading: false,
    itemLoading: {},
    storeOptions: [],
    vehicleOptions: [],
    vehicleLoading: false,
  }),
  getters: {
    getVehicleById(): (id: number) => Entity.Vehicle | undefined {
      const vehicleInstanceStore = useVehicleInstanceStore()
      return (id: number) => vehicleInstanceStore.items.find(vehicle => vehicle.vehicle_id === id)
    },
    getVehicleTypeById(): (id: number) => Entity.VehicleType | undefined {
      const vehicleTypeStore = useVehicleTypeStore()
      return (id: number) => vehicleTypeStore.items.find(type => type.type_id === id)
    },
  },
  actions: {
    async fetchStoreOptions() {
      const storeModule = useStoreModule()
      if (storeModule.items.length === 0 && !storeModule.loading) {
        await storeModule.fetchStores()
      }
      this.storeOptions = storeModule.items.map(store => ({
        label: store.store_name,
        value: store.store_id,
      }))
    },
    async fetchVehicleOptions() {
      this.vehicleLoading = true
      const vehicleInstanceStore = useVehicleInstanceStore()
      // 确保 vehicleInstanceStore.items 包含完整的车辆信息，特别是 vehicle.type_id
      if (vehicleInstanceStore.items.length === 0 && !vehicleInstanceStore.loading) {
        await vehicleInstanceStore.fetchVehicles()
      }
      // 筛选理论上可用的车辆（这里简单列出所有，后端会做最终校验）
      this.vehicleOptions = vehicleInstanceStore.items
        .filter(v => v.type_id) // 确保车辆有关联的类型ID
        .map((vehicle) => {
          // 为了在下拉选项中显示品牌和型号，我们需要从 vehicleTypeStore 获取类型信息
          // 或者确保 vehicleInstanceStore.items 中的 vehicle 对象已经包含了 type 的详细信息
          // 这里假设 vehicle.type 是在 fetchVehicles 时被填充的，或者 vehicleOptions 的 label 可以更简单
          // 如果 vehicle.type 不存在，则需要调整 label 的构建方式
          const vehicleType = this.getVehicleTypeById(vehicle.type_id) // 使用 getter
          const label = vehicleType
            ? `${vehicleType.brand} ${vehicleType.model} (ID: ${vehicle.vehicle_id})`
            : `车辆ID: ${vehicle.vehicle_id} (类型 ${vehicle.type_id})`
          return {
            label,
            value: vehicle.vehicle_id,
            type_id: vehicle.type_id, // 确保这个 type_id 是车辆本身的类型ID
          }
        })
      this.vehicleLoading = false
    },

    // Action to fetch vehicle types, delegating to vehicleTypeStore
    async fetchVehicleTypes() {
      const vehicleTypeStore = useVehicleTypeStore()
      if (vehicleTypeStore.items.length === 0 && !vehicleTypeStore.loading) {
        await vehicleTypeStore.fetchVehicleTypes()
      }
      // 此处可以触发一次 fetchVehicleOptions 的更新，如果其 label 依赖于 vehicleTypeStore 的数据
      // 但通常 fetchVehicleOptions 会在需要时被调用，并且其内部逻辑会使用最新的 vehicleTypeStore 数据
    },

    async createRentalRequest(data: CreateRentalForm) {
      if (!data.rental_store_id || !data.expected_return_date || !data.return_store_id || !data.vehicle_type_id) {
        window.$message.error('请填写所有必填项，包括车辆类型')
        return false
      }
      this.loading = true
      try {
        await fetchCreateRental({
          rental_store_id: data.rental_store_id,
          expected_return_date: data.expected_return_date,
          return_store_id: data.return_store_id,
          vehicle_type_id: data.vehicle_type_id,
        })
        window.$message.success('租借请求已提交')
        return true
      }
      catch (error) {
        console.error('创建租借请求失败:', error)
        // window.$message.error('租借请求提交失败'); // 错误已在 service/http.ts 中统一处理
        return false
      }
      finally {
        this.loading = false
      }
    },

    async fetchRentalsList() {
      this.loading = true
      try {
        const res: any = await fetchGetRentals()
        this.items = res.data || []
        this.displayedItems = [...this.items]
      }
      catch (error) {
        console.error('获取租借单列表失败:', error)
        this.items = []
        this.displayedItems = []
        // window.$message.error('获取租借单列表失败');
      }
      finally {
        this.loading = false
      }
    },

    async approveRental(rentalId: number, vehicleId: number) {
      this.itemLoading[rentalId] = true
      try {
        await fetchApproveRental(rentalId, vehicleId)
        window.$message.success('租借单已批准')
        await this.fetchRentalsList() // Refresh list
      }
      catch (error) {
        console.error('批准租借单失败:', error)
        // window.$message.error('批准租借单失败');
      }
      finally {
        this.itemLoading[rentalId] = false
      }
    },

    async returnRental(rentalId: number) {
      this.itemLoading[rentalId] = true
      try {
        await fetchReturnRental(rentalId)
        window.$message.success('车辆已标记为归还')
        await this.fetchRentalsList() // Refresh list
      }
      catch (error) {
        console.error('标记归还失败:', error)
        // window.$message.error('标记归还失败');
      }
      finally {
        this.itemLoading[rentalId] = false
      }
    },

    async requestRentalExtension(rentalId: number, newExpectedReturnDate: string) {
      this.itemLoading[rentalId] = true
      try {
        await fetchRequestExtension(rentalId, newExpectedReturnDate)
        window.$message.success('延期请求已提交')
        await this.fetchRentalsList() // Refresh list
      }
      catch (error) {
        console.error('请求延期失败:', error)
        // window.$message.error('请求延期失败');
      }
      finally {
        this.itemLoading[rentalId] = false
      }
    },

    async approveRentalExtension(rentalId: number) {
      this.itemLoading[rentalId] = true
      try {
        await fetchApproveExtension(rentalId)
        window.$message.success('延期请求已批准')
        await this.fetchRentalsList() // Refresh list
      }
      catch (error) {
        console.error('批准延期失败:', error)
        // window.$message.error('批准延期失败');
      }
      finally {
        this.itemLoading[rentalId] = false
      }
    },

    async rejectRentalExtension(rentalId: number, originalReturnDate: string) {
      this.itemLoading[rentalId] = true
      try {
        // 注意: API 需要 original_return_date。前端需要一种方式获取此日期。
        await fetchRejectExtension(rentalId, originalReturnDate)
        window.$message.success('延期请求已拒绝')
        await this.fetchRentalsList() // Refresh list
      }
      catch (error) {
        console.error('拒绝延期失败:', error)
        // window.$message.error('拒绝延期失败');
      }
      finally {
        this.itemLoading[rentalId] = false
      }
    },

    async cancelRental(rentalId: number) {
      this.itemLoading[rentalId] = true
      try {
        await fetchCancelRental(rentalId)
        window.$message.success('租借单已取消')
        await this.fetchRentalsList() // Refresh list
      }
      catch (error) {
        console.error('取消租借单失败:', error)
        // window.$message.error('取消租借单失败');
      }
      finally {
        this.itemLoading[rentalId] = false
      }
    },
  },
})
