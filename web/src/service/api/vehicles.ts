import { request } from '../http'

interface IVehicle {
  type_id: number
  manufacture_date: string // 格式 YYYY-MM-DD
  store_id: number // 新增：车辆所属门店ID
}

export function fetchGetVehicles() {
  const methodInstance
    = request.Get<Service.ResponseResult<Entity.Vehicle[]>>('/vehicles')
  return methodInstance
}

export function fetchCreateVehicle(data: IVehicle) {
  const methodInstance = request.Post<Service.ResponseResult<Entity.Vehicle>>('/vehicles', data)
  return methodInstance
}

export function fetchUpdateVehicle(id: number, data: Partial<IVehicle>) { // Partial<IVehicle> 允许部分更新
  const methodInstance = request.Put<Service.ResponseResult<Entity.Vehicle>>(`/vehicles/${id}`, data)
  return methodInstance
}

export function fetchDeleteVehicle(id: number) {
  const methodInstance = request.Delete<Service.ResponseResult<null>>(`/vehicles/${id}`)
  return methodInstance
}
