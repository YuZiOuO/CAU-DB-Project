<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { NCard, NDescriptions, NDescriptionsItem, NModal, NTag, NTimeline, NTimelineItem, NText } from 'naive-ui'
import type { TimelineItemProps } from 'naive-ui'

interface Props {
  show: boolean
  rental: Entity.Rental | null
}

const props = defineProps<Props>()

const emit = defineEmits(['update:show'])

const showModal = computed({
  get: () => props.show,
  set: value => emit('update:show', value),
})

const rentalDetails = computed(() => {
  if (!props.rental)
    return null
  return {
    id: props.rental.rental_id,
    userName: props.rental.user?.name || `用户ID: ${props.rental.user_id}`,
    vehicleInfo: '', // Will be populated below
    rentalDate: props.rental.rental_date,
    expectedReturnDate: props.rental.expected_return_date,
    rentalStore: props.rental.rental_store?.store_name || `门店ID: ${props.rental.rental_store_id}`,
    returnStore: props.rental.return_store?.store_name || `门店ID: ${props.rental.return_store_id}`,
    status: props.rental.rental_status,
  }
})

watchEffect(() => {
  if (props.rental && rentalDetails.value) {
    let vehicleInfoStr = 'N/A'
    if (props.rental.vehicle) {
      const vehicle = props.rental.vehicle
      const type = vehicle.type // Assuming type is populated within vehicle
      vehicleInfoStr = `${type ? `${type.brand} ${type.model}` : `类型ID: ${vehicle.type_id}`} (${vehicle.license_plate || '无牌照'})`
    }
    else if (props.rental.vehicle_type) {
      const type = props.rental.vehicle_type
      vehicleInfoStr = `期望: ${type.brand} ${type.model}`
    }
    rentalDetails.value.vehicleInfo = vehicleInfoStr
  }
})

function getStatusType(status: Entity.RentalStatus | undefined) {
  if (!status)
    return 'default'
  switch (status) {
    case 'pending': return 'warning'
    case 'active': return 'success'
    case 'returned': return 'default'
    case 'cancelled': return 'error'
    case 'extension_requested': return 'info'
    default: return 'default'
  }
}

// 新增函数：将 RentalStatus 转换为 TimelineItemProps['type']
function getTimelineItemTypeFromRentalStatus(status: Entity.RentalStatus): TimelineItemProps['type'] {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'active':
      return 'success'
    case 'returned':
      return 'default' // 或者 'info' 如果想更突出
    case 'cancelled':
      return 'error'
    case 'extension_requested':
      return 'info' // 或者 'warning'
    default:
      return 'default'
  }
}

// Timeline items would ideally come from a dedicated history log.
// Here's a simplified version based on current rental data.
const timelineItems = computed(() => {
  if (!props.rental)
    return []
  const items = []

  if (props.rental.rental_date) {
    items.push({
      type: getTimelineItemTypeFromRentalStatus('pending'), // 初始状态通常是 pending
      title: '租借单创建',
      content: `用户 ${rentalDetails.value?.userName} 发起租借请求`,
      time: props.rental.rental_date,
    })
  }

  // This is a placeholder. Real status changes would need timestamps.
  // For example, if 'approved_at', 'cancelled_at' fields existed.
  // if (props.rental.rental_status === 'pending' && props.rental.rental_date) {
  //   // Handled by creation if no other specific pending event
  // }

  if (props.rental.rental_status === 'active' && props.rental.rental_date) { // Assuming active starts on rental_date if approved
    items.push({
      type: getTimelineItemTypeFromRentalStatus('active'),
      title: '租借开始 (已批准)',
      content: `车辆 ${rentalDetails.value?.vehicleInfo} 已分配`,
      time: props.rental.rental_date, // This might be an approval date in a real scenario
    })
  }

  if (props.rental.rental_status === 'extension_requested') {
    items.push({
      type: getTimelineItemTypeFromRentalStatus('extension_requested'),
      title: '请求延期',
      content: `用户请求将归还日期延至 ${props.rental.expected_return_date}`,
      // time: props.rental.extension_requested_at, // if such field existed
    })
  }

  if (props.rental.rental_status === 'returned') {
    items.push({
      type: getTimelineItemTypeFromRentalStatus('returned'),
      title: '车辆已归还',
      content: `租借单完成`,
      // time: props.rental.actual_return_date, // if such field existed
    })
  }

  if (props.rental.rental_status === 'cancelled') {
    items.push({
      type: getTimelineItemTypeFromRentalStatus('cancelled'),
      title: '租借单已取消',
      // time: props.rental.cancelled_at, // if such field existed
    })
  }

  // Add expected return date as a future/past event
  if (props.rental.expected_return_date) {
    // Exclude certain statuses from showing the expected return date
    const excludedStatuses = ['cancelled', 'returned']
    if (!excludedStatuses.includes(props.rental.rental_status)) {
      const expectedReturnDate = new Date(props.rental.expected_return_date)
      const isPast = expectedReturnDate.getTime() < new Date().setHours(0, 0, 0, 0) && props.rental.rental_status === 'active'

      items.push({
        type: (props.rental.is_overdue && props.rental.rental_status === 'active') ? 'error' : 'info' as const, // 'info' for general expected, 'error' if overdue
        title: props.rental.is_overdue && props.rental.rental_status === 'active' ? '已逾期 - 预计归还' : '预计归还日期',
        content: `计划于此日期归还车辆至 ${rentalDetails.value?.returnStore}`,
        time: props.rental.expected_return_date,
        lineType: isPast ? 'dashed' as const : undefined,
      })
    }
  }

  // Sort items by time if times are actual dates, otherwise by logical order
  // For simplicity, assuming the order of push is somewhat chronological
  return items.sort((a, b) => {
    const timeA = a.time ? new Date(a.time).getTime() : 0
    const timeB = b.time ? new Date(b.time).getTime() : 0
    if (timeA && timeB)
      return timeA - timeB
    return 0 // Keep original order if times are missing/not comparable
  })
})
</script>

<template>
  <NModal v-model:show="showModal" preset="card" title="租借单历史详情" style="width: 600px;" :mask-closable="true">
    <NCard v-if="rentalDetails" :bordered="false">
      <NDescriptions label-placement="left" :column="1" bordered size="small">
        <NDescriptionsItem label="租借单ID">
          {{ rentalDetails.id }}
        </NDescriptionsItem>
        <NDescriptionsItem label="用户">
          {{ rentalDetails.userName }}
        </NDescriptionsItem>
        <NDescriptionsItem label="车辆信息">
          {{ rentalDetails.vehicleInfo }}
        </NDescriptionsItem>
        <NDescriptionsItem label="租借门店">
          {{ rentalDetails.rentalStore }}
        </NDescriptionsItem>
        <NDescriptionsItem label="当前状态">
          <NTag :type="getStatusType(rentalDetails.status)" size="small">
            {{ rentalDetails.status.toUpperCase() }}
          </NTag>
        </NDescriptionsItem>
      </NDescriptions>

      <h3 style="margin-top: 20px; margin-bottom: 10px;">
        状态历史:
      </h3>
      <NTimeline v-if="timelineItems.length > 0">
        <NTimelineItem
          v-for="(item, index) in timelineItems"
          :key="index"
          :type="item.type"
          :title="item.title"
          :content="item.content"
          :time="item.time ? new Date(item.time).toLocaleString() : undefined"
          :line-type="item.lineType"
        />
      </NTimeline>
      <NText v-else depth="3">
        暂无详细历史记录。
      </NText>
    </NCard>
    <NText v-else depth="3">
      加载租借单信息...
    </NText>
  </NModal>
</template>
