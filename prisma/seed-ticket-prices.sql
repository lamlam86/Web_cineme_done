-- Xóa dữ liệu cũ (nếu có)
DELETE FROM `ticket_prices`;

-- Insert giá vé mặc định
INSERT INTO `ticket_prices` (`screen_type`, `seat_type`, `day_type`, `price`, `is_active`, `updated_at`) VALUES
-- Standard screen
('standard', 'standard', 'weekday', 59000, true, NOW()),
('standard', 'standard', 'weekend', 59000, true, NOW()),
('standard', 'vip', 'weekday', 99000, true, NOW()),
('standard', 'vip', 'weekend', 99000, true, NOW()),
('standard', 'couple', 'weekday', 199000, true, NOW()),
('standard', 'couple', 'weekend', 199000, true, NOW()),

-- VIP screen
('vip', 'standard', 'weekday', 59000, true, NOW()),
('vip', 'standard', 'weekend', 59000, true, NOW()),
('vip', 'vip', 'weekday', 99000, true, NOW()),
('vip', 'vip', 'weekend', 99000, true, NOW()),
('vip', 'couple', 'weekday', 199000, true, NOW()),
('vip', 'couple', 'weekend', 199000, true, NOW()),

-- IMAX screen
('imax', 'standard', 'weekday', 59000, true, NOW()),
('imax', 'standard', 'weekend', 59000, true, NOW()),
('imax', 'vip', 'weekday', 99000, true, NOW()),
('imax', 'vip', 'weekend', 99000, true, NOW()),
('imax', 'couple', 'weekday', 199000, true, NOW()),
('imax', 'couple', 'weekend', 199000, true, NOW()),

-- 4DX screen
('4dx', 'standard', 'weekday', 59000, true, NOW()),
('4dx', 'standard', 'weekend', 59000, true, NOW()),
('4dx', 'vip', 'weekday', 99000, true, NOW()),
('4dx', 'vip', 'weekend', 99000, true, NOW()),
('4dx', 'couple', 'weekday', 199000, true, NOW()),
('4dx', 'couple', 'weekend', 199000, true, NOW()),

-- Premium screen
('premium', 'standard', 'weekday', 59000, true, NOW()),
('premium', 'standard', 'weekend', 59000, true, NOW()),
('premium', 'vip', 'weekday', 99000, true, NOW()),
('premium', 'vip', 'weekend', 99000, true, NOW()),
('premium', 'couple', 'weekday', 199000, true, NOW()),
('premium', 'couple', 'weekend', 199000, true, NOW());
