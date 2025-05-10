import { request } from '../http'

interface Ilogin {
  email: string
  password: string
}

export function fetchLogin(data: Ilogin) {
  const methodInstance = request.Post<Service.ResponseResult<Api.Login.Info>>('/users/login', data)
  methodInstance.meta = {
    authRole: null,
  }
  return methodInstance
}
export function fetchUpdateToken(data: any) {
  const method = request.Post<Service.ResponseResult<Api.Login.Info>>('/users/refresh', data)
  method.meta = {
    authRole: 'refreshToken',
  }
  return method
}

export function fetchUserRoutes(params: { id: number }) {
  return request.Get<Service.ResponseResult<AppRoute.RowRoute[]>>('/getUserRoutes', { params })
}
