declare namespace Entity {
  /**
   * 车辆实例实体
   */
  interface Vehicle {
    vehicle_id: number
    type_id: number // 外键，关联到 VehicleType
    manufacture_date: string // 生产日期，格式 YYYY-MM-DD

    type?: VehicleType // 嵌套的车辆类型详细信息，用于显示品牌、型号、日租金等
  }
}
