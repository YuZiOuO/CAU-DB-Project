<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useAuthStore } from '@/store'
import { storeToRefs } from 'pinia'
import type { FormInst, FormRules } from 'naive-ui'
import {
  NAvatar,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui'

// 定义表单模型接口
interface FormModel {
  name: string | null
  phone_number: string | null
  address: string | null
}

// 初始化 Pinia store 和响应式引用
const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore) // 使用 storeToRefs 保持 userInfo 的响应性

const formRef = ref<FormInst | null>(null)
const formModel = ref<FormModel>({
  name: '',
  phone_number: '',
  address: '',
})
const updateLoading = ref(false) // 更新操作的加载状态
const pageLoading = ref(true) // 页面初始加载状态

// 监听 userInfo 变化，并用其填充表单模型
watchEffect(() => {
  if (userInfo.value && userInfo.value.user) {
    formModel.value.name = userInfo.value.user.name || ''
    formModel.value.phone_number = userInfo.value.user.phone_number || ''
    formModel.value.address = userInfo.value.user.address || ''
  }
})

// 组件挂载时获取用户配置，确保数据最新
onMounted(async () => {
  pageLoading.value = true
  if (userInfo.value && userInfo.value.user) {
    formModel.value.name = userInfo.value.user.name || ''
    formModel.value.phone_number = userInfo.value.user.phone_number || ''
    formModel.value.address = userInfo.value.user.address || ''
  }
  pageLoading.value = false
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入真实姓名', trigger: ['input', 'blur'] },
  ],
  phone_number: [
    { required: true, message: '请输入电话号码', trigger: ['input', 'blur'] },
    // { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的11位手机号码', trigger: ['input', 'blur'], warningOnly: true },
  ],
  address: [
    { required: true, message: '请输入地址', trigger: ['input', 'blur'] },
  ],
}

// 处理用户信息更新操作
async function handleUpdateProfile() {
  try {
    await formRef.value?.validate() // 触发表单验证
    updateLoading.value = true

    // 当前用户信息，用于比较是否有变动
    const currentData = {
      name: userInfo.value?.user.name || '',
      phone_number: userInfo.value?.user.phone_number || '',
      address: userInfo.value?.user.address || '',
    }

    // 准备待更新的数据对象，仅包含有变动的字段
    const updateData: Partial<Pick<Entity.User, 'name' | 'address' | 'phone_number'>> = {}

    if (formModel.value.name !== currentData.name) {
      updateData.name = formModel.value.name
    }
    if (formModel.value.phone_number !== currentData.phone_number) {
      updateData.phone_number = formModel.value.phone_number
    }
    if (formModel.value.address !== currentData.address) {
      updateData.address = formModel.value.address
    }

    if (Object.keys(updateData).length > 0) {
      // 调用 store 中的 action 更新用户信息
      const success = await authStore.updateUserProfile(updateData)
      if (success) {
        window.$message.success('用户信息更新成功！')
        // 成功更新后，authStore 内部应该会更新 userInfo，watchEffect 会自动同步到 formModel
        // 如果 authStore.updateUserProfile 没有更新本地 userInfo，则需要手动调用一次获取最新信息的方法（如果存在）
        // 或者直接更新 formModel (但不推荐，应保持数据源唯一)
      }
    }
    else {
      window.$message.info('信息未发生变化。')
    }
  }
  catch (error) {
    console.error('表单验证失败或发生意外错误:', error)
  }
  finally {
    updateLoading.value = false
  }
}
</script>

<template>
  <NSpace vertical size="large">
    <NCard title="个人信息">
      <NSpin :show="pageLoading">
        <div v-if="userInfo && userInfo.user">
          <NSpace size="large" align="center" :wrap-item="false">
            <NAvatar round :size="128" :src="userInfo.user.avatar || undefined" class="flex-shrink-0" />
            <NDescriptions label-placement="left" :column="2" :title="`你好，${userInfo.user.name || userInfo.user.user_name}`" class="flex-grow">
              <NDescriptionsItem label="用户ID">
                {{ userInfo.user.id }}
              </NDescriptionsItem>
              <NDescriptionsItem label="用户名">
                {{ userInfo.user.user_name }}
              </NDescriptionsItem>
              <NDescriptionsItem label="真实姓名">
                {{ userInfo.user.name || '未设置' }}
              </NDescriptionsItem>
              <NDescriptionsItem label="邮箱">
                {{ userInfo.user.email || '未设置' }}
              </NDescriptionsItem>
              <NDescriptionsItem label="电话号码">
                {{ userInfo.user.phone_number || '未设置' }}
              </NDescriptionsItem>
              <NDescriptionsItem label="地址">
                {{ userInfo.user.address || '未设置' }}
              </NDescriptionsItem>
              <NDescriptionsItem label="角色" :span="2">
                <NTag v-for="role in userInfo.user.role" :key="role.id" type="info" :bordered="false" class="mr-2 mb-1">
                  {{ role.name }}
                </NTag>
                <span v-if="!userInfo.user.role || userInfo.user.role.length === 0">无</span>
              </NDescriptionsItem>
            </NDescriptions>
          </NSpace>
        </div>
        <!-- 用户信息加载失败提示 -->
        <div v-else class="text-center p-8 min-h-[200px] flex items-center justify-center">
          <span v-if="!pageLoading">无法加载用户信息。</span>
        </div>
      </NSpin>
    </NCard>

    <NCard title="信息修改">
      <NSpin :show="pageLoading">
        <NSpace v-if="userInfo && userInfo.user" justify="center" class="w-full">
          <NForm
            ref="formRef"
            :model="formModel"
            :rules="rules"
            label-placement="left"
            label-width="auto"
            require-mark-placement="right-hanging"
            style="max-width: 600px;"
          >
            <NFormItem label="真实姓名" path="name">
              <NInput v-model:value="formModel.name" placeholder="请输入真实姓名" />
            </NFormItem>
            <NFormItem label="电话号码" path="phone_number">
              <NInput v-model:value="formModel.phone_number" placeholder="请输入电话号码 (可选)" />
            </NFormItem>
            <NFormItem label="地址" path="address">
              <NInput v-model:value="formModel.address" type="textarea" placeholder="请输入地址 (可选)" :autosize="{ minRows: 2, maxRows: 4 }" />
            </NFormItem>
            <NFormItem class="flex justify-end mt-4">
              <NButton type="primary" :loading="updateLoading" @click="handleUpdateProfile">
                更新信息
              </NButton>
            </NFormItem>
          </NForm>
        </NSpace>
        <div v-else class="text-center p-8 min-h-[200px] flex items-center justify-center">
          <span v-if="!pageLoading">表单无法加载。</span>
        </div>
      </NSpin>
    </NCard>
  </NSpace>
</template>
