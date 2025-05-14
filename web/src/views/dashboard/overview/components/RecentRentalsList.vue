<script setup lang="tsx">
import { onMounted, computed } from 'vue'
import { useRentalStore, useVehicleInstanceStore, useVehicleTypeStore, useAuthStore } from '@/store'
import { storeToRefs } from 'pinia'
import { NTag, NTime, NAvatar, NButton } from 'naive-ui' // NAvatar and NButton added
import { format } from 'date-fns'

interface ProcessedRentalActivity {
  id: number
  userName: string
  userAvatar?: string // Optional user avatar
  vehicleInfo: string
  rentalDate: string | null
  expectedReturnDate: string | null
  status: string
  rawRentalData: Entity.Rental // Keep raw data if needed for actions
}

const rentalStore = useRentalStore()
const vehicleInstanceStore = useVehicleInstanceStore()
const vehicleTypeStore = useVehicleTypeStore()
const authStore = useAuthStore()

const { items: rentalItems, loading: rentalsLoading } = storeToRefs(rentalStore)
const { items: vehicleInstances, loading: vehiclesLoading } = storeToRefs(vehicleInstanceStore)
const { items: vehicleTypes, loading: typesLoading } = storeToRefs(vehicleTypeStore)
const { userInfo } = storeToRefs(authStore)


const loading = computed(() => rentalsLoading.value || vehiclesLoading.value || typesLoading.value)

const processedRecentRentals = computed((): ProcessedRentalActivity[] => {
  const sortedRentals = [...rentalItems.value]
    .sort((a, b) => {
      const dateA = a.rental_date ? new Date(a.rental_date).getTime() : 0
      const dateB = b.rental_date ? new Date(b.rental_date).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 5)

  return sortedRentals.map((rental) => {
    const userName = rental.user?.name || `用户ID: ${rental.user_id}`
    // Assuming user avatar might be part of rental.user or fetched separately
    // For now, using current logged-in user's avatar as a placeholder if it's their rental, or a default
    const userAvatar = (rental.user_id === userInfo.value?.user?.user_id) ? userInfo.value?.user?.avatar : undefined // Or a default avatar path

    let vehicleInfo = '未知车辆'
    if (rental.vehicle_id) {
      const vehicle = vehicleInstances.value.find(v => v.vehicle_id === rental.vehicle_id)
      if (vehicle) {
        const type = vehicleTypes.value.find(t => t.type_id === vehicle.type_id)
        vehicleInfo = `${type ? `${type.brand} ${type.model}` : `类型ID: ${vehicle.type_id}`} (${vehicle.license_plate || '无牌照'})`
      }
      else {
        vehicleInfo = `车辆ID: ${rental.vehicle_id}`
      }
    } else if (rental.vehicle_type_id) {
        const type = vehicleTypeStore.items.find(t => t.type_id === rental.vehicle_type_id);
        if (type) {
            vehicleInfo = `期望: ${type.brand} ${type.model}`;
        } else {
            vehicleInfo = `期望类型ID: ${rental.vehicle_type_id}`;
        }
    }


    return {
      id: rental.rental_id,
      userName,
      userAvatar,
      vehicleInfo,
      rentalDate: rental.rental_date,
      expectedReturnDate: rental.expected_return_date,
      status: rental.rental_status || '未知',
      rawRentalData: rental,
    }
  })
})

// Placeholder for navigation or more details
function viewMoreRentals() {
  // router.push('/rentals/list'); // Example navigation
  window.$message.info('查看更多租赁记录（功能待实现）')
}

function getStatusTagType(status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' {
  const s = status.toLowerCase()
  if (s.includes('active')) return 'success'
  if (s.includes('pending')) return 'warning'
  if (s.includes('returned') || s.includes('completed')) return 'primary'
  if (s.includes('cancelled') || s.includes('rejected')) return 'error'
  if (s.includes('extension_requested')) return 'info'
  return 'default'
}


onMounted(async () => {
  const promises = []
  if (rentalStore.items.length === 0) {
    promises.push(rentalStore.fetchRentalsList())
  }
  if (vehicleInstanceStore.items.length === 0) {
    promises.push(vehicleInstanceStore.fetchVehicles())
  }
  if (vehicleTypeStore.items.length === 0) {
    promises.push(vehicleTypeStore.fetchVehicleTypes())
  }
  await Promise.all(promises)
})
</script>

<template>
  <n-card title="最近租赁活动">
    <template #header-extra>
      <n-button type="primary" quaternary size="small" @click="viewMoreRentals">
        更多
      </n-button>
    </template>
    <n-list hoverable clickable>
      <n-list-item v-if="loading && processedRecentRentals.length === 0">
         <n-skeleton text :repeat="3" />
      </n-list-item>
      <n-list-item v-else-if="!loading && processedRecentRentals.length === 0">
        <n-empty description="暂无租赁活动" />
      </n-list-item>
      <n-list-item v-for="item in processedRecentRentals" :key="item.id">
        <template #prefix>
          <n-avatar round :size="40" :src="item.userAvatar">
            <nova-icon v-if="!item.userAvatar" icon="icon-park-outline:user" />
          </n-avatar>
        </template>
        <n-thing
          :title="`${item.userName} - ${item.vehicleInfo}`"
          :description="`预计归还: ${item.expectedReturnDate ? format(new Date(item.expectedReturnDate), 'yyyy-MM-dd') : 'N/A'}`"
        >
          <template #description>
             <div>状态: <NTag :type="getStatusTagType(item.status)" size="small" :bordered="false">{{ item.status.toUpperCase() }}</NTag></div>
             <div>预计归还: <NTime :time="new Date(item.expectedReturnDate!)" format="yyyy-MM-dd" /></div>
          </template>
          <template #header-extra>
            <NTime v-if="item.rentalDate" :time="new Date(item.rentalDate)" format="yyyy-MM-dd HH:mm" />
          </template>
        </n-thing>
      </n-list-item>
    </n-list>
  </n-card>
</template>
