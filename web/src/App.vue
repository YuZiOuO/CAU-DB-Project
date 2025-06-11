<script setup lang="ts">
import { naiveI18nOptions } from '@/utils'
import { darkTheme } from 'naive-ui'
import { useAppStore } from './store'

const appStore = useAppStore()

const naiveLocale = computed(() => {
  return naiveI18nOptions[appStore.lang] ? naiveI18nOptions[appStore.lang] : naiveI18nOptions.enUS
},
)

onMounted(async () => {
  const chatbotScript = document.createElement('script')
  chatbotScript.async = true
  chatbotScript.src = 'https://ioscdb2deoq2qdgbps2walgn.agents.do-ai.run/static/chatbot/widget.js'
  chatbotScript.setAttribute('data-agent-id', 'd461cbe7-1c37-11f0-bf8f-4e013e2ddde4')
  chatbotScript.setAttribute('data-chatbot-id', 'w8bBjW2cjPOaGIpa2_4B-EsrulUlfNJz')
  chatbotScript.setAttribute('data-name', 'trans Chatbot')
  chatbotScript.setAttribute('data-primary-color', '#031B4E')
  chatbotScript.setAttribute('data-secondary-color', '#E5E8ED')
  chatbotScript.setAttribute('data-button-background-color', '#0061EB')
  chatbotScript.setAttribute('data-starting-message', 'Hello! How can I help you today?')
  chatbotScript.setAttribute('data-logo', '/static/chatbot/icons/default-agent.svg')
  document.body.appendChild(chatbotScript)
})
</script>

<template>
  <n-config-provider
    class="wh-full" inline-theme-disabled :theme="appStore.colorMode === 'dark' ? darkTheme : null"
    :locale="naiveLocale.locale" :date-locale="naiveLocale.dateLocale" :theme-overrides="appStore.theme"
  >
    <naive-provider>
      <router-view />
      <Watermark :show-watermark="appStore.showWatermark" />
    </naive-provider>
  </n-config-provider>
</template>
