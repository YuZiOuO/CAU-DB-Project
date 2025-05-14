declare namespace Entity {
  /** 租借状态 */
  type RentalStatus = 'pending' | 'active' | 'returned' | 'cancelled' | 'extension_requested'

  /** 租借单实体 */
  interface Rental {
    rental_id: number
    rental_date: string // YYYY-MM-DD
    rental_store_id: number
    user_id: number
    vehicle_id: number | null
    vehicle_type_id: number | null // 新增：用户期望的车辆类型ID
    expected_return_date: string // YYYY-MM-DD
    return_store_id: number
    rental_status: RentalStatus
    is_overdue: boolean
    user?: User // 关联的用户信息
    vehicle?: Vehicle // 关联的车辆信息
    vehicle_type?: VehicleType // 新增：关联的请求车辆类型信息
    rental_store?: Store // 关联的租借门店信息
    return_store?: Store // 关联的归还门店信息
  }
}
