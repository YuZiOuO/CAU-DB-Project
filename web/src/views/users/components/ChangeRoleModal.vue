<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FormInst, FormRules, SelectOption } from 'naive-ui'
import { useAuthStore, useUserManagementStore } from '@/store' // 引入 useAuthStore
import { storeToRefs } from 'pinia' // 引入 storeToRefs

interface Props {
  show: boolean
  userData: Entity.User | null
  storeOptions: SelectOption[]
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'success'): void
}>()

const userManagementStore = useUserManagementStore()
const authStore = useAuthStore() // 初始化 authStore
const { userInfo } = storeToRefs(authStore) // 获取 userInfo

const formRef = ref<FormInst | null>(null)
const formModel = ref<{
  is_admin: boolean
  managed_store_id: number | null
}>({
  is_admin: false,
  managed_store_id: null,
})

watch(() => props.show, (newVal) => {
  if (newVal && props.userData) {
    formModel.value.is_admin = props.userData.role ? props.userData.role.includes('super') : false
    formModel.value.managed_store_id = props.userData.managed_store_id || null
  }
  else {
    formModel.value.is_admin = false
    formModel.value.managed_store_id = null
    formRef.value?.restoreValidation()
  }
})

const modalVisible = computed({
  get: () => props.show,
  set: val => emit('update:show', val),
})

const isLoading = ref(false)

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    if (!props.userData)
      return

    // 检查是否是超级管理员修改自己的权限
    const loggedInUserIsSuperAdmin = userInfo.value?.user?.role?.some(r => r === 'super')
    if (props.userData.user_id === userInfo.value?.user?.user_id && loggedInUserIsSuperAdmin) {
      window.$message.error('超级管理员不能修改自己的权限。')
      emit('update:show', false) // 关闭模态框
      return
    }

    isLoading.value = true
    const success = await userManagementStore.updateUserPermissions(
      props.userData.user_id,
      formModel.value.is_admin,
      formModel.value.is_admin ? formModel.value.managed_store_id : null,
    )
    if (success) {
      emit('success')
    }
  }
  catch (error) {
    console.error('权限修改提交错误:', error)
  }
  finally {
    isLoading.value = false
  }
}

function handleClose() {
  emit('update:show', false)
}

const rules: FormRules = {
  is_admin: [{ required: true, type: 'boolean', message: '请设置是否为管理员', trigger: 'change' }],
  managed_store_id: [
    {
      validator: (rule, value) => {
        if (formModel.value.is_admin && !value) {
          return new Error('请为门店管理员选择一个管理的门店')
        }
        return true
      },
      trigger: ['blur', 'change'],
    },
  ],
}
</script>

<template>
  <NModal
    v-model:show="modalVisible"
    preset="dialog"
    title="修改用户权限"
    positive-text="确认"
    negative-text="取消"
    :loading="isLoading"
    style="width: 600px;"
    @positive-click="handleSubmit"
    @negative-click="handleClose"
    @close="handleClose"
  >
    <n-form ref="formRef" :model="formModel" :rules="rules" label-placement="top">
      <n-form-item label="设置为管理员" path="is_admin">
        <n-switch v-model:value="formModel.is_admin">
          <template #checked>
            是
          </template>
          <template #unchecked>
            否
          </template>
        </n-switch>
      </n-form-item>
      <n-form-item v-if="formModel.is_admin" label="管理门店 (留空则为超级管理员)" path="managed_store_id">
        <n-select
          v-model:value="formModel.managed_store_id"
          placeholder="选择门店 (或留空成为超级管理员)"
          :options="props.storeOptions"
          :loading="userManagementStore.loading"
          clearable
        />
      </n-form-item>
    </n-form>
  </NModal>
</template>
