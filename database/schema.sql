-- Movie Ticket Booking Database Schema
CREATE DATABASE IF NOT EXISTS cinehub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cinehub;

-- Roles
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(150)
);

-- Users
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(255),
  status ENUM('active','blocked','pending') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
  user_id BIGINT,
  role_id INT,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Movies
CREATE TABLE movies (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) UNIQUE,
  synopsis TEXT,
  genres VARCHAR(200),
  duration_minutes INT,
  rating VARCHAR(10),
  language VARCHAR(60),
  poster_url VARCHAR(255),
  backdrop_url VARCHAR(255),
  trailer_url VARCHAR(255),
  status ENUM('now_showing','coming_soon','draft','archived') DEFAULT 'draft',
  release_date DATE,
  is_featured TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Branches & Screens
CREATE TABLE branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(120),
  hotline VARCHAR(20),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  status ENUM('active','maintenance','inactive') DEFAULT 'active'
);

CREATE TABLE screens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  name VARCHAR(80) NOT NULL,
  seat_rows INT NOT NULL,
  seat_cols INT NOT NULL,
  type ENUM('standard','vip','imax','4dx','premium') DEFAULT 'standard',
  status ENUM('active','maintenance','inactive') DEFAULT 'active',
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE TABLE seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  screen_id INT NOT NULL,
  seat_code VARCHAR(10) NOT NULL,
  seat_row CHAR(2) NOT NULL,
  seat_number INT NOT NULL,
  seat_type ENUM('standard','vip','couple','disabled') DEFAULT 'standard',
  UNIQUE (screen_id, seat_code),
  FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
);

-- Showtimes
CREATE TABLE showtimes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  movie_id BIGINT NOT NULL,
  screen_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  language VARCHAR(50),
  subtitle VARCHAR(50),
  status ENUM('scheduled','selling','closed','cancelled') DEFAULT 'scheduled',
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
);

-- Bookings
CREATE TABLE bookings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  showtime_id BIGINT NOT NULL,
  booking_code VARCHAR(20) UNIQUE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash','momo','vnpay','credit','wallet') DEFAULT 'momo',
  payment_status ENUM('pending','paid','refunded','failed') DEFAULT 'pending',
  status ENUM('reserved','confirmed','cancelled') DEFAULT 'reserved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
);

CREATE TABLE booking_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT NOT NULL,
  seat_id INT NOT NULL,
  seat_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE,
  UNIQUE (booking_id, seat_id)
);

-- Concessions
CREATE TABLE concessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  type ENUM('combo','popcorn','drink','snack') DEFAULT 'combo',
  image_url VARCHAR(255)
);

CREATE TABLE booking_concessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT NOT NULL,
  concession_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (concession_id) REFERENCES concessions(id) ON DELETE CASCADE
);

-- Promotions
CREATE TABLE promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(30) UNIQUE,
  description VARCHAR(255),
  discount_type ENUM('percent','fixed') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  max_usage INT,
  usage_count INT DEFAULT 0,
  min_order_value DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  status ENUM('draft','active','expired','disabled') DEFAULT 'draft'
);

CREATE TABLE movie_promotions (
  movie_id BIGINT,
  promotion_id INT,
  PRIMARY KEY (movie_id, promotion_id),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
);

-- Audit logs
CREATE TABLE audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  action VARCHAR(120) NOT NULL,
  payload JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Seed default roles
INSERT INTO roles (name, description) VALUES
('admin','Quản trị hệ thống'),
('staff','Nhân viên rạp'),
('customer','Khách hàng');
