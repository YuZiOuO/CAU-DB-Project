-- 清除现有数据（可选，小心使用）
DELETE FROM rentals;
DELETE FROM vehicle_transfers;
DELETE FROM vehicles;
DELETE FROM vehicle_types;
DELETE FROM stores;

-- 商店表模拟数据
INSERT INTO stores (store_id, store_name, address, phone_number) VALUES
(1, '市中心租车点', '美国任意城主街123号', '555-0101'),
(2, '机场租车服务', '美国任意城机场路789号', '555-0102'),
(3, '近郊车轮', '美国郊区橡树大道456号', '555-0103');

-- 车辆类型表模拟数据
INSERT INTO vehicle_types (type_id, brand, model, daily_rent_price) VALUES
(1, '丰田', '凯美瑞', 55.00), -- Toyota Camry
(2, '本田', '思域', 50.00), -- Honda Civic
(3, '福特', '探险者', 75.00), -- Ford Explorer
(4, '雪佛兰', '太浩', 80.00), -- Chevrolet Tahoe
(5, '日产', '轩逸', 45.00); -- Nissan Sentra

-- 车辆表模拟数据
INSERT INTO vehicles (vehicle_id, type_id, store_id, manufacture_date) VALUES
(1, 1, 1, '2022-05-10'), -- 丰田凯美瑞 在 市中心租车点
(2, 1, 1, '2023-01-15'), -- 丰田凯美瑞 在 市中心租车点
(3, 2, 1, '2022-08-20'), -- 本田思域 在 市中心租车点
(4, 3, 2, '2023-03-01'), -- 福特探险者 在 机场租车服务
(5, 3, 2, '2022-11-25'), -- 福特探险者 在 机场租车服务
(6, 4, 2, '2023-02-10'), -- 雪佛兰太浩 在 机场租车服务
(7, 5, 3, '2022-07-19'), -- 日产轩逸 在 近郊车轮
(8, 2, 3, '2023-04-01'); -- 本田思域 在 近郊车轮

-- 租赁表模拟数据
-- 假设 user_id = 1 是由 create-admin 创建的管理员用户
INSERT INTO rentals (rental_id, rental_date, rental_store_id, user_id, vehicle_id, vehicle_type_id, expected_return_date, return_store_id, rental_status, is_overdue) VALUES
(1, '2024-05-01', 1, 1, 1, 1, '2024-05-08', 1, 'active', FALSE), -- 管理员 从市中心租车点租用凯美瑞
(2, '2024-05-03', 2, 1, 4, 3, '2024-05-10', 2, 'active', FALSE), -- 管理员 从机场租车服务租用探险者
(3, '2024-04-20', 1, 1, 3, 2, '2024-04-27', 1, 'returned', FALSE), -- 管理员 已归还思域
(4, '2024-05-05', 3, 1, 7, 5, '2024-05-12', 3, 'pending', FALSE), -- 管理员 预订了近郊车轮的轩逸
(5, '2024-03-15', 2, 1, 6, 4, '2024-03-20', 2, 'returned', TRUE); -- 管理员 已归还太浩，曾逾期

-- 车辆调动表模拟数据
-- 假设 approved_by = 1 是由 create-admin 创建的管理员用户
INSERT INTO vehicle_transfers (transfer_id, vehicle_id, source_store_id, destination_store_id, transfer_date, transfer_status, approved_by, completed_date, notes) VALUES
(1, 3, 1, 2, '2024-04-10', 'completed', 1, '2024-04-12', '将思域调至机场以满足更高需求。'), -- 由管理员批准
(2, 5, 2, 3, '2024-05-01', 'approved', 1, NULL, '将探险者移至近郊门店。'), -- 由管理员批准
(3, 8, 3, 1, '2024-05-06', 'pending', NULL, NULL, '为市中心门店申请调动思域。');
