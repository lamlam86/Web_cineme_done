# 📧 Hướng dẫn Setup Email Gửi Vé QR Code

## ✅ Đã tạo

1. ✅ `lib/email.js` - Email service với nodemailer
2. ✅ `app/api/bookings/send-ticket/route.js` - API gửi email vé
3. ✅ `app/api/bookings/verify-qr/route.js` - API verify QR code tại rạp
4. ✅ Tự động gửi email sau khi thanh toán thành công

## 📋 Cấu hình Email

### Bước 1: Cấu hình SMTP trong `.env`

Thêm các biến môi trường sau:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Bước 2: Tạo App Password cho Gmail

1. Vào [Google Account](https://myaccount.google.com/)
2. Security → 2-Step Verification (bật nếu chưa)
3. App passwords → Tạo app password mới
4. Chọn "Mail" và "Other (Custom name)"
5. Copy password và dán vào `SMTP_PASS`

### Bước 3: Hoặc dùng Email Service khác

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## 🗄️ Database Migration

Chạy migration để thêm các trường mới:

```sql
ALTER TABLE bookings 
ADD COLUMN ticket_qr_code TEXT,
ADD COLUMN email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN email_sent_at DATETIME;
```

Hoặc dùng Prisma:
```bash
npx prisma migrate dev --name add_ticket_qr_email
```

## 🚀 Cách hoạt động

### 1. Tự động gửi email sau thanh toán

Khi thanh toán thành công (từ cron job hoặc webhook):
- ✅ Tự động tạo QR code cho vé
- ✅ Gửi email với QR code đến khách hàng
- ✅ Lưu QR code vào database

### 2. Gửi email thủ công

API: `POST /api/bookings/send-ticket`

```javascript
const response = await fetch('/api/bookings/send-ticket', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ booking_id: 123 })
});
```

### 3. Verify QR code tại rạp

API: `POST /api/bookings/verify-qr`

**Request:**
```json
{
  "qr_data": "{\"type\":\"ticket\",\"booking_code\":\"ABC12345\",\"booking_id\":123}"
}
```

**Response (Vé hợp lệ):**
```json
{
  "valid": true,
  "message": "Vé hợp lệ",
  "booking": {
    "booking_code": "ABC12345",
    "movie": "Địa Đàng",
    "seats": ["A1", "A2"],
    "showtime": "2024-12-10T19:00:00Z"
  }
}
```

**Response (Vé không hợp lệ):**
```json
{
  "valid": false,
  "error": "Vé chưa được thanh toán"
}
```

## 📱 Tạo App Quét QR cho Staff

Bạn có thể tạo một trang đơn giản cho staff để quét QR:

```javascript
// app/staff/scan-qr/page.jsx
"use client";
import { useState } from 'react';

export default function ScanQRPage() {
  const [qrData, setQrData] = useState('');
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    const res = await fetch('/api/bookings/verify-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_data: qrData }),
    });
    
    const data = await res.json();
    setResult(data);
  };

  return (
    <div>
      <input 
        type="text" 
        value={qrData}
        onChange={(e) => setQrData(e.target.value)}
        placeholder="Quét hoặc nhập QR code"
      />
      <button onClick={handleVerify}>Xác thực</button>
      
      {result && (
        <div>
          {result.valid ? (
            <div style={{ color: 'green' }}>
              ✅ {result.message}
              <p>Phim: {result.booking.movie}</p>
              <p>Ghế: {result.booking.seats.join(', ')}</p>
            </div>
          ) : (
            <div style={{ color: 'red' }}>
              ❌ {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## 🧪 Test Email

### Test gửi email thủ công:

```bash
# Tạo file test-email.js
node -e "
import('./lib/email.js').then(({ sendTicketEmail }) => {
  sendTicketEmail({
    id: 1,
    booking_code: 'TEST1234',
    movie: 'Test Movie',
    branch: 'Test Branch',
    screen: 'Rạp 01',
    showtime: new Date(),
    seats: ['A1', 'A2'],
    total_amount: 150000,
    payment_method: 'momo'
  }, 'your-email@example.com', 'Test User')
  .then(() => console.log('Email sent!'))
  .catch(err => console.error('Error:', err));
});
"
```

## 📝 Email Template

Email template được tạo trong `lib/email.js` với:
- ✅ QR code lớn, dễ quét
- ✅ Thông tin đầy đủ về vé
- ✅ Design đẹp, responsive
- ✅ Attachment QR code image

## ⚠️ Lưu ý

1. **Rate Limiting**: Gmail có giới hạn 500 email/ngày (free account)
2. **Spam**: Đảm bảo email không bị vào spam
3. **Error Handling**: Email lỗi không làm gián đoạn payment flow
4. **Retry**: Có thể thêm retry mechanism nếu email fail

## 🔧 Troubleshooting

### Email không gửi được:
1. Kiểm tra SMTP credentials
2. Kiểm tra App Password (Gmail)
3. Kiểm tra firewall/network
4. Xem logs trong console

### QR code không hiển thị:
1. Kiểm tra `qrcode` package đã cài
2. Kiểm tra base64 encoding
3. Test QR code generation riêng

### Verify QR không hoạt động:
1. Kiểm tra user có role staff/admin
2. Kiểm tra booking đã paid chưa
3. Kiểm tra thời gian (có thể quét trước 60 phút)

---

**Sau khi cấu hình xong, hệ thống sẽ tự động gửi email vé với QR code sau mỗi lần thanh toán thành công!** 🎉





