 table_schema |    table_name     |     column_name      |     data_type     | is_nullable 
--------------|-------------------|----------------------|-------------------|-------------
 public       | rentals           | rental_id            | integer           | NO
 public       | rentals           | rental_date          | date              | NO
 public       | rentals           | rental_store_id      | integer           | NO
 public       | rentals           | user_id              | integer           | NO
 public       | rentals           | vehicle_id           | integer           | YES
 public       | rentals           | vehicle_type_id      | integer           | YES
 public       | rentals           | expected_return_date | date              | NO
 public       | rentals           | return_store_id      | integer           | NO
 public       | rentals           | rental_status        | character varying | NO
 public       | rentals           | is_overdue           | boolean           | NO
 public       | stores            | store_id             | integer           | NO
 public       | stores            | store_name           | character varying | NO
 public       | stores            | address              | character varying | NO
 public       | stores            | phone_number         | character varying | NO
 public       | users             | user_id              | integer           | NO
 public       | users             | name                 | character varying | NO
 public       | users             | address              | character varying | NO
 public       | users             | phone_number         | character varying | NO
 public       | users             | join_date            | date              | NO
 public       | users             | is_admin             | boolean           | NO
 public       | users             | managed_store_id     | integer           | YES
 public       | users             | email                | character varying | NO
 public       | users             | password_hash        | character varying | NO
 public       | vehicle_transfers | transfer_id          | integer           | NO
 public       | vehicle_transfers | vehicle_id           | integer           | NO
 public       | vehicle_transfers | source_store_id      | integer           | NO
 public       | vehicle_transfers | destination_store_id | integer           | NO
 public       | vehicle_transfers | transfer_date        | date              | NO
 public       | vehicle_transfers | transfer_status      | character varying | NO
 public       | vehicle_transfers | approved_by          | integer           | YES
 public       | vehicle_transfers | completed_date       | date              | YES
 public       | vehicle_transfers | notes                | character varying | YES
 public       | vehicle_types     | type_id              | integer           | NO
 public       | vehicle_types     | brand                | character varying | NO
 public       | vehicle_types     | model                | character varying | NO
 public       | vehicle_types     | daily_rent_price     | double precision  | NO
 public       | vehicles          | vehicle_id           | integer           | NO
 public       | vehicles          | type_id              | integer           | NO
 public       | vehicles          | store_id             | integer           | YES
 public       | vehicles          | manufacture_date     | date              | NO
(40 rows)

## `car_rental_dev=# select * from users;`
 user_id |     name      |    address    | phone_number  | join_date  | is_admin | managed_store_id |           email           |                                             password_hash                                              
---------|---------------|---------------|---------------|------------|----------|------------------|---------------------------|--------------------------------------------------------------------------------------------------------
1 | Admin         | Admin Address | 1234567890    | 2025-06-11 | t        |                  | admin@example.com         | pbkdf2:sha256:600000$De1bvLSw8BVbWtnp$754f7f2824e1ecba1956a8d336e73dec0b1b9a91ed91fac92599899ab695b6c6
2 | store_airport | store_airport | store_airport | 2025-06-11 | t        |                2 | store_airport@example.com | pbkdf2:sha256:600000$UKMnGN7lM68weIHz$c4c928363edd48ae35f4af665d2712cef73eabe0529c08c813e3794ceebc9893
3 | store_center  | center        | 10086         | 2025-06-11 | t        |                1 | store_center@example.com              | pbkdf2:sha256:600000$02COey0IATbY7fjP$47f48d3f52a20d72b8085275d223fd836b77f16066f1a8e50a76f8830c41aebb
4 | user          | user          | 350825        | 2025-06-11 | f        |                  | user                      | pbkdf2:sha256:600000$XjMHePueUUGij8r7$27082c21dccfd4f37cad6f8a6c76b34722113f08367fff466b4d63f78c3337fa
(4 rows)

## `car_rental_dev=# select * from stores;`
 store_id |  store_name  |        address        | phone_number 
----------|--------------|-----------------------|--------------
1 | 市中心租车点 | 美国任意城主街123号   | 555-0101
2 | 机场租车服务 | 美国任意城机场路789号 | 555-0102
3 | 近郊车轮     | 美国郊区橡树大道456号 | 555-0103
(3 rows)

## `car_rental_dev=# select * from rentals;`

 rental_id | rental_date | rental_store_id | user_id | vehicle_id | vehicle_type_id | expected_return_date | return_store_id | rental_stat
us | is_overdue 
-----------|-------------|-----------------|---------|------------|-----------------|----------------------|-----------------|---------------|------------
3 | 2024-04-20  |               1 |       1 |          3 |               2 | 2024-04-27           |               1 | returned      | f
4 | 2024-05-05  |               3 |       1 |          7 |               5 | 2024-05-12           |               3 | pending       | f
5 | 2024-03-15  |               2 |       1 |          6 |               4 | 2024-03-20           |               2 | returned      | t
1 | 2024-05-01  |               1 |       1 |          1 |               1 | 2024-05-08           |               1 | active        | t
2 | 2024-05-03  |               2 |       1 |          4 |               3 | 2024-05-10           |               2 | active        | t
6 | 2025-06-11  |               1 |       1 |            |               2 | 2025-06-21           |               2 | cancelled     | f
7 | 2025-06-11  |               1 |       4 |          3 |               2 | 2025-06-25           |               2 | returned      | f
(7 rows)

## `car_rental_dev=# select * from vehicle_transfers;`
 transfer_id | vehicle_id | source_store_id | destination_store_id | transfer_date | transfer_status | approved_by | completed_date |             notes              
-------------|------------|-----------------|----------------------|---------------|-----------------|-------------|----------------|--------------------------------
1 |          3 |               1 |                    2 | 2024-04-10    | completed       |           1 | 2024-04-12     | 将思域调至机场以满足更高需求。
2 |          5 |               2 |                    3 | 2024-05-01    | approved        |           1 |                | 将探险者移至近郊门店。
3 |          8 |               3 |                    1 | 2024-05-06    | pending         |             |                | 为市中心门店申请调动思域。
4 |          2 |               1 |                    2 | 2025-06-11    | completed       |           1 | 2025-06-11     | 临时转移
(4 rows)


## `car_rental_dev=# select * from vehicle_types;`
 type_id | brand  | model  | daily_rent_price 
---------|--------|--------|------------------
1 | 丰田   | 凯美瑞 |               55
2 | 本田   | 思域   |               50
3 | 福特   | 探险者 |               75
4 | 雪佛兰 | 太浩   |               80
5 | 日产   | 轩逸   |               45
(5 rows)

## `car_rental_dev=# select * from vehicles;`
 vehicle_id | type_id | store_id | manufacture_date 
------------|---------|----------|------------------
1 |       1 |        1 | 2022-05-10
4 |       3 |        2 | 2023-03-01
5 |       3 |        2 | 2022-11-25
6 |       4 |        2 | 2023-02-10
7 |       5 |        3 | 2022-07-19
8 |       2 |        3 | 2023-04-01
3 |       2 |        2 | 2022-08-20
2 |       1 |        2 | 2023-01-15
(8 rows)