-- =============================================
-- SEED DỮ LIỆU ĐẦY ĐỦ - ĐỒNG BỘ DATABASE
-- Chạy script này sau khi setup Prisma
-- =============================================

-- Tắt kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 1. XÓA DỮ LIỆU CŨ (giữ lại users, roles)
-- =============================================
DELETE FROM `booking_items`;
DELETE FROM `booking_concessions`;
DELETE FROM `payments`;
DELETE FROM `bookings`;
DELETE FROM `showtimes`;
DELETE FROM `seats`;
DELETE FROM `ticket_prices`;

-- Reset auto increment
ALTER TABLE `showtimes` AUTO_INCREMENT = 1;
ALTER TABLE `bookings` AUTO_INCREMENT = 1;

-- =============================================
-- 2. CẬP NHẬT CẤU TRÚC PHÒNG CHIẾU
-- =============================================
-- Mỗi phòng: 10 hàng x 12 cột = 120 ghế
UPDATE `screens` SET seat_rows = 10, seat_cols = 12;

-- =============================================
-- 3. TẠO GHẾ MỚI
-- =============================================
-- Xóa ghế cũ
DELETE FROM `seats`;

-- Tạo ghế cho tất cả phòng chiếu
-- 10 hàng x 12 cột = 120 ghế
-- Hàng A-H: ghế thường
-- Hàng I-J: ghế VIP
INSERT INTO `seats` (`screen_id`, `seat_code`, `seat_row`, `seat_number`, `seat_type`)
SELECT 
  s.id as screen_id,
  CONCAT(CHAR(64 + r.n), LPAD(c.n, 2, '0')) as seat_code,
  CHAR(64 + r.n) as seat_row,
  c.n as seat_number,
  CASE 
    WHEN r.n >= 9 THEN 'vip'
    ELSE 'standard'
  END as seat_type
FROM screens s
CROSS JOIN (SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) r
CROSS JOIN (SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) c
ORDER BY s.id, r.n, c.n;

-- =============================================
-- 4. BẢNG GIÁ VÉ (CHỈ 2 LOẠI: THƯỜNG VÀ VIP)
-- =============================================
DELETE FROM `ticket_prices`;

-- Cập nhật tất cả phòng thành standard
UPDATE `screens` SET type = 'standard';

INSERT INTO `ticket_prices` (`screen_type`, `seat_type`, `day_type`, `price`, `is_active`, `created_at`, `updated_at`) VALUES
('standard', 'standard', 'weekday', 65000, true, NOW(), NOW()),
('standard', 'vip', 'weekday', 85000, true, NOW(), NOW());

-- =============================================
-- 5. TẠO SUẤT CHIẾU MẪU (7 ngày tới)
-- =============================================
-- Tạo suất chiếu cho phim đang chiếu

-- Xóa suất chiếu cũ không có booking
DELETE FROM showtimes WHERE id NOT IN (SELECT DISTINCT showtime_id FROM bookings);

-- Tạo suất chiếu mới cho 7 ngày tới
-- Mỗi phim có 5 suất/ngày: 9:00, 12:00, 15:00, 18:00, 21:00
INSERT INTO `showtimes` (`movie_id`, `screen_id`, `start_time`, `end_time`, `language`, `subtitle`, `status`)
SELECT 
  m.id as movie_id,
  s.id as screen_id,
  DATE_ADD(
    DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY),
    INTERVAL t.time_hour HOUR
  ) as start_time,
  DATE_ADD(
    DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY),
    INTERVAL (t.time_hour + CEIL(COALESCE(m.duration_minutes, 120) / 60) + 1) HOUR
  ) as end_time,
  'Tiếng Anh' as language,
  'Phụ đề Việt' as subtitle,
  'selling' as status
FROM movies m
CROSS JOIN (
  SELECT id FROM screens WHERE id <= 3
) s
CROSS JOIN (
  SELECT 0 as day_offset UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
) d
CROSS JOIN (
  SELECT 9 as time_hour UNION SELECT 12 UNION SELECT 15 UNION SELECT 18 UNION SELECT 21
) t
WHERE m.status = 'now_showing'
AND DATE_ADD(DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY), INTERVAL t.time_hour HOUR) > NOW()
ORDER BY m.id, s.id, d.day_offset, t.time_hour;

-- Bật lại foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 6. KIỂM TRA KẾT QUẢ
-- =============================================
SELECT 'Kết quả seed database:' as Info;
SELECT 'Screens' as `Table`, COUNT(*) as `Count` FROM screens
UNION ALL
SELECT 'Seats', COUNT(*) FROM seats
UNION ALL
SELECT 'Ticket Prices', COUNT(*) FROM ticket_prices
UNION ALL
SELECT 'Showtimes', COUNT(*) FROM showtimes
UNION ALL
SELECT 'Movies (now_showing)', COUNT(*) FROM movies WHERE status = 'now_showing';
