/*
  Warnings:

  - The values [vip,imax,4dx,premium] on the enum `ticket_prices_screen_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [couple,disabled] on the enum `ticket_prices_seat_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [vip,imax,4dx,premium] on the enum `ticket_prices_screen_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [couple,disabled] on the enum `ticket_prices_seat_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `price` on the `ticket_prices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.
  - A unique constraint covering the columns `[transaction_id]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bookings` ADD COLUMN `email_sent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `email_sent_at` DATETIME(3) NULL,
    ADD COLUMN `paid_at` DATETIME(3) NULL,
    ADD COLUMN `qr_code` TEXT NULL,
    ADD COLUMN `qr_expires_at` DATETIME(3) NULL,
    ADD COLUMN `ticket_qr_code` TEXT NULL,
    ADD COLUMN `transaction_id` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    MODIFY `payment_method` ENUM('cash', 'momo', 'vnpay', 'credit', 'wallet', 'bank_transfer') NOT NULL DEFAULT 'momo';

-- AlterTable
ALTER TABLE `movies` ADD COLUMN `cast` TEXT NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `director` VARCHAR(191) NULL,
    MODIFY `synopsis` TEXT NULL;

-- AlterTable
ALTER TABLE `screens` MODIFY `type` ENUM('standard') NOT NULL DEFAULT 'standard';

-- AlterTable
ALTER TABLE `seats` MODIFY `seat_type` ENUM('standard', 'vip') NOT NULL DEFAULT 'standard';

-- AlterTable
ALTER TABLE `ticket_prices` MODIFY `screen_type` ENUM('standard') NOT NULL,
    MODIFY `seat_type` ENUM('standard', 'vip') NOT NULL,
    MODIFY `price` DECIMAL(65, 30) NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `date_of_birth` DATETIME(3) NULL,
    ADD COLUMN `points` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `payments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `booking_id` BIGINT NOT NULL,
    `transaction_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
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
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_transaction_id_key`(`transaction_id`),
    INDEX `payments_transaction_id_idx`(`transaction_id`),
    INDEX `payments_booking_id_idx`(`booking_id`),
    INDEX `payments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `bookings_transaction_id_key` ON `bookings`(`transaction_id`);

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RedefineIndex
CREATE UNIQUE INDEX `ticket_prices_screen_type_seat_type_day_type_key` ON `ticket_prices`(`screen_type`, `seat_type`, `day_type`);
DROP INDEX `ticket_prices_screen_seat_day` ON `ticket_prices`;
