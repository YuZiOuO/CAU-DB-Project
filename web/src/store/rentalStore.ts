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
import { useVehicleInstanceStore } from './vehicle/instanceStore'
import { useVehicleTypeStore } from './vehicle/typeStore'

interface CreateRentalForm {
  rental_store_id: number | null
  expected_return_date: string | null
  return_store_id: number | null
  vehicle_type_id: number | null
}

interface RentalState {
  items: Entity.Rental[]
  displayedItems: Entity.Rental[]
  loading: boolean
  itemLoading: Record<number, boolean> // Loading state for individual rental items
  storeOptions: SelectOption[]
  vehicleOptions: Array<{ label: string, value: number, type_id: number, store_id: number | undefined }> // Updated to include store_id
  vehicleLoading: boolean
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
      // Ensure vehicle instances are fetched, which now include store details
      if (vehicleInstanceStore.items.length === 0 && !vehicleInstanceStore.loading) {
        await vehicleInstanceStore.fetchVehicles()
      }
      // Ensure vehicle types are fetched for label generation
      const vehicleTypeStore = useVehicleTypeStore()
      if (vehicleTypeStore.items.length === 0 && !vehicleTypeStore.loading) {
        await vehicleTypeStore.fetchVehicleTypes()
      }

      this.vehicleOptions = vehicleInstanceStore.items
        .filter(v => v.type_id && v.store_id) // Ensure vehicle has type and store
        .map((vehicle) => {
          const vehicleType = this.getVehicleTypeById(vehicle.type_id) // getVehicleTypeById is from getters
          const label = vehicleType
            ? `${vehicleType.brand} ${vehicleType.model} (ID: ${vehicle.vehicle_id})`
            : `车辆ID: ${vehicle.vehicle_id} (类型 ${vehicle.type_id})`
          return {
            label,
            value: vehicle.vehicle_id,
            type_id: vehicle.type_id,
            store_id: vehicle.store_id, // Include store_id
          }
        })
      this.vehicleLoading = false
    },

    async fetchVehicleTypes() {
      const vehicleTypeStore = useVehicleTypeStore()
      if (vehicleTypeStore.items.length === 0 && !vehicleTypeStore.loading) {
        await vehicleTypeStore.fetchVehicleTypes()
      }
    },

    async createRentalRequest(data: CreateRentalForm) {
      if (!data.rental_store_id || !data.expected_return_date || !data.return_store_id || !data.vehicle_type_id) {
        window.$message.error('请填写所有必填项，包括车辆类型')
        return false
      }
      this.loading = true
      try {
        const res: any = await fetchCreateRental({
          rental_store_id: data.rental_store_id,
          expected_return_date: data.expected_return_date,
          return_store_id: data.return_store_id,
          vehicle_type_id: data.vehicle_type_id,
        })
        if (res.isSuccess) {
          window.$message.success('租借请求已提交')
          return true
        }
        return false
      }
      catch (error) {
        console.error('创建租借请求失败:', error)
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
        console.error('获取租借单列表失败:', error)
        this.items = []
        this.displayedItems = []
      }
      finally {
        this.loading = false
      }
    },

    async approveRental(rentalId: number, vehicleId: number) {
      this.itemLoading[rentalId] = true
      const vehicleInstanceStore = useVehicleInstanceStore()
      try {
        const res: any = await fetchApproveRental(rentalId, vehicleId)
        if (res.isSuccess) {
          window.$message.success('租借单已批准')
          await this.fetchRentalsList()
          await vehicleInstanceStore.fetchVehicles()
          await this.fetchVehicleOptions() // 重新获取车辆选项
        }
      }
      catch (error) {
        console.error('批准租借单失败:', error)
      }
      finally {
        delete this.itemLoading[rentalId]
      }
    },

    async returnRental(rentalId: number) {
      this.itemLoading[rentalId] = true
      const vehicleInstanceStore = useVehicleInstanceStore()
      try {
        const res: any = await fetchReturnRental(rentalId)
        if (res.isSuccess) {
          window.$message.success('车辆已标记为归还')
          await this.fetchRentalsList()
          await vehicleInstanceStore.fetchVehicles()
          await this.fetchVehicleOptions() // 重新获取车辆选项
        }
      }
      catch (error) {
        console.error('标记归还失败:', error)
      }
      finally {
        delete this.itemLoading[rentalId]
      }
    },

    async requestRentalExtension(rentalId: number, newExpectedReturnDate: string) {
      this.itemLoading[rentalId] = true
      try {
        const res: any = await fetchRequestExtension(rentalId, newExpectedReturnDate)
        if (res.isSuccess) {
          window.$message.success('延期请求已提交')
          await this.fetchRentalsList()
        }
      }
      catch (error) {
        console.error('请求延期失败:', error)
      }
      finally {
        delete this.itemLoading[rentalId]
      }
    },

    async approveRentalExtension(rentalId: number) {
      this.itemLoading[rentalId] = true
      try {
        const res: any = await fetchApproveExtension(rentalId)
        if (res.isSuccess) {
          window.$message.success('延期请求已批准')
          await this.fetchRentalsList()
        }
      }
      catch (error) {
        console.error('批准延期失败:', error)
      }
      finally {
        delete this.itemLoading[rentalId]
      }
    },

    async rejectRentalExtension(rentalId: number, originalReturnDate: string) {
      this.itemLoading[rentalId] = true
      try {
        const res: any = await fetchRejectExtension(rentalId, originalReturnDate)
        if (res.isSuccess) {
          window.$message.success('延期请求已拒绝')
          await this.fetchRentalsList()
        }
      }
      catch (error) {
        console.error('拒绝延期失败:', error)
      }
      finally {
        delete this.itemLoading[rentalId]
      }
    },

    async cancelRental(rentalId: number) {
      this.itemLoading[rentalId] = true
      const vehicleInstanceStore = useVehicleInstanceStore()
      try {
        const res: any = await fetchCancelRental(rentalId)
        if (res.isSuccess) {
          window.$message.success('租借单已取消')
          await this.fetchRentalsList()
          const cancelledRental = this.items.find(r => r.rental_id === rentalId)
          if (cancelledRental && cancelledRental.vehicle_id && cancelledRental.vehicle_id !== -1) {
            await vehicleInstanceStore.fetchVehicles()
            await this.fetchVehicleOptions() // 重新获取车辆选项
          }
        }
      }
      catch (error) {
        console.error('取消租借单失败:', error)
      }
      finally {
        delete this.itemLoading[rentalId]
      }
    },
  },
})
