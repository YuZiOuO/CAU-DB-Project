import { request } from '../http'

interface IStore {
  store_name: string
  address: string
  phone_number: string
}

// IStoreUpdate can be the same as IStore if all fields are updatable
// or a Partial<IStore> if only some fields are sent.
// Based on the backend, it seems to update fields present in the data.
type IStoreUpdate = IStore;

export function fetchGetStores() {
  const methodInstance
    = request.Get<Service.ResponseResult<Api.Store.Store[]>>('/stores')
  return methodInstance
}

export function fetchCreateStores(data: IStore) {
  const methodInstance = request.Post<Service.ResponseResult<Api.Store.Store>>('/stores', data)
  return methodInstance
}

export function fetchUpdateStore(id: number, data: IStoreUpdate) {
  const methodInstance = request.Put<Service.ResponseResult<Api.Store.Store>>(`/stores/${id}`, data)
  return methodInstance
}

export function fetchDeleteStore(id: string) {
  const methodInstance = request.Delete<Service.ResponseResult<Api.Store.Store>>(`/stores/${id}`)
  return methodInstance
}
