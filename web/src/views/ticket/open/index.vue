<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'; // 新增 computed
import { useRentalStore, useVehicleTypeStore } from '@/store'; // 新增 useVehicleTypeStore
import type { FormInst, FormRules, SelectOption } from 'naive-ui'; // 新增 SelectOption
import { useRouter } from 'vue-router';

const rentalStore = useRentalStore();
const vehicleTypeStore = useVehicleTypeStore(); // 新增
const router = useRouter();

const formRef = ref<FormInst | null>(null);
const formModel = ref<{
  rental_store_id: number | null;
  expected_return_date: string | null;
  return_store_id: number | null;
  vehicle_type_id: number | null; 
}>({
  rental_store_id: null,
  expected_return_date: null,
  return_store_id: null,
  vehicle_type_id: null, 
});

const rules: FormRules = {
  rental_store_id: [{ required: true, type: 'number', message: '请选择租借门店', trigger: ['blur', 'change'] }],
  vehicle_type_id: [{ required: true, type: 'number', message: '请选择车辆类型', trigger: ['blur', 'change'] }], 
  expected_return_date: [{ required: true, message: '请选择期望归还日期', trigger: ['blur', 'change'] }],
  return_store_id: [{ required: true, type: 'number', message: '请选择归还门店', trigger: ['blur', 'change'] }],
};

// 新增：计算车辆类型选项
const vehicleTypeOptionsComputed = computed<SelectOption[]>(() => {
  return vehicleTypeStore.items.map(vt => ({
    label: `${vt.brand} ${vt.model} (日租金: ￥${vt.daily_rent_price.toFixed(2)})`,
    value: vt.type_id,
  }));
});

onMounted(async () => {
  await rentalStore.fetchStoreOptions();
  // 修改：从 vehicleTypeStore 获取车辆类型
  if (vehicleTypeStore.items.length === 0) {
    await vehicleTypeStore.fetchVehicleTypes();
  }
  // Set default expected_return_date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  formModel.value.expected_return_date = tomorrow.toISOString().split('T')[0];
});

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    const success = await rentalStore.createRentalRequest(formModel.value);
    if (success) {
      // Optionally, navigate to another page or reset form
      // router.push('/ticket/list'); // Example navigation
      formModel.value = { // Reset form
        rental_store_id: null,
        expected_return_date: null,
        return_store_id: null,
        vehicle_type_id: null, // 新增
      };
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      formModel.value.expected_return_date = tomorrow.toISOString().split('T')[0];
      formRef.value?.restoreValidation();
    }
  } catch (errors) {
    // Validation errors are handled by Naive UI form
    console.log('Form validation errors:', errors);
  }
}

function disabledDate(ts: number) {
  return ts < Date.now() - 86400000; // Disable dates before today
}
</script>

<template>
  <n-card title="发起租借单">
    <n-form
      ref="formRef"
      :model="formModel"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
      style="max-width: 600px; margin: auto;"
    >
      <n-form-item label="租借门店" path="rental_store_id">
        <n-select
          v-model:value="formModel.rental_store_id"
          placeholder="请选择租借门店"
          :options="rentalStore.storeOptions"
          filterable
        />
      </n-form-item>
      <n-form-item label="车辆类型" path="vehicle_type_id">
        <n-select
          v-model:value="formModel.vehicle_type_id"
          placeholder="请选择车辆类型"
          :options="vehicleTypeOptionsComputed"
          :loading="vehicleTypeStore.loading" 
          filterable
        />
      </n-form-item>
      <n-form-item label="期望归还日期" path="expected_return_date">
        <n-date-picker
          v-model:formatted-value="formModel.expected_return_date"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="请选择期望归还日期"
          class="w-full"
          :is-date-disabled="disabledDate"
        />
      </n-form-item>
      <n-form-item label="归还门店" path="return_store_id">
        <n-select
          v-model:value="formModel.return_store_id"
          placeholder="请选择归还门店"
          :options="rentalStore.storeOptions"
          filterable
        />
      </n-form-item>
      <n-form-item>
        <n-button type="primary" :loading="rentalStore.loading" @click="handleSubmit">
          提交请求
        </n-button>
      </n-form-item>
    </n-form>
  </n-card>
</template>

<style scoped>
.w-full {
  width: 100%;
}
</style>
