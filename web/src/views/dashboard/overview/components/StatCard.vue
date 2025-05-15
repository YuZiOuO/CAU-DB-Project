<script setup lang="ts">
interface Props {
  title: string
  value: number | string
  icon?: string
  iconColor?: string
  unit?: string
}

defineProps<Props>()
</script>

<template>
  <n-card>
    <n-thing>
      <template v-if="icon" #avatar>
        <n-icon-wrapper :size="40" :border-radius="999" :color="iconColor ? iconColor : 'var(--primary-color-suppl)'">
          <nova-icon :icon="icon" :size="22" :color="iconColor ? '#fff' : 'var(--primary-color)'" />
        </n-icon-wrapper>
      </template>
      <template #header>
        <n-statistic :label="title">
          <n-number-animation show-separator :from="0" :to="Number(value) || 0" />
          <template v-if="unit" #suffix>
            {{ unit }}
          </template>
        </n-statistic>
      </template>
    </n-thing>
  </n-card>
</template>
