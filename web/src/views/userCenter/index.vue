<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useAuthStore } from '@/store';
import { storeToRefs } from 'pinia';
import type { FormInst, FormRules } from 'naive-ui';

const authStore = useAuthStore();
const { userInfo } = storeToRefs(authStore);

const profileFormRef = ref<FormInst | null>(null);
const passwordFormRef = ref<FormInst | null>(null);

const profileModel = reactive({
  name: '',
  address: '',
  phone_number: '',
});

const passwordModel = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
});

const profileLoading = ref(false);
const passwordLoading = ref(false);

onMounted(() => {
  if (authStore.userInfo.user_id) { // Check if userInfo is loaded
    profileModel.name = authStore.userInfo.name;
    profileModel.address = authStore.userInfo.address || '';
    profileModel.phone_number = authStore.userInfo.phone_number || '';
  } else {
    // If userInfo is not loaded yet (e.g. direct navigation), fetch it.
    // This might be redundant if your app ensures userInfo is always loaded for authenticated routes.
    authStore.getUserInfo().then(() => {
      profileModel.name = authStore.userInfo.name;
      profileModel.address = authStore.userInfo.address || '';
      profileModel.phone_number = authStore.userInfo.phone_number || '';
    });
  }
});

const profileRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  phone_number: [{ required: true, message: '请输入电话号码', trigger: 'blur' }],
};

const passwordRules: FormRules = {
  old_password: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value) => value === passwordModel.new_password,
      message: '两次输入的新密码不一致',
      trigger: ['input', 'blur'],
    },
  ],
};

async function handleUpdateProfile() {
  try {
    await profileFormRef.value?.validate();
    profileLoading.value = true;
    await authStore.updateUserProfile({
      name: profileModel.name,
      address: profileModel.address,
      phone_number: profileModel.phone_number,
    });
  } catch (error) {
    // Validation errors are handled by Naive UI
  } finally {
    profileLoading.value = false;
  }
}

async function handleChangePassword() {
  try {
    await passwordFormRef.value?.validate();
    passwordLoading.value = true;
    const success = await authStore.changePassword({
      old_password: passwordModel.old_password,
      new_password: passwordModel.new_password,
    });
    if (success) {
      passwordModel.old_password = '';
      passwordModel.new_password = '';
      passwordModel.confirm_password = '';
      passwordFormRef.value?.restoreValidation();
    }
  } catch (error) {
    // Validation errors
  } finally {
    passwordLoading.value = false;
  }
}
</script>

<template>
  <n-space vertical size="large">
    <n-card title="个人资料">
      <n-descriptions label-placement="left" bordered :column="1" size="large">
        <n-descriptions-item label="用户ID">
          {{ userInfo.user_id }}
        </n-descriptions-item>
        <n-descriptions-item label="邮箱 (登录账号)">
          {{ userInfo.email }}
        </n-descriptions-item>
        <n-descriptions-item label="角色">
          <n-tag v-for="role in userInfo.role" :key="role" type="success" style="margin-right: 8px;">
            {{ role }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="加入日期">
          {{ userInfo.join_date }}
        </n-descriptions-item>
      </n-descriptions>

      <n-divider />

      <n-form
        ref="profileFormRef"
        :model="profileModel"
        :rules="profileRules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
        style="max-width: 500px;"
      >
        <n-form-item label="姓名" path="name">
          <n-input v-model:value="profileModel.name" placeholder="请输入姓名" />
        </n-form-item>
        <n-form-item label="地址" path="address">
          <n-input v-model:value="profileModel.address" type="textarea" placeholder="请输入地址" />
        </n-form-item>
        <n-form-item label="电话号码" path="phone_number">
          <n-input v-model:value="profileModel.phone_number" placeholder="请输入电话号码" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" :loading="profileLoading" @click="handleUpdateProfile">
            更新资料
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <n-card title="修改密码">
      <n-form
        ref="passwordFormRef"
        :model="passwordModel"
        :rules="passwordRules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
        style="max-width: 500px;"
      >
        <n-form-item label="旧密码" path="old_password">
          <n-input v-model:value="passwordModel.old_password" type="password" show-password-on="click" placeholder="请输入旧密码" />
        </n-form-item>
        <n-form-item label="新密码" path="new_password">
          <n-input v-model:value="passwordModel.new_password" type="password" show-password-on="click" placeholder="请输入新密码" />
        </n-form-item>
        <n-form-item label="确认新密码" path="confirm_password">
          <n-input v-model:value="passwordModel.confirm_password" type="password" show-password-on="click" placeholder="请再次输入新密码" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" :loading="passwordLoading" @click="handleChangePassword">
            修改密码
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
  </n-space>
</template>

<style scoped>
.n-card {
  margin-bottom: 20px;
}
</style>
