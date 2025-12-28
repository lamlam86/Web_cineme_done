-- =============================================
-- RESET DATABASE HOÀN TOÀN - LMK CINEMA
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

-- Xóa tất cả bảng
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `movie_promotions`;
DROP TABLE IF EXISTS `booking_concessions`;
DROP TABLE IF EXISTS `booking_items`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `showtimes`;
DROP TABLE IF EXISTS `seats`;
DROP TABLE IF EXISTS `screens`;
DROP TABLE IF EXISTS `branches`;
DROP TABLE IF EXISTS `concessions`;
DROP TABLE IF EXISTS `promotions`;
DROP TABLE IF EXISTS `movies`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `ticket_prices`;
DROP TABLE IF EXISTS `banners`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- TẠO CÁC BẢNG
-- =============================================

CREATE TABLE `roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `roles_name_key`(`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NULL,
  `date_of_birth` DATETIME(3) NULL,
  `avatar_url` VARCHAR(191) NULL,
  `points` INT NOT NULL DEFAULT 0,
  `status` ENUM('active', 'blocked', 'pending') NOT NULL DEFAULT 'active',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_email_key`(`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
  `user_id` BIGINT NOT NULL,
  `role_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`),
  CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `movies` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NULL,
  `synopsis` TEXT NULL,
  `genres` VARCHAR(191) NULL,
  `duration_minutes` INT NULL,
  `rating` VARCHAR(191) NULL,
  `language` VARCHAR(191) NULL,
  `country` VARCHAR(191) NULL,
  `director` VARCHAR(191) NULL,
  `cast` TEXT NULL,
  `poster_url` VARCHAR(191) NULL,
  `backdrop_url` VARCHAR(191) NULL,
  `trailer_url` VARCHAR(191) NULL,
  `status` ENUM('now_showing', 'coming_soon', 'draft', 'archived') NOT NULL DEFAULT 'draft',
  `release_date` DATETIME(3) NULL,
  `is_featured` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `movies_slug_key`(`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `branches` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `address` VARCHAR(191) NULL,
  `city` VARCHAR(191) NULL,
  `hotline` VARCHAR(191) NULL,
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `status` ENUM('active', 'maintenance', 'inactive') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `screens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `branch_id` INT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `seat_rows` INT NOT NULL DEFAULT 10,
  `seat_cols` INT NOT NULL DEFAULT 12,
  `type` ENUM('standard') NOT NULL DEFAULT 'standard',
  `status` ENUM('active', 'maintenance', 'inactive') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  CONSTRAINT `screens_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `seats` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `screen_id` INT NOT NULL,
  `seat_code` VARCHAR(191) NOT NULL,
  `seat_row` VARCHAR(191) NOT NULL,
  `seat_number` INT NOT NULL,
  `seat_type` ENUM('standard', 'vip') NOT NULL DEFAULT 'standard',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `seats_screen_id_seat_code_key`(`screen_id`, `seat_code`),
  CONSTRAINT `seats_screen_id_fkey` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ticket_prices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `screen_type` ENUM('standard') NOT NULL DEFAULT 'standard',
  `seat_type` ENUM('standard', 'vip') NOT NULL,
  `day_type` ENUM('weekday') NOT NULL DEFAULT 'weekday',
  `price` DECIMAL(10,0) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ticket_prices_screen_type_seat_type_day_type_key`(`screen_type`, `seat_type`, `day_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `showtimes` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `movie_id` BIGINT NOT NULL,
  `screen_id` INT NOT NULL,
  `start_time` DATETIME(3) NOT NULL,
  `end_time` DATETIME(3) NOT NULL,
  `language` VARCHAR(191) NULL,
  `subtitle` VARCHAR(191) NULL,
  `status` ENUM('scheduled', 'selling', 'closed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  PRIMARY KEY (`id`),
  CONSTRAINT `showtimes_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE,
  CONSTRAINT `showtimes_screen_id_fkey` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `bookings` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NULL,
  `showtime_id` BIGINT NOT NULL,
  `booking_code` VARCHAR(191) NOT NULL,
  `subtotal` DECIMAL(10,0) NOT NULL,
  `discount` DECIMAL(10,0) NULL DEFAULT 0,
  `total_amount` DECIMAL(10,0) NOT NULL,
  `payment_method` ENUM('cash', 'momo', 'vnpay', 'credit', 'wallet', 'bank_transfer') NOT NULL DEFAULT 'momo',
  `payment_status` ENUM('pending', 'paid', 'refunded', 'failed') NOT NULL DEFAULT 'pending',
  `status` ENUM('reserved', 'confirmed', 'cancelled') NOT NULL DEFAULT 'reserved',
  `transaction_id` VARCHAR(191) NULL,
  `qr_code` TEXT NULL,
  `qr_expires_at` DATETIME(3) NULL,
  `ticket_qr_code` TEXT NULL,
  `email_sent` BOOLEAN NOT NULL DEFAULT false,
  `email_sent_at` DATETIME(3) NULL,
  `paid_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `bookings_booking_code_key`(`booking_code`),
  UNIQUE INDEX `bookings_transaction_id_key`(`transaction_id`),
  CONSTRAINT `bookings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `bookings_showtime_id_fkey` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `booking_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT NOT NULL,
  `seat_id` INT NOT NULL,
  `seat_price` DECIMAL(10,0) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `booking_items_booking_id_seat_id_key`(`booking_id`, `seat_id`),
  CONSTRAINT `booking_items_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_items_seat_id_fkey` FOREIGN KEY (`seat_id`) REFERENCES `seats`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `concessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `price` DECIMAL(10,0) NOT NULL,
  `type` ENUM('combo', 'popcorn', 'drink', 'snack') NOT NULL DEFAULT 'combo',
  `image_url` VARCHAR(191) NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `booking_concessions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT NOT NULL,
  `concession_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10,0) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `booking_concessions_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_concessions_concession_id_fkey` FOREIGN KEY (`concession_id`) REFERENCES `concessions`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `promotions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NULL,
  `description` VARCHAR(191) NULL,
  `discount_type` ENUM('percent', 'fixed') NOT NULL,
  `discount_value` DECIMAL(10,0) NOT NULL,
  `max_usage` INT NULL,
  `usage_count` INT NOT NULL DEFAULT 0,
  `min_order_value` DECIMAL(10,0) NULL,
  `start_date` DATETIME(3) NULL,
  `end_date` DATETIME(3) NULL,
  `status` ENUM('draft', 'active', 'expired', 'disabled') NOT NULL DEFAULT 'draft',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `promotions_code_key`(`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `movie_promotions` (
  `movie_id` BIGINT NOT NULL,
  `promotion_id` INT NOT NULL,
  PRIMARY KEY (`movie_id`, `promotion_id`),
  CONSTRAINT `movie_promotions_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE,
  CONSTRAINT `movie_promotions_promotion_id_fkey` FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `payments` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT NOT NULL,
  `transaction_id` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(10,0) NOT NULL,
  `bank_account` VARCHAR(191) NULL,
  `bank_name` VARCHAR(191) NULL,
  `qr_code` TEXT NULL,
  `qr_data` TEXT NULL,
  `payment_method` ENUM('cash', 'momo', 'vnpay', 'credit', 'wallet', 'bank_transfer') NOT NULL DEFAULT 'vnpay',
  `status` ENUM('pending', 'paid', 'refunded', 'failed') NOT NULL DEFAULT 'pending',
  `bank_response` JSON NULL,
  `expires_at` DATETIME(3) NULL,
  `paid_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `payments_transaction_id_key`(`transaction_id`),
  INDEX `payments_booking_id_idx`(`booking_id`),
  CONSTRAINT `payments_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NULL,
  `action` VARCHAR(191) NOT NULL,
  `payload` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `banners` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `link_url` VARCHAR(500) NULL,
  `description` VARCHAR(500) NULL,
  `position` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =============================================
-- SEED DATA
-- =============================================

-- Roles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'admin', 'Quản trị viên'),
(2, 'staff', 'Nhân viên'),
(3, 'customer', 'Khách hàng');

-- Admin (password: 123456)
INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `phone`, `status`) VALUES
(1, 'Administrator', 'admin@gmail.com', '$2b$10$8K1p/a0dL1LXMw0gV3z0aOxJ8y1J8y1J8y1J8y1J8y1J8y1J8y1J8', '0901234567', 'active');

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES (1, 1);

-- Branches (Rạp)
INSERT INTO `branches` (`id`, `name`, `address`, `city`, `hotline`, `status`) VALUES
(1, 'LMK Cinema Man Thiện', '120 Man Thiện, Phường Hiệp Phú, TP. Thủ Đức', 'TP. Hồ Chí Minh', '1900 1234', 'active'),
(2, 'LMK Cinema Vincom Thủ Đức', 'Vincom Plaza Thủ Đức, 216 Võ Văn Ngân', 'TP. Hồ Chí Minh', '1900 1234', 'active'),
(3, 'LMK Cinema AEON Bình Dương', 'AEON Mall Bình Dương, Lái Thiêu', 'Bình Dương', '1900 1234', 'active');

-- Screens (Phòng chiếu) - 10 hàng x 12 cột = 120 ghế/phòng
INSERT INTO `screens` (`id`, `branch_id`, `name`, `seat_rows`, `seat_cols`, `type`, `status`) VALUES
(1, 1, 'Rạp 01', 10, 12, 'standard', 'active'),
(2, 1, 'Rạp 02', 10, 12, 'standard', 'active'),
(3, 1, 'Rạp 03', 10, 12, 'standard', 'active'),
(4, 2, 'Rạp 01', 10, 12, 'standard', 'active'),
(5, 2, 'Rạp 02', 10, 12, 'standard', 'active'),
(6, 2, 'Rạp 03', 10, 12, 'standard', 'active'),
(7, 3, 'Rạp 01', 10, 12, 'standard', 'active'),
(8, 3, 'Rạp 02', 10, 12, 'standard', 'active'),
(9, 3, 'Rạp 03', 10, 12, 'standard', 'active');

-- Seats: 120 ghế/phòng (Hàng A-H: Thường, Hàng I-J: VIP)
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

-- Ticket Prices (Giá vé - chỉ 2 loại: Thường 65.000đ, VIP 85.000đ)
-- Giá này áp dụng cho TẤT CẢ các ngày, không phân biệt ngày thường/cuối tuần/lễ
INSERT INTO `ticket_prices` (`screen_type`, `seat_type`, `day_type`, `price`, `is_active`) VALUES
('standard', 'standard', 'weekday', 65000, true),
('standard', 'vip', 'weekday', 85000, true);

-- Movies (Phim)
INSERT INTO `movies` (`id`, `title`, `slug`, `synopsis`, `genres`, `duration_minutes`, `rating`, `language`, `country`, `director`, `poster_url`, `status`, `release_date`) VALUES
(1, 'Avengers: Endgame', 'avengers-endgame', 'Sau sự kiện tàn khốc của Infinity War, các siêu anh hùng còn lại phải tập hợp lại một lần nữa để đảo ngược hành động của Thanos.', 'Hành động, Phiêu lưu', 181, 'T13', 'Tiếng Anh', 'Mỹ', 'Anthony Russo', 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg', 'now_showing', '2024-01-15'),
(2, 'Spider-Man: No Way Home', 'spider-man-no-way-home', 'Peter Parker tìm đến Doctor Strange để xóa ký ức mọi người về việc anh là Spider-Man.', 'Hành động, Phiêu lưu', 148, 'T13', 'Tiếng Anh', 'Mỹ', 'Jon Watts', 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', 'now_showing', '2024-02-10'),
(3, 'The Batman', 'the-batman', 'Batman khám phá ra sự tham nhũng ở Gotham City trong khi đối mặt với Riddler.', 'Hành động, Tội phạm', 176, 'T16', 'Tiếng Anh', 'Mỹ', 'Matt Reeves', 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fvber9r3tLzyL0ED.jpg', 'now_showing', '2024-03-01'),
(4, 'Dune: Part Two', 'dune-part-two', 'Paul Atreides hợp lực với Chani và người Fremen để trả thù những kẻ đã hủy diệt gia đình anh.', 'Khoa học viễn tưởng', 166, 'T13', 'Tiếng Anh', 'Mỹ', 'Denis Villeneuve', 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg', 'now_showing', '2024-03-15'),
(5, 'Oppenheimer', 'oppenheimer', 'Câu chuyện về J. Robert Oppenheimer và vai trò của ông trong việc phát triển bom nguyên tử.', 'Tiểu sử, Chính kịch', 180, 'T18', 'Tiếng Anh', 'Mỹ', 'Christopher Nolan', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', 'now_showing', '2024-01-20');

-- Showtimes (Suất chiếu - 7 ngày)
INSERT INTO `showtimes` (`movie_id`, `screen_id`, `start_time`, `end_time`, `language`, `subtitle`, `status`)
SELECT 
  m.id,
  s.id,
  DATE_ADD(DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY), INTERVAL t.hour HOUR),
  DATE_ADD(DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY), INTERVAL (t.hour + 3) HOUR),
  'Tiếng Anh',
  'Phụ đề Việt',
  'selling'
FROM movies m
CROSS JOIN (SELECT 1 as id UNION SELECT 2 UNION SELECT 3) s
CROSS JOIN (SELECT 0 as day_offset UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) d
CROSS JOIN (SELECT 9 as hour UNION SELECT 12 UNION SELECT 15 UNION SELECT 18 UNION SELECT 21) t
WHERE m.status = 'now_showing'
AND DATE_ADD(DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY), INTERVAL t.hour HOUR) > NOW();

-- Concessions (Bắp nước) với hình ảnh
INSERT INTO `concessions` (`name`, `description`, `price`, `type`, `image_url`) VALUES
('Combo Couple', 'Bắp lớn + 2 nước lớn', 109000, 'combo', 'https://www.cgv.vn/media/concession/web/63734d65a9e53-combo-cgv-2-nguoi-new.png'),
('Combo Single', 'Bắp vừa + 1 nước lớn', 79000, 'combo', 'https://www.cgv.vn/media/concession/web/63734d2a0a5da-combo-cgv-1-nguoi-new.png'),
('Combo Family', 'Bắp đại + 4 nước lớn', 189000, 'combo', 'https://www.cgv.vn/media/concession/web/6409e6c80c7b9-combo-4nguoi-my.png'),
('Bắp rang bơ L', 'Bắp rang bơ size lớn', 49000, 'popcorn', 'https://www.cgv.vn/media/concession/web/637341e0e1786-bap-rang-bo-69oz.png'),
('Bắp rang bơ M', 'Bắp rang bơ size vừa', 39000, 'popcorn', 'https://www.cgv.vn/media/concession/web/637341f3a54bf-bap-rang-bo-46oz.png'),
('Bắp phô mai', 'Bắp rang vị phô mai size L', 55000, 'popcorn', 'https://www.cgv.vn/media/concession/web/637341e0e1786-bap-rang-bo-69oz.png'),
('Coca Cola L', 'Coca Cola size lớn 32oz', 32000, 'drink', 'https://www.cgv.vn/media/concession/web/6373423e7689e-cocacola-32oz.png'),
('Pepsi L', 'Pepsi size lớn 32oz', 32000, 'drink', 'https://www.cgv.vn/media/concession/web/637342a7aedb5-pepsi-32oz.png'),
('Sprite L', 'Sprite size lớn 32oz', 32000, 'drink', 'https://www.cgv.vn/media/concession/web/6373427a51b10-sprite-32oz.png'),
('Fanta L', 'Fanta cam size lớn 32oz', 32000, 'drink', 'https://www.cgv.vn/media/concession/web/6373425fe4c67-fanta-32oz.png'),
('Nước suối', 'Nước suối Aquafina 500ml', 15000, 'drink', 'https://www.cgv.vn/media/concession/web/60805c73c3df6-aquafina.png'),
('Nachos Phô Mai', 'Nachos kèm sốt phô mai', 59000, 'snack', 'https://www.cgv.vn/media/concession/web/60c2b34babb63-nachos.png');

-- Banners (Slide ảnh trang chủ)
INSERT INTO `banners` (`title`, `image_url`, `link_url`, `description`, `position`, `is_active`) VALUES
('Khuyến mãi Tháng 12', 'https://www.cgv.vn/media/banner/cache/1/b58515f018eb873dafa430b6f9ae0c1e/9/8/980x448_u22_1_.jpg', '/chuong-trinh-khuyen-mai', 'Ưu đãi đặc biệt dành cho sinh viên U22', 1, true),
('Combo Bắp Nước', 'https://www.cgv.vn/media/banner/cache/1/b58515f018eb873dafa430b6f9ae0c1e/c/o/combo_2nguoi_980x448.jpg', '/popcorn-drink', 'Combo tiết kiệm cho 2 người', 2, true),
('Phim Hay Tháng 12', 'https://www.cgv.vn/media/banner/cache/1/b58515f018eb873dafa430b6f9ae0c1e/h/o/home_-_main_banner_-_980wx448h_28_.jpg', '/movie', 'Xem ngay các phim hot nhất', 3, true);

-- =============================================
-- KIỂM TRA
-- =============================================
SELECT '✅ Database reset thành công!' as Status;
SELECT 'Roles' as `Bảng`, COUNT(*) as `Số lượng` FROM roles
UNION ALL SELECT 'Users', COUNT(*) FROM users
UNION ALL SELECT 'Branches', COUNT(*) FROM branches
UNION ALL SELECT 'Screens', COUNT(*) FROM screens
UNION ALL SELECT 'Seats', COUNT(*) FROM seats
UNION ALL SELECT 'Movies', COUNT(*) FROM movies
UNION ALL SELECT 'Showtimes', COUNT(*) FROM showtimes
UNION ALL SELECT 'Ticket Prices', COUNT(*) FROM ticket_prices
UNION ALL SELECT 'Concessions', COUNT(*) FROM concessions
UNION ALL SELECT 'Banners', COUNT(*) FROM banners;
