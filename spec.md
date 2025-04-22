# Model

| 表名           | 字段名                            | 类型    | 描述               |
| -------------- | --------------------------------- | ------- | ------------------ |
| **车辆类型表** | 类型编号 (TypeID)                 | INT     | 类型的唯一标识     |
|                | 品牌 (Brand)                      | STRING  | 车辆品牌           |
|                | 型号 (Model)                      | STRING  | 车辆型号           |
|                | 日租价格 (DailyRentPrice)         | FLOAT   | 每日租赁价格       |
| **车辆表**     | 车辆编号 (VehicleID)              | INT     | 车辆的唯一标识     |
|                | 类型编号 (TypeID)                 | INT     | 关联车辆类型表     |
|                | 生产日期 (ManufactureDate)        | DATE    | 车辆生产日期       |
| **用户表**     | 用户编号 (UserID)                 | INT     | 用户的唯一标识     |
|                | 姓名 (Name)                       | STRING  | 用户姓名           |
|                | 地址 (Address)                    | STRING  | 用户地址           |
|                | 联系电话 (PhoneNumber)            | STRING  | 用户联系电话       |
|                | 入会时间 (JoinDate)               | DATE    | 用户加入时间       |
|                | 管理员 (IsAdmin)                  | BOOLEAN | 是否为管理员       |
|                | 管理门店编号 (ManagedStoreID)     | INT     | 管理的门店编号     |
| **门店表**     | 门店编号 (StoreID)                | INT     | 门店的唯一标识     |
|                | 门店名称 (StoreName)              | STRING  | 门店名称           |
|                | 地址 (Address)                    | STRING  | 门店地址 s         |
|                | 联系电话 (PhoneNumber)            | STRING  | 门店联系电话       |
| **出租信息表** | 出租记录编号 (RentalID)           | INT     | 出租记录的唯一标识 |
|                | 租借日期 (RentalDate)             | DATE    | 租借车辆的日期     |
|                | 租借门店编号 (RentalStoreID)      | INT     | 租借车辆的门店编号 |
|                | 用户编号 (UserID)                 | INT     | 关联用户表         |
|                | 车辆编号 (VehicleID)              | INT     | 关联车辆表         |
|                | 预计归还日期 (ExpectedReturnDate) | DATE    | 预计归还日期       |
|                | 归还门店编号 (ReturnStoreID)      | INT     | 归还车辆的门店编号 |
|                | 出租单状态 (RentalStatus)         | STRING  | 出租单状态         |

用户表中，如果为管理员并且门店编号留空，则为全局管理员。

# API

## API Spec

尽量简单点，降低复杂度。比如方法 POST 一把梭，状态码全返回 200，类型全为 json...
可以返回{code:"",msg:""}格式的 json

## 车辆接口

1. 查询车辆类型
2. 管理员查询车辆列表
3. 管理员 crud 车辆，删除车辆时确认所有出租信息已经归还

## 用户接口

1. 登录
2. 注册
3. 全局管理员改变用户权限

## 门店接口

1. 查询门店
2. 全局管理员 crud 门店

## 出租信息表

1. 查询出租单

1. 发起出租单
1. 管理员审核出租单，分配车辆，确定开始计费
1. 管理员确认还车/续租
1. 用户申请续租
1. 管理员审核续租
