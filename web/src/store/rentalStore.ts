import { defineStore } from 'pinia';
import type { SelectOption } from 'naive-ui';
import {
  fetchCreateRental,
  fetchGetRentals,
  fetchApproveRental,
  fetchReturnRental,
  fetchRequestExtension,
  fetchApproveExtension,
  fetchRejectExtension,
  fetchCancelRental,
} from '@/service/api/rentals';
import { useStoreModule } from './storeModule';
import { useVehicleInstanceStore } from './vehicle/instanceStore'; // 用于获取车辆列表

interface CreateRentalForm {
  rental_store_id: number | null;
  expected_return_date: string | null; // YYYY-MM-DD
  return_store_id: number | null;
}

interface RentalState {
  items: Entity.Rental[];
  displayedItems: Entity.Rental[]; // 如果需要前端筛选/分页
  loading: boolean;
  itemLoading: Record<number, boolean>; // 用于单个项目的加载状态
  storeOptions: SelectOption[];
  vehicleOptions: SelectOption[]; // 用于批准租借时选择车辆
  vehicleLoading: boolean;
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
  actions: {
    async fetchStoreOptions() {
      const storeModule = useStoreModule();
      if (storeModule.items.length === 0 && !storeModule.loading) {
        await storeModule.fetchStores();
      }
      this.storeOptions = storeModule.items.map(store => ({
        label: store.store_name,
        value: store.store_id,
      }));
    },
    async fetchVehicleOptions() {
      this.vehicleLoading = true;
      const vehicleInstanceStore = useVehicleInstanceStore();
      if (vehicleInstanceStore.items.length === 0 && !vehicleInstanceStore.loading) {
        await vehicleInstanceStore.fetchVehicles();
      }
      // 筛选理论上可用的车辆（这里简单列出所有，后端会做最终校验）
      this.vehicleOptions = vehicleInstanceStore.items
        .filter(v => v.type) // 确保车辆有关联的类型信息
        .map(vehicle => ({
          label: `${vehicle.type!.brand} ${vehicle.type!.model} (ID: ${vehicle.vehicle_id})`,
          value: vehicle.vehicle_id,
        }));
      this.vehicleLoading = false;
    },
    async createRentalRequest(data: CreateRentalForm) {
      if (!data.rental_store_id || !data.expected_return_date || !data.return_store_id) {
        window.$message.error('请填写所有必填项');
        return false;
      }
      this.loading = true;
      try {
        await fetchCreateRental({
          rental_store_id: data.rental_store_id,
          expected_return_date: data.expected_return_date,
          return_store_id: data.return_store_id,
        });
        window.$message.success('租借请求已提交');
        return true;
      } catch (error) {
        console.error('创建租借请求失败:', error);
        // window.$message.error('租借请求提交失败'); // 错误已在 service/http.ts 中统一处理
        return false;
      } finally {
        this.loading = false;
      }
    },

    async fetchRentalsList() {
      this.loading = true;
      try {
        const res: any = await fetchGetRentals();
        this.items = res.data || [];
        this.displayedItems = [...this.items];
      } catch (error) {
        console.error('获取租借单列表失败:', error);
        this.items = [];
        this.displayedItems = [];
        // window.$message.error('获取租借单列表失败');
      } finally {
        this.loading = false;
      }
    },

    async approveRental(rentalId: number, vehicleId: number) {
      this.itemLoading[rentalId] = true;
      try {
        await fetchApproveRental(rentalId, vehicleId);
        window.$message.success('租借单已批准');
        await this.fetchRentalsList(); // Refresh list
      } catch (error) {
        console.error('批准租借单失败:', error);
        // window.$message.error('批准租借单失败');
      } finally {
        this.itemLoading[rentalId] = false;
      }
    },

    async returnRental(rentalId: number) {
      this.itemLoading[rentalId] = true;
      try {
        await fetchReturnRental(rentalId);
        window.$message.success('车辆已标记为归还');
        await this.fetchRentalsList(); // Refresh list
      } catch (error) {
        console.error('标记归还失败:', error);
        // window.$message.error('标记归还失败');
      } finally {
        this.itemLoading[rentalId] = false;
      }
    },

    async requestRentalExtension(rentalId: number, newExpectedReturnDate: string) {
      this.itemLoading[rentalId] = true;
      try {
        await fetchRequestExtension(rentalId, newExpectedReturnDate);
        window.$message.success('延期请求已提交');
        await this.fetchRentalsList(); // Refresh list
      } catch (error) {
        console.error('请求延期失败:', error);
        // window.$message.error('请求延期失败');
      } finally {
        this.itemLoading[rentalId] = false;
      }
    },

    async approveRentalExtension(rentalId: number) {
      this.itemLoading[rentalId] = true;
      try {
        await fetchApproveExtension(rentalId);
        window.$message.success('延期请求已批准');
        await this.fetchRentalsList(); // Refresh list
      } catch (error) {
        console.error('批准延期失败:', error);
        // window.$message.error('批准延期失败');
      } finally {
        this.itemLoading[rentalId] = false;
      }
    },

    async rejectRentalExtension(rentalId: number, originalReturnDate: string) {
      this.itemLoading[rentalId] = true;
      try {
        // 注意: API 需要 original_return_date。前端需要一种方式获取此日期。
        await fetchRejectExtension(rentalId, originalReturnDate);
        window.$message.success('延期请求已拒绝');
        await this.fetchRentalsList(); // Refresh list
      } catch (error) {
        console.error('拒绝延期失败:', error);
        // window.$message.error('拒绝延期失败');
      } finally {
        this.itemLoading[rentalId] = false;
      }
    },

    async cancelRental(rentalId: number) {
      this.itemLoading[rentalId] = true;
      try {
        await fetchCancelRental(rentalId);
        window.$message.success('租借单已取消');
        await this.fetchRentalsList(); // Refresh list
      } catch (error) {
        console.error('取消租借单失败:', error);
        // window.$message.error('取消租借单失败');
      } finally {
        this.itemLoading[rentalId] = false;
      }
    },
  },
});
