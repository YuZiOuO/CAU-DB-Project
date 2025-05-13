import { request } from '../http'

interface IStore {
  store_name: string
  address: string
  phone_number: string
}

export function fetchGetStores() {
  const methodInstance
    = request.Get<Service.ResponseResult<Entity.Store[]>>('/stores')
  return methodInstance
}

export function fetchCreateStores(data: IStore) {
  const methodInstance = request.Post<Service.ResponseResult<Entity.Store>>('/stores', data)
  return methodInstance
}

export function fetchUpdateStore(id: number, data: IStore) {
  const methodInstance = request.Put<Service.ResponseResult<Entity.Store>>(`/stores/${id}`, data)
  return methodInstance
}

export function fetchDeleteStore(id: string) {
  const methodInstance = request.Delete<Service.ResponseResult<Entity.Store>>(`/stores/${id}`)
  return methodInstance
}
