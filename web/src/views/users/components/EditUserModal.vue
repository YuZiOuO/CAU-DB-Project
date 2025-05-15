<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { useUserManagementStore } from '@/store'

interface Props {
  show: boolean
  userData: Entity.User | null
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'success'): void
}>()

const userManagementStore = useUserManagementStore()

const formRef = ref<FormInst | null>(null)
const formModel = ref<Partial<Pick<Entity.User, 'name' | 'email' | 'address' | 'phone_number'>>>({})

const rules: FormRules = {
  name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: '请输入有效的邮箱地址', trigger: ['input', 'blur'] }],
}

watch(() => props.show, (newVal) => {
  if (newVal && props.userData) {
    formModel.value = {
      name: props.userData.name || '',
      email: props.userData.email || '',
      address: props.userData.address || '',
      phone_number: props.userData.phone_number || '',
    }
  }
  else {
    formModel.value = {}
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

    isLoading.value = true
    const success = await userManagementStore.updateUser(props.userData.user_id, formModel.value)
    if (success) {
      emit('success')
    }
  }
  finally {
    isLoading.value = false
  }
}

function handleClose() {
  emit('update:show', false)
}
</script>

<template>
  <NModal
    v-model:show="modalVisible"
    preset="dialog"
    title="修改用户信息"
    positive-text="确认"
    negative-text="取消"
    :loading="isLoading"
    style="width: 600px;"
    @positive-click="handleSubmit"
    @negative-click="handleClose"
    @close="handleClose"
  >
    <n-form ref="formRef" :model="formModel" :rules="rules" label-placement="left" label-width="auto">
      <n-form-item label="真实姓名" path="name">
        <n-input v-model:value="formModel.name" placeholder="请输入真实姓名" />
      </n-form-item>
      <n-form-item label="邮箱" path="email">
        <n-input v-model:value="formModel.email" placeholder="请输入邮箱" />
      </n-form-item>
      <n-form-item label="地址" path="address">
        <n-input v-model:value="formModel.address" type="textarea" placeholder="请输入地址" />
      </n-form-item>
      <n-form-item label="电话号码" path="phone_number">
        <n-input v-model:value="formModel.phone_number" placeholder="请输入电话号码" />
      </n-form-item>
    </n-form>
  </NModal>
</template>
