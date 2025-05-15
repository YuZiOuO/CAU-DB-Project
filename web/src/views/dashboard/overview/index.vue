<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import StatCard from './components/StatCard.vue'
import RentalTrendChart from './components/RentalTrendChart.vue'
import VehicleStatusPieChart from './components/VehicleStatusPieChart.vue'
import RecentRentalsList from './components/RecentRentalsList.vue'

import { useVehicleInstanceStore, useRentalStore, useAuthStore, useStoreModule } from '@/store'
import { storeToRefs } from 'pinia'

const vehicleInstanceStore = useVehicleInstanceStore()
const rentalStore = useRentalStore()
const authStore = useAuthStore()
const storeModule = useStoreModule()

const { items: vehicleItems, loading: vehiclesLoading } = storeToRefs(vehicleInstanceStore)
const { items: rentalItems, loading: rentalsLoading } = storeToRefs(rentalStore)
const { userInfo, isLogin } = storeToRefs(authStore)
const { items: storeItems, loading: storesLoading } = storeToRefs(storeModule)

const totalVehicles = computed(() => vehicleItems.value.length)
const availableVehiclesCount = computed(() => vehicleItems.value.filter(v => v.status === 'available').length)
const activeRentalsCount = computed(() => rentalItems.value.filter(r => r.rental_status === 'active' || r.rental_status === 'pending' || r.rental_status === 'extension_requested').length)
const totalStores = computed(() => storeItems.value.length)

// Total users count is not directly available from a simple store property.
// Using a placeholder or assuming it might be fetched differently.
// For now, we'll use a mock value if not available.
const totalUsers = ref(0) // Placeholder, ideally fetched from a userStore or specific API

const welcomeName = computed(() => (isLogin.value && userInfo.value?.user?.name) ? userInfo.value.user.name : '用户')

onMounted(async () => {
  const promises = []
  if (vehicleInstanceStore.items.length === 0) {
    promises.push(vehicleInstanceStore.fetchVehicles())
  }
  if (rentalStore.items.length === 0) {
    promises.push(rentalStore.fetchRentalsList())
  }
  if (storeModule.items.length === 0) {
    promises.push(storeModule.fetchStores())
  }
  // Example: if you had a way to get total user count
  // promises.push(fetchTotalUserCount().then(count => totalUsers.value = count));
  // For now, using a mock value if not fetched:
  if (totalUsers.value === 0) totalUsers.value = 500 // Mock

  await Promise.all(promises)
})
</script>

<template>
  <n-space vertical size="large">
    <n-card :title="`欢迎回来, ${welcomeName}!`">
      <n-text>开始新的一天，管理您的车辆租赁业务。</n-text>
    </n-card>

    <n-grid cols="1 s:2 m:2 l:4" responsive="screen" :x-gap="16" :y-gap="16">
      <n-gi>
        <StatCard title="总车辆数" :value="totalVehicles" icon="icon-park-outline:transporter" icon-color="var(--primary-color-suppl)" />
      </n-gi>
      <n-gi>
        <StatCard title="可用车辆" :value="availableVehiclesCount" icon="icon-park-outline:car" icon-color="var(--success-color-suppl)" />
      </n-gi>
      <n-gi>
        <StatCard title="活跃订单" :value="activeRentalsCount" icon="icon-park-outline:order" icon-color="var(--warning-color-suppl)" />
      </n-gi>
      <n-gi>
        <StatCard title="总门店数" :value="totalStores" icon="icon-park-outline:shop" icon-color="var(--info-color-suppl)" />
      </n-gi>
      <!-- <n-gi>
        <StatCard title="注册用户" :value="totalUsers" icon="icon-park-outline:every-user" icon-color="var(--info-color-suppl)" />
      </n-gi> -->
    </n-grid>

    <n-grid cols="1 m:3" responsive="screen" :x-gap="16" :y-gap="16">
      <n-gi span="1 m:2">
        <RentalTrendChart />
      </n-gi>
      <n-gi>
        <VehicleStatusPieChart />
      </n-gi>
    </n-grid>

    <RecentRentalsList />

  </n-space>
</template>
