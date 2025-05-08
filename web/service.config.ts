/** 不同请求服务的环境配置 */
export const serviceConfig: Record<ServiceEnvType, Record<string, string>> = {
  dev: {
    url: 'http://localhost:5000/api',
  },
  test: {
    url: 'http://localhost:5000/api',
  },
  prod: {
    url: 'http://localhost:5000/api',
  },
}
