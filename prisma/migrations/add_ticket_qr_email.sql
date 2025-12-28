-- Migration: Add ticket QR code and email tracking
-- Run this SQL manually

ALTER TABLE bookings 
ADD COLUMN ticket_qr_code TEXT,
ADD COLUMN email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN email_sent_at DATETIME;





