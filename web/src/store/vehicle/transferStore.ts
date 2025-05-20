import { defineStore } from 'pinia'
import {
  fetchApproveVehicleTransfer,
  fetchCancelVehicleTransfer,
  fetchCompleteVehicleTransfer,
  fetchCreateVehicleTransfer,
  fetchGetVehicleTransfers,
} from '@/service/api/vehicle_transfer'
// import { useVehicleInstanceStore } from './instanceStore'; // 如果需要更新车辆实例状态，则取消注释

interface VehicleTransferState {
  items: Entity.VehicleTransfer[]
  displayedItems: Entity.VehicleTransfer[]
  loading: boolean
  itemLoading: Record<number, boolean> // 用于单个流转项的操作加载状态
  // filterModel: any // 可根据需要添加筛选模型
}

export const useVehicleTransferStore = defineStore('vehicle-transfer-store', {
  state: (): VehicleTransferState => ({
    items: [],
    displayedItems: [],
    loading: false,
    itemLoading: {},
    // filterModel: {},
  }),
  actions: {
    async fetchVehicleTransfers() {
      this.loading = true
      try {
        const res: any = await fetchGetVehicleTransfers()
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
        console.error('获取车辆流转列表失败:', error)
        this.items = []
        this.displayedItems = []
      }
      finally {
        this.loading = false
      }
    },

    async createVehicleTransfer(data: {
      vehicle_id: number
      source_store_id: number
      destination_store_id: number
      notes?: string
    }) {
      // this.loading = true; // 通常创建操作有自己的加载状态，或者由调用方处理
      try {
        const res: any = await fetchCreateVehicleTransfer(data)
        if (res.isSuccess) {
          window.$message.success('车辆流转请求已发起')
          await this.fetchVehicleTransfers() // 创建成功后刷新列表
          return true
        }
        return false
      }
      catch (error) {
        console.error('发起车辆流转失败:', error)
        return false
      }
      // finally {
      //   this.loading = false;
      // }
    },

    async approveVehicleTransfer(transferId: number) {
      this.itemLoading[transferId] = true
      try {
        const res: any = await fetchApproveVehicleTransfer(transferId)
        if (res.isSuccess) {
          window.$message.success('车辆流转已批准')
          await this.fetchVehicleTransfers()
        }
      }
      catch (error) {
        console.error('批准车辆流转失败:', error)
      }
      finally {
        delete this.itemLoading[transferId]
      }
    },

    async completeVehicleTransfer(transferId: number) {
      this.itemLoading[transferId] = true
      // const vehicleInstanceStore = useVehicleInstanceStore(); // 如果需要更新车辆实例
      try {
        const res: any = await fetchCompleteVehicleTransfer(transferId)
        if (res.isSuccess) {
          window.$message.success('车辆流转已完成')
          await this.fetchVehicleTransfers()
          // await vehicleInstanceStore.fetchVehicles(); // 流转完成后，车辆所属门店已改变，刷新车辆实例列表
        }
      }
      catch (error) {
        console.error('完成车辆流转失败:', error)
      }
      finally {
        delete this.itemLoading[transferId]
      }
    },

    async cancelVehicleTransfer(transferId: number) {
      this.itemLoading[transferId] = true
      try {
        const res: any = await fetchCancelVehicleTransfer(transferId)
        if (res.isSuccess) {
          window.$message.success('车辆流转已取消')
          await this.fetchVehicleTransfers()
        }
      }
      catch (error) {
        console.error('取消车辆流转失败:', error)
      }
      finally {
        delete this.itemLoading[transferId]
      }
    },
    // applyFilters() { /* 根据需要实现 */ },
    // resetFilters() { /* 根据需要实现 */ },
  },
})
