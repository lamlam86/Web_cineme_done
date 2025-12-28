-- Đồng bộ seat type: chỉ còn standard và vip

-- 1. Cập nhật tất cả screens thành standard
UPDATE `screens` SET type = 'standard' WHERE type != 'standard';

-- 2. Cập nhật tất cả seats không phải standard/vip thành standard
UPDATE `seats` SET seat_type = 'standard' WHERE seat_type NOT IN ('standard', 'vip');

-- 3. Xóa ticket_prices không phải standard screen
DELETE FROM `ticket_prices` WHERE screen_type != 'standard';

-- 4. Xóa ticket_prices không phải standard/vip seat
DELETE FROM `ticket_prices` WHERE seat_type NOT IN ('standard', 'vip');

-- 5. Đảm bảo có giá cho standard screen
INSERT IGNORE INTO `ticket_prices` (`screen_type`, `seat_type`, `day_type`, `price`, `is_active`, `created_at`, `updated_at`) VALUES
('standard', 'standard', 'weekday', 65000, true, NOW(), NOW()),
('standard', 'vip', 'weekday', 85000, true, NOW(), NOW());

-- Kiểm tra
SELECT 'Screens' as item, type, COUNT(*) as total FROM screens GROUP BY type;
SELECT 'Seats' as item, seat_type, COUNT(*) as total FROM seats GROUP BY seat_type;
SELECT 'Prices' as item, CONCAT(screen_type, '-', seat_type) as type, price FROM ticket_prices;
