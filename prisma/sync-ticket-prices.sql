-- =============================================
-- ĐỒNG BỘ GIÁ VÉ TOÀN HỆ THỐNG
-- Chỉ 2 loại ghế: Thường (65.000đ) và VIP (85.000đ)
-- Giá áp dụng cho tất cả các ngày
-- =============================================

-- Xóa tất cả giá vé cũ
DELETE FROM `ticket_prices`;

-- Thêm giá vé mới (chỉ 2 loại)
INSERT INTO `ticket_prices` (`screen_type`, `seat_type`, `day_type`, `price`, `is_active`) VALUES
('standard', 'standard', 'weekday', 65000, true),
('standard', 'vip', 'weekday', 85000, true);

-- Xác nhận
SELECT 'Đồng bộ giá vé thành công!' as Status;
SELECT * FROM ticket_prices;
