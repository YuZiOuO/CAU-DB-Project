declare namespace Entity {
  /**
   * 车辆实例实体
   */
  interface Vehicle {
    vehicle_id: number
    type_id: number // 外键，关联到 VehicleType
    manufacture_date: string // 生产日期，格式 YYYY-MM-DD
    store_id: number // 外键，关联到 Store
    status?: string // 可选，车辆状态，例如 'available', 'rented', 'maintenance'

    type?: VehicleType // 嵌套的车辆类型详细信息，用于显示品牌、型号、日租金等
    store?: Store // 嵌套的门店详细信息
  }

  /**
   * 车辆流转状态
   */
  type VehicleTransferStatus = 'pending' | 'approved' | 'completed' | 'cancelled'

  /**
   * 车辆流转实体
   */
  interface VehicleTransfer {
    transfer_id: number
    vehicle_id: number
    source_store_id: number
    destination_store_id: number
    transfer_date: string // 发起流转日期 YYYY-MM-DD
    transfer_status: VehicleTransferStatus
    approved_by?: number | null // 批准人用户ID
    completed_date?: string | null // 完成日期 YYYY-MM-DD
    notes?: string | null

    // Optional nested data for display
    vehicle?: Vehicle
    source_store?: Store
    destination_store?: Store
    approver?: User
  }
}
