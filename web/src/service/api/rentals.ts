import { request } from '../http'

/** 创建租借单请求的数据结构 */
interface ICreateRentalData {
  rental_store_id: number
  expected_return_date: string // YYYY-MM-DD
  return_store_id: number
  vehicle_type_id: number // 新增：用户期望的车辆类型ID
}

/**
 * 获取当前用户的租借单列表 (根据用户角色不同，返回内容不同)
 */
export function fetchGetRentals() {
  return request.Get<Service.ResponseResult<Entity.Rental[]>>('/rentals')
}

/**
 * 根据ID获取特定租借单详情
 * @param rentalId - 租借单ID
 */
export function fetchGetRentalById(rentalId: number) {
  return request.Get<Service.ResponseResult<Entity.Rental>>(`/rentals/${rentalId}`)
}

/**
 * 创建新的租借请求
 * @param data - 创建租借单所需数据
 */
export function fetchCreateRental(data: ICreateRentalData) {
  return request.Post<Service.ResponseResult<Entity.Rental>>('/rentals', data)
}

/**
 * 批准租借请求并分配车辆 (管理员操作)
 * @param rentalId - 租借单ID
 * @param vehicleId - 分配的车辆ID
 */
export function fetchApproveRental(rentalId: number, vehicleId: number) {
  return request.Put<Service.ResponseResult<Entity.Rental>>(`/rentals/${rentalId}/approve`, { vehicle_id: vehicleId })
}

/**
 * 标记租借单为已归还 (管理员操作)
 * @param rentalId - 租借单ID
 */
export function fetchReturnRental(rentalId: number) {
  return request.Put<Service.ResponseResult<Entity.Rental>>(`/rentals/${rentalId}/return`)
}

/**
 * 用户请求延长租借期
 * @param rentalId - 租借单ID
 * @param newExpectedReturnDate - 新的期望归还日期 (YYYY-MM-DD)
 */
export function fetchRequestExtension(rentalId: number, newExpectedReturnDate: string) {
  return request.Put<Service.ResponseResult<Entity.Rental>>(`/rentals/${rentalId}/extend`, { expected_return_date: newExpectedReturnDate })
}

/**
 * 批准延长租借请求 (管理员操作)
 * @param rentalId - 租借单ID
 */
export function fetchApproveExtension(rentalId: number) {
  return request.Put<Service.ResponseResult<Entity.Rental>>(`/rentals/${rentalId}/approve-extension`)
}

/**
 * 拒绝延长租借请求 (管理员操作)
 * @param rentalId - 租借单ID
 * @param originalReturnDate - 原始归还日期 (YYYY-MM-DD), 用于恢复日期
 */
export function fetchRejectExtension(rentalId: number, originalReturnDate: string) {
  return request.Put<Service.ResponseResult<Entity.Rental>>(`/rentals/${rentalId}/reject-extension`, { original_return_date: originalReturnDate })
}

/**
 * 取消租借单
 * (用户可取消pending状态的订单，管理员可取消大部分状态的订单)
 * @param rentalId - 租借单ID
 */
export function fetchCancelRental(rentalId: number) {
  return request.Put<Service.ResponseResult<Entity.Rental>>(`/rentals/${rentalId}/cancel`)
}
