# 数据库组织形式

## 数据库配置

本项目使用 PostgreSQL 数据库，通过 SQLAlchemy ORM 进行数据库操作。

### 数据库连接配置

根据不同的运行环境，系统使用不同的数据库连接：

- **开发环境**：`postgresql+pg8000://postgres:postgres@localhost/car_rental_dev`
- **测试环境**：`postgresql+pg8000://postgres:postgres@localhost/car_rental_test`
- **生产环境**：`postgresql+pg8000://postgres:postgres@localhost/car_rental_prod`

系统使用 Flask-SQLAlchemy 扩展来管理数据库连接，使用 Flask-Migrate 扩展来管理数据库迁移。

## 数据库模型

### 车辆类型 (VehicleType)

**表名**：`vehicle_types`

**描述**：存储不同类型车辆的信息，包括品牌、型号和日租金。

**字段**：
- `type_id`：整型，主键
- `brand`：字符串(100)，不可为空，车辆品牌
- `model`：字符串(100)，不可为空，车辆型号
- `daily_rent_price`：浮点型，不可为空，日租金价格

**关系**：
- 与 `Vehicle` 表是一对多关系（一种车型可以有多个车辆）
- 与 `Rental` 表是一对多关系（一种车型可以有多个租赁记录）

### 车辆 (Vehicle)

**表名**：`vehicles`

**描述**：存储具体车辆的信息，包括所属类型、所在门店和生产日期。

**字段**：
- `vehicle_id`：整型，主键
- `type_id`：整型，外键，关联 `vehicle_types.type_id`，不可为空
- `store_id`：整型，外键，关联 `stores.store_id`，可为空
- `manufacture_date`：日期型，不可为空，生产日期

**关系**：
- 与 `VehicleType` 表是多对一关系（多个车辆可以属于同一种车型）
- 与 `Store` 表是多对一关系（多个车辆可以属于同一个门店）
- 与 `Rental` 表是一对多关系（一个车辆可以有多个租赁记录）

### 用户 (User)

**表名**：`users`

**描述**：存储用户信息，包括普通用户和管理员。

**字段**：
- `user_id`：整型，主键
- `name`：字符串(100)，不可为空，用户姓名
- `address`：字符串(255)，不可为空，用户地址
- `phone_number`：字符串(20)，不可为空，电话号码
- `join_date`：日期型，默认为当前日期，不可为空，加入日期
- `is_admin`：布尔型，默认为 False，不可为空，是否为管理员
- `managed_store_id`：整型，外键，关联 `stores.store_id`，可为空，管理的门店ID
- `email`：字符串(120)，唯一，不可为空，用户邮箱
- `password_hash`：字符串(255)，不可为空，密码哈希

**关系**：
- 与 `Store` 表是多对一关系（多个用户可以管理同一个门店）
- 与 `Rental` 表是一对多关系（一个用户可以有多个租赁记录）

### 门店 (Store)

**表名**：`stores`

**描述**：存储租车门店的信息。

**字段**：
- `store_id`：整型，主键
- `store_name`：字符串(100)，不可为空，门店名称
- `address`：字符串(255)，不可为空，门店地址
- `phone_number`：字符串(20)，不可为空，门店电话

**关系**：
- 与 `User` 表是一对多关系（一个门店可以有多个管理员）
- 与 `Vehicle` 表是一对多关系（一个门店可以有多个车辆）
- 与 `Rental` 表有两个一对多关系（作为租车门店和还车门店）

### 车辆转移 (VehicleTransfer)

**表名**：`vehicle_transfers`

**描述**：记录车辆在不同门店之间的转移。

**字段**：
- `transfer_id`：整型，主键
- `vehicle_id`：整型，外键，关联 `vehicles.vehicle_id`，不可为空
- `source_store_id`：整型，外键，关联 `stores.store_id`，不可为空，源门店
- `destination_store_id`：整型，外键，关联 `stores.store_id`，不可为空，目标门店
- `transfer_date`：日期型，默认为当前日期，不可为空，转移日期
- `transfer_status`：字符串(20)，不可为空，默认为 'pending'，转移状态
- `approved_by`：整型，外键，关联 `users.user_id`，可为空，批准人
- `completed_date`：日期型，可为空，完成日期
- `notes`：字符串(255)，可为空，备注

**关系**：
- 与 `Vehicle` 表是多对一关系（一个车辆可以有多次转移记录）
- 与 `Store` 表有两个多对一关系（作为源门店和目标门店）
- 与 `User` 表是多对一关系（多个转移可以由同一个用户批准）

### 租赁 (Rental)

**表名**：`rentals`

**描述**：记录车辆租赁信息。

**字段**：
- `rental_id`：整型，主键
- `rental_date`：日期型，不可为空，租车日期
- `rental_store_id`：整型，外键，关联 `stores.store_id`，不可为空，租车门店
- `user_id`：整型，外键，关联 `users.user_id`，不可为空，租车用户
- `vehicle_id`：整型，外键，关联 `vehicles.vehicle_id`，可为空，租赁车辆
- `vehicle_type_id`：整型，外键，关联 `vehicle_types.type_id`，可为空，首选车型
- `expected_return_date`：日期型，不可为空，预计还车日期
- `return_store_id`：整型，外键，关联 `stores.store_id`，不可为空，还车门店
- `rental_status`：字符串(20)，不可为空，默认为 'pending'，租赁状态
- `is_overdue`：布尔型，不可为空，默认为 False，是否逾期

**关系**：
- 与 `User` 表是多对一关系（一个用户可以有多个租赁记录）
- 与 `Vehicle` 表是多对一关系（一个车辆可以有多个租赁记录）
- 与 `VehicleType` 表是多对一关系（一种车型可以有多个租赁记录）
- 与 `Store` 表有两个多对一关系（作为租车门店和还车门店）

## 数据库初始化

数据库通过 Flask CLI 命令进行初始化：

- `init-db`：初始化数据库，创建所有表
- `create-admin`：创建管理员用户
- `create-pending-vehicle`：创建特殊的待处理车辆（ID为-1）
- `check-overdue-rentals`：检查并更新逾期租赁状态

## 数据库关系图

```
VehicleType <-- Vehicle
     ^           ^
     |           |
     |           |
Rental <-- User
     |      |
     v      v
    Store <-- VehicleTransfer
```

## 数据库优化

- 使用外键约束确保数据完整性
- 主键索引自动创建
- 使用 SQLAlchemy ORM 进行对象关系映射，简化数据库操作
- 使用 to_dict() 方法将模型对象序列化为字典，方便 API 响应