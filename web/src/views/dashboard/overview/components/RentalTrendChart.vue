<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useEcharts } from '@/hooks'
import type { ECOption } from '@/hooks'
import { useRentalStore } from '@/store'
import { storeToRefs } from 'pinia'
import { format, subDays, eachDayOfInterval } from 'date-fns'

const rentalStore = useRentalStore()
const { items: rentalItems, loading } = storeToRefs(rentalStore)

const chartRef = ref<HTMLElement | null>(null) // Template ref for the chart DOM element

const rentalTrendData = computed(() => {
  const endDate = new Date()
  const startDate = subDays(endDate, 6) // Last 7 days
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

  const dailyCounts = dateRange.map(date => ({
    date: format(date, 'MM-dd'),
    count: 0,
  }))

  rentalItems.value.forEach((rental) => {
    if (rental.rental_date) {
      try {
        const rentalDateStr = format(new Date(rental.rental_date), 'MM-dd')
        const dayData = dailyCounts.find(d => d.date === rentalDateStr)
        if (dayData) {
          dayData.count++
        }
      }
      catch (e) {
        console.error('Error parsing rental_date:', rental.rental_date, e)
      }
    }
  })

  return {
    dates: dailyCounts.map(d => d.date),
    counts: dailyCounts.map(d => d.count),
  }
})

const chartOptions = ref<ECOption>({
  tooltip: {
    trigger: 'axis',
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [], // To be populated by rentalTrendData
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '租赁数量',
      type: 'line',
      smooth: true,
      data: [], // To be populated by rentalTrendData
      areaStyle: {},
      itemStyle: {
        color: 'var(--primary-color)',
      },
    },
  ],
})

// Pass the ref name as a string to useEcharts
const { update } = useEcharts('rentalTrendChartElement', chartOptions)

watch(rentalTrendData, (newData) => {
  chartOptions.value.xAxis = {
    type: 'category',
    boundaryGap: false,
    data: newData.dates,
  }
  chartOptions.value.series = [
    {
      name: '租赁数量',
      type: 'line',
      smooth: true,
      data: newData.counts,
      areaStyle: {},
      itemStyle: {
        color: 'var(--primary-color)',
      },
    },
  ]
  if (update) { // Check if update function is available
    update(chartOptions.value)
  }
}, { deep: true })

onMounted(async () => {
  if (rentalStore.items.length === 0) {
    await rentalStore.fetchRentalsList()
  }
  // Initial update after data is potentially fetched
  if (update && rentalTrendData.value.dates.length > 0) {
     chartOptions.value.xAxis!.data = rentalTrendData.value.dates
     chartOptions.value.series![0].data = rentalTrendData.value.counts
     update(chartOptions.value)
  }
})
</script>

<template>
  <n-card title="最近7日租赁趋势">
    <div ref="rentalTrendChartElement" class="h-300px" />
  </n-card>
</template>
