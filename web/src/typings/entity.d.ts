declare namespace Entity {
  // ...existing entities...

  /** 租借状态 */
  type RentalStatus = 'pending' | 'active' | 'returned' | 'cancelled' | 'extension_requested';

  /** 租借单实体 */
  interface Rental {
    rental_id: number;
    rental_date: string; // YYYY-MM-DD
    rental_store_id: number;
    user_id: number;
    vehicle_id: number | null;
    expected_return_date: string; // YYYY-MM-DD
    return_store_id: number;
    rental_status: RentalStatus;
    is_overdue: boolean;
    user?: User; // 关联的用户信息
    vehicle?: Vehicle; //关联的车辆信息
    rental_store?: Store; // 关联的租借门店信息
    return_store?: Store; // 关联的归还门店信息
  }

  // Ensure User, Vehicle, Store types are defined or compatible
  // Minimal example for context:
  // interface User {
  //   user_id: number;
  //   name: string;
  //   email?: string;
  //   // ... other fields
  // }

  // interface VehicleType {
  //   type_id: number;
  //   brand: string;
  //   model: string;
  //   daily_rent_price: number;
  // }

  // interface Vehicle {
  //   vehicle_id: number;
  //   type_id: number;
  //   manufacture_date: string; // YYYY-MM-DD
  //   type?: VehicleType;
  //   // ... other fields
  // }

  // interface Store {
  //   store_id: number;
  //   store_name: string;
  //   address?: string;
  //   phone_number?: string;
  //   // ... other fields
  // }
}