declare namespace Entity {
  /**
   * 车辆类型实体
   */
  interface VehicleType {
    type_id: number
    brand: string // 品牌
    model: string // 型号
    daily_rent_price: number // 日租金
  }
}
