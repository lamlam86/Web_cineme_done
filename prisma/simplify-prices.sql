-- Đơn giản hóa bảng giá: chỉ còn standard và vip, không phân biệt ngày

-- Xóa tất cả
DELETE FROM `ticket_prices`;

-- Thêm giá mới (chỉ 2 loại ghế, không phân biệt ngày)
INSERT INTO `ticket_prices` (`screen_type`, `seat_type`, `day_type`, `price`, `is_active`, `created_at`, `updated_at`) VALUES
('standard', 'standard', 'weekday', 65000, true, NOW(), NOW()),
('standard', 'vip', 'weekday', 85000, true, NOW(), NOW()),
('vip', 'standard', 'weekday', 85000, true, NOW(), NOW()),
('vip', 'vip', 'weekday', 105000, true, NOW(), NOW()),
('imax', 'standard', 'weekday', 110000, true, NOW(), NOW()),
('imax', 'vip', 'weekday', 140000, true, NOW(), NOW()),
('4dx', 'standard', 'weekday', 140000, true, NOW(), NOW()),
('4dx', 'vip', 'weekday', 170000, true, NOW(), NOW()),
('premium', 'standard', 'weekday', 95000, true, NOW(), NOW()),
('premium', 'vip', 'weekday', 115000, true, NOW(), NOW());

-- Cập nhật ghế: chỉ còn standard và vip
UPDATE `seats` SET seat_type = 'standard' WHERE seat_type NOT IN ('standard', 'vip');

-- Kiểm tra
SELECT screen_type, seat_type, price FROM ticket_prices ORDER BY screen_type, seat_type;
