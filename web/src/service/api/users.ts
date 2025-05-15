import { request } from '../http'

/**
 * 获取用户列表
 */
export function fetchGetUsers(params?: Record<string, any>) {
  return request.Get<Service.ResponseResult<Entity.User[]>>('/users', { params })
}

/**
 * 更新指定用户信息 (基本信息)
 * @param userId - 用户ID
 * @param data - 需要更新的用户信息
 */
export function fetchUpdateUser(userId: number, data: Partial<Pick<Entity.User, 'name' | 'email' | 'address' | 'phone_number'>>) {
  return request.Put<Service.ResponseResult<Entity.User>>(`/users/${userId}`, data)
}

/**
 * 修改用户权限 (is_admin 和 managed_store_id)
 * @param userId - 用户ID
 * @param data - 包含 is_admin 和可选的 managed_store_id
 */
export function fetchUpdateUserPermissions(userId: number, data: { is_admin: boolean, managed_store_id?: number | null }) {
  return request.Put<Service.ResponseResult<Entity.User>>(`/users/${userId}/permissions`, data)
}
