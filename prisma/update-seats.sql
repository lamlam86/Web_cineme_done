-- Xóa ghế cũ
DELETE FROM `seats`;

-- Cập nhật cấu hình phòng chiếu (5 hàng x 8 cột = 40 ghế mỗi phòng)
UPDATE `screens` SET `seat_rows` = 5, `seat_cols` = 8;

-- Tạo 40 ghế cho mỗi phòng chiếu (tổng 120 ghế cho 3 phòng)
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
CROSS JOIN (
  SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
) r
CROSS JOIN (
  SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
  UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
) c
ORDER BY s.id, r.n, c.n;
