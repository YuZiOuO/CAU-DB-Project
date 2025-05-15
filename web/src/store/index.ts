import type { App } from 'vue'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export * from './app/index'
export * from './auth'
export * from './router'
export * from './tab'
export * from './vehicle/typeStore'
export * from './vehicle/instanceStore'
export * from './storeModule'
export * from './rentalStore'
export * from './userManagementStore'

// 安装pinia全局状态库
export function installPinia(app: App) {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app.use(pinia)
}
