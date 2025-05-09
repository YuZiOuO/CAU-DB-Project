/// <reference path="../global.d.ts"/>

/** 用户数据库表字段 */
namespace Entity {
  interface User {
    /** 用户id */
    user_id: number
    /** 用户名 */
    name: string
    /** 用户地址 */
    address: string
    /** 用户电话 */
    phone_number: string
    /* 用户邮箱 */
    email: string
    /** 用户角色类型 */
    role?: Entity.RoleType[]
    /** 该管理员管理的门店id */
    managed_store_id?: number
  }
}
