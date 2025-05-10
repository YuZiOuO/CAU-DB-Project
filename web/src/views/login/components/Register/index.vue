<script setup lang="ts">
import { useAuthStore } from '@/store'
import type { FormInst } from 'naive-ui'

const emit = defineEmits(['update:modelValue'])
function toLogin() {
  emit('update:modelValue', 'login')
}
const { t } = useI18n()
const authStore = useAuthStore()

const formValue = ref({
  account: '',
  name: '',
  address: '',
  phone_number: '',
  pwd: '',
  rePwd: '',
})

const rules = {
  account: {
    required: true,
    trigger: 'blur',
    message: t('login.accountRuleTip'),
  },
  name: {
    required: true,
    trigger: 'blur',
    message: t('login.nameRuleTip'),
  },
  address: {
    required: true,
    trigger: 'blur',
    message: t('login.addressRuleTip'),
  },
  phone_number: {
    required: true,
    trigger: 'blur',
    message: t('login.phoneNumberRuleTip'),
  },
  pwd: {
    required: true,
    trigger: 'blur',
    message: t('login.passwordRuleTip'),
  },
  rePwd: {
    required: true,
    trigger: 'blur',
    message: t('login.checkPasswordRuleTip'),
    validator(rule: any, value: string) {
      if (value !== formValue.value.pwd)
        return new Error(t('login.checkPasswordRuleTip'))
      return true
    },
  },
}

const formRef = ref<FormInst | null>(null)

const isRead = ref(false)
const isLoading = ref(false)

function handleRegister() {
  formRef.value?.validate(async (errors) => {
    if (errors)
      return

    isLoading.value = true
    const { name, account, pwd, address, phone_number } = formValue.value

    await authStore.register(name, account, pwd, address, phone_number)
    isLoading.value = false
  })
}
</script>

<template>
  <div>
    <n-h2 depth="3" class="text-center">
      {{ $t('login.registerTitle') }}
    </n-h2>
    <n-form
      ref="formRef"
      :rules="rules"
      :model="formValue"
      :show-label="false"
      size="large"
    >
      <n-form-item path="account">
        <n-input
          v-model:value="formValue.account"
          clearable
          :placeholder="$t('login.accountPlaceholder')"
        />
      </n-form-item>
      <n-form-item path="name">
        <n-input
          v-model:value="formValue.name"
          clearable
          :placeholder="$t('login.namePlaceholder')"
        />
      </n-form-item>
      <n-form-item path="address">
        <n-input
          v-model:value="formValue.address"
          clearable
          :placeholder="$t('login.addressPlaceholder')"
        />
      </n-form-item>
      <n-form-item path="phone_number">
        <n-input
          v-model:value="formValue.phone_number"
          clearable
          :placeholder="$t('login.phoneNumberPlaceholder')"
        />
      </n-form-item>
      <n-form-item path="pwd">
        <n-input
          v-model:value="formValue.pwd"
          type="password"
          :placeholder="$t('login.passwordPlaceholder')"
          clearable
          show-password-on="click"
        >
          <template #password-invisible-icon>
            <icon-park-outline-preview-close-one />
          </template>
          <template #password-visible-icon>
            <icon-park-outline-preview-open />
          </template>
        </n-input>
      </n-form-item>
      <n-form-item path="rePwd">
        <n-input
          v-model:value="formValue.rePwd"
          type="password"
          :placeholder="$t('login.checkPasswordPlaceholder')"
          clearable
          show-password-on="click"
        >
          <template #password-invisible-icon>
            <icon-park-outline-preview-close-one />
          </template>
          <template #password-visible-icon>
            <icon-park-outline-preview-open />
          </template>
        </n-input>
      </n-form-item>
      <n-form-item>
        <n-space
          vertical
          :size="20"
          class="w-full"
        >
          <n-checkbox v-model:checked="isRead">
            {{ $t('login.readAndAgree') }} <n-button
              type="primary"
              text
            >
              {{ $t('login.userAgreement') }}
            </n-button>
          </n-checkbox>
          <n-button
            block
            type="primary"
            :loading="isLoading" :disabled="isLoading"
            @click="handleRegister"
          >
            {{ $t('login.signUp') }}
          </n-button>
          <n-flex justify="center">
            <n-text>{{ $t('login.haveAccountText') }}</n-text>
            <n-button
              text
              type="primary"
              @click="toLogin"
            >
              {{ $t('login.signIn') }}
            </n-button>
          </n-flex>
        </n-space>
      </n-form-item>
    </n-form>
  </div>
</template>

<style scoped></style>
