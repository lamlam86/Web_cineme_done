-- Migration: Add payment QR code support
-- Run this SQL manually if Prisma migrate has issues

-- Add columns to bookings table (MySQL doesn't support IF NOT EXISTS for ALTER TABLE)
-- Run these one by one, skip if column already exists
ALTER TABLE bookings ADD COLUMN transaction_id VARCHAR(191) UNIQUE;
ALTER TABLE bookings ADD COLUMN qr_code TEXT;
ALTER TABLE bookings ADD COLUMN qr_expires_at DATETIME;
ALTER TABLE bookings ADD COLUMN paid_at DATETIME;
ALTER TABLE bookings ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Create payments table
CREATE TABLE payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT NOT NULL,
  transaction_id VARCHAR(191) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  bank_account VARCHAR(50),
  bank_name VARCHAR(100),
  qr_code TEXT,
  qr_data TEXT,
  payment_method ENUM('cash','momo','vnpay','credit','wallet','bank_transfer') DEFAULT 'bank_transfer',
  status ENUM('pending','paid','refunded','failed') DEFAULT 'pending',
  bank_response JSON,
  expires_at DATETIME,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_booking_id (booking_id),
  INDEX idx_status (status)
);

