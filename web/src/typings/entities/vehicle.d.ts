declare namespace Entity {
  /**
   * 车辆实体类型
   */
  interface Vehicle {
    vehicle_id: number
    make: string // 品牌
    model: string // 型号
    year: number // 年份
    license_plate: string // 车牌号
    status: string // 状态 (例如: 'available', 'rented', 'maintenance')
    daily_rate: number // 日租金
    store_id: number // 所属店铺ID
  }
}
