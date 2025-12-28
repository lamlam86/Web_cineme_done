-- Remove base_price from showtimes
ALTER TABLE `showtimes` DROP COLUMN `base_price`;

-- Create ticket_prices table
CREATE TABLE `ticket_prices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `screen_type` ENUM('standard', 'vip', 'imax', '4dx', 'premium') NOT NULL,
  `seat_type` ENUM('standard', 'vip', 'couple', 'disabled') NOT NULL,
  `day_type` ENUM('weekday', 'weekend', 'holiday') NOT NULL DEFAULT 'weekday',
  `price` DECIMAL(10,2) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_prices_screen_seat_day` (`screen_type`, `seat_type`, `day_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert default prices
INSERT INTO `ticket_prices` (`screen_type`, `seat_type`, `day_type`, `price`, `updated_at`) VALUES
-- Standard screen
('standard', 'standard', 'weekday', 65000, NOW()),
('standard', 'standard', 'weekend', 75000, NOW()),
('standard', 'vip', 'weekday', 85000, NOW()),
('standard', 'vip', 'weekend', 95000, NOW()),
('standard', 'couple', 'weekday', 150000, NOW()),
('standard', 'couple', 'weekend', 170000, NOW()),

-- VIP screen
('vip', 'standard', 'weekday', 85000, NOW()),
('vip', 'standard', 'weekend', 95000, NOW()),
('vip', 'vip', 'weekday', 105000, NOW()),
('vip', 'vip', 'weekend', 120000, NOW()),
('vip', 'couple', 'weekday', 190000, NOW()),
('vip', 'couple', 'weekend', 220000, NOW()),

-- IMAX screen
('imax', 'standard', 'weekday', 120000, NOW()),
('imax', 'standard', 'weekend', 140000, NOW()),
('imax', 'vip', 'weekday', 150000, NOW()),
('imax', 'vip', 'weekend', 170000, NOW()),

-- 4DX screen
('4dx', 'standard', 'weekday', 150000, NOW()),
('4dx', 'standard', 'weekend', 180000, NOW()),
('4dx', 'vip', 'weekday', 180000, NOW()),
('4dx', 'vip', 'weekend', 210000, NOW()),

-- Premium screen
('premium', 'standard', 'weekday', 100000, NOW()),
('premium', 'standard', 'weekend', 120000, NOW()),
('premium', 'vip', 'weekday', 130000, NOW()),
('premium', 'vip', 'weekend', 150000, NOW()),
('premium', 'couple', 'weekday', 230000, NOW()),
('premium', 'couple', 'weekend', 270000, NOW());
