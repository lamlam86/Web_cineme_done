# Hướng dẫn Setup Thanh toán QR Code Tự động

## Tổng quan

Hệ thống thanh toán QR Code tự động cho phép:
- Tạo mã QR thanh toán ngân hàng
- Tự động kiểm tra và xác nhận thanh toán khi ngân hàng nhận tiền
- Cron job chạy định kỳ để kiểm tra trạng thái thanh toán

## Cài đặt

### 1. Cập nhật Database Schema

Chạy migration để thêm bảng `payments`:

```bash
npx prisma migrate dev --name add_payment_qr_code
```

Hoặc nếu database đã có dữ liệu, tạo migration thủ công:

```sql
-- Thêm các trường vào bảng bookings
ALTER TABLE bookings 
ADD COLUMN transaction_id VARCHAR(191) UNIQUE,
ADD COLUMN qr_code TEXT,
ADD COLUMN qr_expires_at DATETIME,
ADD COLUMN paid_at DATETIME,
ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Tạo bảng payments
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
```

### 2. Cấu hình Environment Variables

Thêm vào file `.env`:

```env
# Payment - Bank Transfer
BANK_ACCOUNT=1234567890
BANK_NAME=Ngân hàng TMCP Á Châu (ACB)
ACCOUNT_NAME=LMK CINEMA

# Cron Job
CRON_SECRET=your-secret-key-here
API_URL=http://localhost:3000

# VietQR API (nếu sử dụng)
VIETQR_API_KEY=your-vietqr-api-key-here
```

### 3. Setup Cron Job

#### Option 1: Sử dụng Vercel Cron (nếu deploy lên Vercel)

Thêm vào `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-payments",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### Option 2: Sử dụng Node.js Script

Chạy script định kỳ bằng cron hoặc task scheduler:

```bash
# Linux/Mac - Thêm vào crontab
*/5 * * * * cd /path/to/project && node scripts/check-payments.js

# Windows - Sử dụng Task Scheduler
# Tạo task chạy mỗi 5 phút: node scripts/check-payments.js
```

#### Option 3: Sử dụng GitHub Actions

Tạo file `.github/workflows/check-payments.yml`:

```yaml
name: Check Payments
on:
  schedule:
    - cron: '*/5 * * * *'  # Mỗi 5 phút
  workflow_dispatch:

jobs:
  check-payments:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check Payments
        run: |
          curl -X GET "${{ secrets.API_URL }}/api/cron/check-payments" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Tích hợp với API Ngân hàng

### VietQR API

Để tích hợp với VietQR API, cập nhật hàm `checkBankPayment` trong `app/api/cron/check-payments/route.js`:

```javascript
async function checkBankPayment(payment) {
  try {
    const response = await fetch(`https://api.vietqr.io/v2/transaction/${payment.transaction_id}`, {
      headers: {
        'x-api-key': process.env.VIETQR_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data.status === 'success' && data.amount === Number(payment.amount);
  } catch (error) {
    console.error('VietQR API error:', error);
    return false;
  }
}
```

### Ngân hàng API khác

Tùy theo ngân hàng bạn sử dụng, có thể tích hợp:
- ACB API
- Vietcombank API
- BIDV API
- Hoặc các payment gateway như VNPay, MoMo

## Sử dụng

### 1. Tạo mã QR thanh toán

Khi khách hàng chọn "Chuyển khoản QR" ở checkout:
- Hệ thống tự động tạo booking
- Tạo mã QR thanh toán
- Hiển thị QR code và thông tin tài khoản

### 2. Kiểm tra thanh toán tự động

- Client-side: Kiểm tra mỗi 5 giây khi đang ở trang checkout
- Server-side: Cron job chạy mỗi 5 phút để kiểm tra tất cả payments pending

### 3. Xác nhận thanh toán

Khi phát hiện thanh toán thành công:
- Cập nhật `payment.status` = "paid"
- Cập nhật `booking.payment_status` = "paid"
- Cập nhật `booking.status` = "confirmed"
- Ghi lại thời gian `paid_at`

## API Endpoints

### POST /api/payments/create-qr
Tạo mã QR thanh toán

**Request:**
```json
{
  "booking_id": "123"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "transaction_id": "TXN1234567890",
    "qr_code": "data:image/png;base64,...",
    "amount": 150000,
    "bank_account": "1234567890",
    "bank_name": "ACB",
    "expires_at": "2024-12-03T10:30:00Z"
  }
}
```

### POST /api/payments/check-status
Kiểm tra trạng thái thanh toán

**Request:**
```json
{
  "transaction_id": "TXN1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "status": "paid",
  "payment": {
    "transaction_id": "TXN1234567890",
    "status": "paid",
    "paid_at": "2024-12-03T10:25:00Z"
  }
}
```

### GET /api/cron/check-payments
Cron job endpoint (cần Authorization header)

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

## Lưu ý

1. **Bảo mật**: Luôn sử dụng `CRON_SECRET` để bảo vệ cron endpoint
2. **Thời gian hết hạn**: Mã QR mặc định hết hạn sau 15 phút
3. **Rate limiting**: Có thể cần thêm rate limiting cho API endpoints
4. **Error handling**: Xử lý lỗi khi API ngân hàng không khả dụng
5. **Logging**: Ghi log tất cả các giao dịch để audit

## Troubleshooting

### QR code không hiển thị
- Kiểm tra package `qrcode` đã được cài đặt
- Kiểm tra console để xem lỗi

### Cron job không chạy
- Kiểm tra `CRON_SECRET` đã được cấu hình
- Kiểm tra API endpoint có thể truy cập được
- Kiểm tra logs của cron service

### Thanh toán không tự động xác nhận
- Kiểm tra hàm `checkBankPayment` đã được tích hợp với API ngân hàng
- Kiểm tra cron job có đang chạy không
- Kiểm tra database có cập nhật đúng không





