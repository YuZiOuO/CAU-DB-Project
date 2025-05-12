import { request } from '../http'

// 定义创建/更新车辆时使用的数据结构
// 基于典型的车辆属性和后端期望
interface IVehicleData {
  make: string
  model: string
  year: number
  license_plate: string
  status: string // 例如: 'available', 'rented', 'maintenance'
  daily_rate: number
  store_id: number // 该车辆所属的店铺ID
}

export function fetchGetVehicles() {
  const methodInstance
    = request.Get<Service.ResponseResult<Entity.Vehicle[]>>('/vehicles') // 使用 Entity.Vehicle
  return methodInstance
}

export function fetchCreateVehicle(data: IVehicleData) {
  const methodInstance = request.Post<Service.ResponseResult<Entity.Vehicle>>('/vehicles', data) // 使用 Entity.Vehicle
  return methodInstance
}

export function fetchUpdateVehicle(id: number, data: IVehicleData) {
  const methodInstance = request.Put<Service.ResponseResult<Entity.Vehicle>>(`/vehicles/${id}`, data) // 使用 Entity.Vehicle
  return methodInstance
}

export function fetchDeleteVehicle(id: number) {
  const methodInstance = request.Delete<Service.ResponseResult<null>>(`/vehicles/${id}`) // 假设删除操作不返回特定的数据对象
  return methodInstance
}
