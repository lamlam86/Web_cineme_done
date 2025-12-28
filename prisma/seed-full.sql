-- =============================================
-- RESET VÀ SEED DỮ LIỆU ĐẦY ĐỦ
-- =============================================

-- Tắt kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa dữ liệu cũ
TRUNCATE TABLE `booking_items`;
TRUNCATE TABLE `booking_concessions`;
TRUNCATE TABLE `payments`;
TRUNCATE TABLE `bookings`;
TRUNCATE TABLE `showtimes`;
TRUNCATE TABLE `seats`;
TRUNCATE TABLE `screens`;
TRUNCATE TABLE `ticket_prices`;

-- Bật lại foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 1. CẬP NHẬT PHÒNG CHIẾU (SCREENS)
-- =============================================
-- Mỗi rạp có 3 phòng: Standard, VIP, IMAX
-- Mỗi phòng có 5 hàng x 8 cột = 40 ghế

-- Xóa screens cũ và tạo mới
DELETE FROM `screens`;

-- LMK Cinema Man Thiện (branch_id = 1)
INSERT INTO `screens` (`id`, `branch_id`, `name`, `seat_rows`, `seat_cols`, `type`, `status`) VALUES
(1, 1, 'Rạp 01', 5, 8, 'standard', 'active'),
(2, 1, 'Rạp 02', 5, 8, 'vip', 'active'),
(3, 1, 'Rạp 03', 5, 8, 'imax', 'active');

-- LMK Cinema Vincom Thủ Đức (branch_id = 2)
INSERT INTO `screens` (`id`, `branch_id`, `name`, `seat_rows`, `seat_cols`, `type`, `status`) VALUES
(4, 2, 'Rạp 01', 5, 8, 'standard', 'active'),
(5, 2, 'Rạp 02', 5, 8, 'vip', 'active'),
(6, 2, 'Rạp 03', 5, 8, 'imax', 'active');

-- LMK Cinema AEON Bình Dương (branch_id = 3)
INSERT INTO `screens` (`id`, `branch_id`, `name`, `seat_rows`, `seat_cols`, `type`, `status`) VALUES
(7, 3, 'Rạp 01', 5, 8, 'standard', 'active'),
(8, 3, 'Rạp 02', 5, 8, 'vip', 'active'),
(9, 3, 'Rạp 03', 5, 8, 'imax', 'active');

-- =============================================
-- 2. TẠO GHẾ CHO TẤT CẢ PHÒNG CHIẾU
-- =============================================
-- Mỗi phòng: 40 ghế (5 hàng A-E, 8 cột 1-8)
-- Hàng D, E là ghế VIP

INSERT INTO `seats` (`screen_id`, `seat_code`, `seat_row`, `seat_number`, `seat_type`)
SELECT 
  s.id as screen_id,
  CONCAT(CHAR(64 + r.n), LPAD(c.n, 2, '0')) as seat_code,
  CHAR(64 + r.n) as seat_row,
  c.n as seat_number,
  CASE 
    WHEN r.n >= 4 THEN 'vip'
    ELSE 'standard'
  END as seat_type
FROM screens s
CROSS JOIN (SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) r
CROSS JOIN (SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8) c
ORDER BY s.id, r.n, c.n;

-- =============================================
-- 3. BẢNG GIÁ VÉ
-- =============================================
INSERT INTO `ticket_prices` (`screen_type`, `seat_type`, `day_type`, `price`, `is_active`, `updated_at`) VALUES
-- Standard screen
('standard', 'standard', 'weekday', 59000, true, NOW()),
('standard', 'standard', 'weekend', 69000, true, NOW()),
('standard', 'vip', 'weekday', 79000, true, NOW()),
('standard', 'vip', 'weekend', 89000, true, NOW()),
('standard', 'couple', 'weekday', 139000, true, NOW()),
('standard', 'couple', 'weekend', 159000, true, NOW()),

-- VIP screen
('vip', 'standard', 'weekday', 79000, true, NOW()),
('vip', 'standard', 'weekend', 89000, true, NOW()),
('vip', 'vip', 'weekday', 99000, true, NOW()),
('vip', 'vip', 'weekend', 109000, true, NOW()),
('vip', 'couple', 'weekday', 179000, true, NOW()),
('vip', 'couple', 'weekend', 199000, true, NOW()),

-- IMAX screen
('imax', 'standard', 'weekday', 99000, true, NOW()),
('imax', 'standard', 'weekend', 119000, true, NOW()),
('imax', 'vip', 'weekday', 129000, true, NOW()),
('imax', 'vip', 'weekend', 149000, true, NOW()),
('imax', 'couple', 'weekday', 239000, true, NOW()),
('imax', 'couple', 'weekend', 279000, true, NOW()),

-- 4DX screen
('4dx', 'standard', 'weekday', 129000, true, NOW()),
('4dx', 'standard', 'weekend', 149000, true, NOW()),
('4dx', 'vip', 'weekday', 159000, true, NOW()),
('4dx', 'vip', 'weekend', 179000, true, NOW()),
('4dx', 'couple', 'weekday', 299000, true, NOW()),
('4dx', 'couple', 'weekend', 339000, true, NOW()),

-- Premium screen
('premium', 'standard', 'weekday', 89000, true, NOW()),
('premium', 'standard', 'weekend', 99000, true, NOW()),
('premium', 'vip', 'weekday', 109000, true, NOW()),
('premium', 'vip', 'weekend', 119000, true, NOW()),
('premium', 'couple', 'weekday', 199000, true, NOW()),
('premium', 'couple', 'weekend', 219000, true, NOW());

-- =============================================
-- 4. TẠO SUẤT CHIẾU MẪU
-- =============================================
-- Tạo suất chiếu cho các phim đang chiếu trong 7 ngày tới

-- Lấy danh sách phim đang chiếu và tạo suất chiếu
INSERT INTO `showtimes` (`movie_id`, `screen_id`, `start_time`, `end_time`, `language`, `subtitle`, `status`)
SELECT 
  m.id as movie_id,
  s.id as screen_id,
  DATE_ADD(
    DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY),
    INTERVAL (8 + t.time_slot * 3) HOUR
  ) as start_time,
  DATE_ADD(
    DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY),
    INTERVAL (8 + t.time_slot * 3 + CEIL(COALESCE(m.duration_minutes, 120) / 60)) HOUR
  ) as end_time,
  'Tiếng Anh' as language,
  'Phụ đề Việt' as subtitle,
  'selling' as status
FROM movies m
CROSS JOIN screens s
CROSS JOIN (SELECT 0 as day_offset UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) d
CROSS JOIN (SELECT 0 as time_slot UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) t
WHERE m.status = 'now_showing'
AND s.id <= 3  -- Chỉ tạo cho rạp đầu tiên để tránh quá nhiều dữ liệu
ORDER BY m.id, s.id, d.day_offset, t.time_slot;

-- =============================================
-- KIỂM TRA KẾT QUẢ
-- =============================================
SELECT 'Screens' as `Table`, COUNT(*) as `Count` FROM screens
UNION ALL
SELECT 'Seats', COUNT(*) FROM seats
UNION ALL
SELECT 'Ticket Prices', COUNT(*) FROM ticket_prices
UNION ALL
SELECT 'Showtimes', COUNT(*) FROM showtimes;
