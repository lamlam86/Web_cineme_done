-- Cập nhật chỉ còn 2 loại ghế: standard và vip
-- Chuyển couple, disabled thành standard

UPDATE `seats` SET seat_type = 'standard' WHERE seat_type NOT IN ('standard', 'vip');

-- Xóa giá vé của couple, disabled
DELETE FROM `ticket_prices` WHERE seat_type NOT IN ('standard', 'vip');

-- Kiểm tra
SELECT seat_type, COUNT(*) as total FROM seats GROUP BY seat_type;
SELECT seat_type, COUNT(*) as total FROM ticket_prices GROUP BY seat_type;
