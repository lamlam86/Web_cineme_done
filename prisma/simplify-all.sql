-- Đơn giản hóa toàn bộ: 1 loại phòng, 2 loại ghế

-- Cập nhật tất cả phòng thành standard
UPDATE `screens` SET type = 'standard';

-- Cập nhật tất cả ghế: chỉ còn standard và vip
UPDATE `seats` SET seat_type = 'standard' WHERE seat_type NOT IN ('standard', 'vip');

-- Xóa tất cả giá vé cũ
DELETE FROM `ticket_prices`;

-- Thêm giá mới: chỉ 2 loại ghế
INSERT INTO `ticket_prices` (`screen_type`, `seat_type`, `day_type`, `price`, `is_active`, `created_at`, `updated_at`) VALUES
('standard', 'standard', 'weekday', 65000, true, NOW(), NOW()),
('standard', 'vip', 'weekday', 85000, true, NOW(), NOW());

-- Kiểm tra
SELECT 'Screens' as item, type, COUNT(*) as total FROM screens GROUP BY type
UNION ALL
SELECT 'Seats', seat_type, COUNT(*) FROM seats GROUP BY seat_type
UNION ALL
SELECT 'Prices', CONCAT(screen_type, '-', seat_type), price FROM ticket_prices;
