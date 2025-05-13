import { request } from '../http'

// 定义创建/更新车辆类型时使用的数据结构
interface IVehicleType {
  brand: string
  model: string
  daily_rent_price: number
}

export function fetchGetVehicleTypes() {
  const methodInstance
    = request.Get<Service.ResponseResult<Entity.VehicleType[]>>('/vehicles/types')
  return methodInstance
}

export function fetchCreateVehicleType(data: IVehicleType) {
  const methodInstance = request.Post<Service.ResponseResult<Entity.VehicleType>>('/vehicles/types', data)
  return methodInstance
}

export function fetchUpdateVehicleType(type_id: number, data: IVehicleType) {
  const methodInstance = request.Put<Service.ResponseResult<Entity.VehicleType>>(`/vehicles/types/${type_id}`, data)
  return methodInstance
}

export function fetchDeleteVehicleType(type_id: number) {
  const methodInstance = request.Delete<Service.ResponseResult<null>>(`/vehicles/types/${type_id}`)
  return methodInstance
}
