import { request } from '../http'

/** 获取当前登录用户的信息 */
export function fetchGetProfile() {
  const methodInstance = request.Get<Service.ResponseResult<Entity.User>>('/auth/profile')
  return methodInstance
}

/** 更新当前登录用户的基本信息 */
export function fetchUpdateProfile(data: Partial<Pick<Entity.User, 'name' | 'address' | 'phone_number'>>) {
  const methodInstance = request.Put<Service.ResponseResult<Entity.User>>('/auth/profile', data)
  return methodInstance
}
