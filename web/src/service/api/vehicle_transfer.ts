import { request } from '../http'

interface ICreateVehicleTransfer {
  vehicle_id: number
  source_store_id: number
  destination_store_id: number
  notes?: string
}

export function fetchCreateVehicleTransfer(data: ICreateVehicleTransfer) {
  return request.Post<Service.ResponseResult<Entity.VehicleTransfer>>('/transfers', data)
}

export function fetchGetVehicleTransfers() {
  return request.Get<Service.ResponseResult<Entity.VehicleTransfer[]>>('/transfers')
}

export function fetchGetVehicleTransferById(transferId: number) {
  return request.Get<Service.ResponseResult<Entity.VehicleTransfer>>(`/transfers/${transferId}`)
}

export function fetchApproveVehicleTransfer(transferId: number) {
  return request.Put<Service.ResponseResult<Entity.VehicleTransfer>>(`/transfers/${transferId}/approve`)
}

export function fetchCompleteVehicleTransfer(transferId: number) {
  return request.Put<Service.ResponseResult<Entity.VehicleTransfer>>(`/transfers/${transferId}/complete`)
}

export function fetchCancelVehicleTransfer(transferId: number) {
  return request.Put<Service.ResponseResult<Entity.VehicleTransfer>>(`/transfers/${transferId}/cancel`)
}
