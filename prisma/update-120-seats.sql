-- Cập nhật tất cả phòng chiếu thành 120 ghế (10x12)
SET FOREIGN_KEY_CHECKS = 0;

-- Cập nhật cấu hình phòng
UPDATE `screens` SET seat_rows = 10, seat_cols = 12;

-- Xóa ghế cũ
DELETE FROM `seats`;

-- Tạo lại ghế cho tất cả phòng (120 ghế/phòng)
INSERT INTO `seats` (`screen_id`, `seat_code`, `seat_row`, `seat_number`, `seat_type`)
SELECT 
  s.id,
  CONCAT(CHAR(64 + r.n), LPAD(c.n, 2, '0')),
  CHAR(64 + r.n),
  c.n,
  CASE WHEN r.n >= 9 THEN 'vip' ELSE 'standard' END
FROM screens s
CROSS JOIN (SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) r
CROSS JOIN (SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) c;

SET FOREIGN_KEY_CHECKS = 1;

-- Kiểm tra
SELECT s.name, COUNT(st.id) as total_seats 
FROM screens s 
LEFT JOIN seats st ON s.id = st.screen_id 
GROUP BY s.id;
