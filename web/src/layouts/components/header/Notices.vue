<script setup lang="ts">
import { group } from 'radash'
import NoticeList from '../common/NoticeList.vue'

const MassageData = ref<Entity.Message[]>([
])
const currentTab = ref(0)
function handleRead(id: number) {
  const data = MassageData.value.find(i => i.id === id)
  if (data)
    data.isRead = true
  window.$message.success(`id: ${id}`)
}
const massageCount = computed(() => {
  return MassageData.value.filter(i => !i.isRead).length
})
const groupMessage = computed(() => {
  return group(MassageData.value, i => i.type)
})
</script>

<template>
  <n-popover placement="bottom" trigger="click" arrow-point-to-center class="!p-0">
    <template #trigger>
      <n-tooltip placement="bottom" trigger="hover">
        <template #trigger>
          <CommonWrapper>
            <n-badge :value="massageCount" :max="99" style="color: unset">
              <icon-park-outline-remind />
            </n-badge>
          </CommonWrapper>
        </template>
        <span>{{ $t('app.notificationsTips') }}</span>
      </n-tooltip>
    </template>
    <n-tabs v-model:value="currentTab" type="line" animated justify-content="space-evenly" class="w-390px">
      <n-tab-pane :name="0">
        <template #tab>
          <n-space class="w-130px" justify="center">
            {{ $t('app.notifications') }}
            <n-badge type="info" :value="groupMessage[0]?.filter(i => !i.isRead).length" :max="99" />
          </n-space>
        </template>
        <NoticeList :list="groupMessage[0]" @read="handleRead" />
      </n-tab-pane>
      <n-tab-pane :name="1">
        <template #tab>
          <n-space class="w-130px" justify="center">
            {{ $t('app.messages') }}
            <n-badge type="warning" :value="groupMessage[1]?.filter(i => !i.isRead).length" :max="99" />
          </n-space>
        </template>
        <NoticeList :list="groupMessage[1]" @read="handleRead" />
      </n-tab-pane>
      <n-tab-pane :name="2">
        <template #tab>
          <n-space class="w-130px" justify="center">
            {{ $t('app.todos') }}
            <n-badge type="error" :value="groupMessage[2]?.filter(i => !i.isRead).length" :max="99" />
          </n-space>
        </template>
        <NoticeList :list="groupMessage[2]" @read="handleRead" />
      </n-tab-pane>
    </n-tabs>
  </n-popover>
</template>

<style scoped></style>
