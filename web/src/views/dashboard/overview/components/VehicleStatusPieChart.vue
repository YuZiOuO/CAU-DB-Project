<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useEcharts } from '@/hooks'
import type { ECOption } from '@/hooks'
import { useVehicleInstanceStore } from '@/store'
import { storeToRefs } from 'pinia'

const vehicleInstanceStore = useVehicleInstanceStore()
const { items: vehicleItems, loading } = storeToRefs(vehicleInstanceStore)

const chartRef = ref<HTMLElement | null>(null) // Template ref

const vehicleStatusData = computed(() => {
  const statusCounts: Record<string, number> = {}
  vehicleItems.value.forEach((vehicle) => {
    const status = vehicle.status || '未知'
    statusCounts[status] = (statusCounts[status] || 0) + 1
  })
  return Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
})

const chartOptions = ref<ECOption>({
  tooltip: {
    trigger: 'item',
    formatter: '{b} : {c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    data: [], // To be populated
  },
  series: [
    {
      name: '车辆状态',
      type: 'pie',
      radius: '70%',
      data: [], // To be populated
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
})

const { update } = useEcharts('vehicleStatusPieChartElement', chartOptions)

watch(vehicleStatusData, (newData) => {
  chartOptions.value.legend!.data = newData.map(item => item.name)
  chartOptions.value.series = [
    {
      name: '车辆状态',
      type: 'pie',
      radius: '70%',
      data: newData,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ]
  if (update) {
    update(chartOptions.value)
  }
}, { deep: true })

onMounted(async () => {
  if (vehicleInstanceStore.items.length === 0) {
    await vehicleInstanceStore.fetchVehicles()
  }
   // Initial update
  if (update && vehicleStatusData.value.length > 0) {
    chartOptions.value.legend!.data = vehicleStatusData.value.map(item => item.name)
    chartOptions.value.series![0].data = vehicleStatusData.value
    update(chartOptions.value)
  }
})
</script>

<template>
  <n-card title="车辆状态分布">
    <div ref="vehicleStatusPieChartElement" class="h-300px" />
  </n-card>
</template>
