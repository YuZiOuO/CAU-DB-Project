import { request } from '../http'

// 定义创建/更新车辆实例时后端API实际接受的数据结构
interface IVehicleData {
  type_id: number
  manufacture_date: string // 格式 YYYY-MM-DD
}

export function fetchGetVehicles() {
  const methodInstance
    = request.Get<Service.ResponseResult<Entity.Vehicle[]>>('/vehicles') // 使用 Entity.Vehicle
  return methodInstance
}

export function fetchCreateVehicle(data: IVehicleData) {
  // data 对象现在应该只包含 type_id 和 manufacture_date
  const methodInstance = request.Post<Service.ResponseResult<Entity.Vehicle>>('/vehicles', data)
  return methodInstance
}

export function fetchUpdateVehicle(id: number, data: IVehicleData) {
  // data 对象现在应该只包含 type_id 和 manufacture_date
  const methodInstance = request.Put<Service.ResponseResult<Entity.Vehicle>>(`/vehicles/${id}`, data)
  return methodInstance
}

export function fetchDeleteVehicle(id: number) {
  const methodInstance = request.Delete<Service.ResponseResult<null>>(`/vehicles/${id}`) // 假设删除操作不返回特定的数据对象
  return methodInstance
}
