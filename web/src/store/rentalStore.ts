import { defineStore } from 'pinia';
import type { SelectOption } from 'naive-ui';
import { fetchCreateRental } from '@/service/api/rentals';
import { useStoreModule } from './storeModule'; // 假设用于获取门店列表

interface CreateRentalForm {
  rental_store_id: number | null;
  expected_return_date: string | null; // YYYY-MM-DD
  return_store_id: number | null;
}

interface RentalState {
  loading: boolean;
  storeOptions: SelectOption[];
}

export const useRentalStore = defineStore('rental-store', {
  state: (): RentalState => ({
    loading: false,
    storeOptions: [],
  }),
  actions: {
    async fetchStoreOptions() {
      const storeModule = useStoreModule();
      if (storeModule.items.length === 0) {
        await storeModule.fetchStores(); //确保门店数据已加载
      }
      this.storeOptions = storeModule.items.map(store => ({
        label: store.store_name,
        value: store.store_id,
      }));
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
        // 错误已在请求拦截器中处理或在此处特定处理
        // window.$message.error('租借请求提交失败'); 
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
});
