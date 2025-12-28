# 🚀 Hướng dẫn Setup Thanh toán QR Code - Bước nhanh

## ✅ Các file đã được tạo:

1. ✅ `app/api/payments/create-qr/route.js` - API tạo QR code
2. ✅ `app/api/payments/check-status/route.js` - API kiểm tra thanh toán
3. ✅ `app/api/cron/check-payments/route.js` - Cron job tự động
4. ✅ `scripts/check-payments.js` - Script chạy cron job
5. ✅ `prisma/migrations/add_payment_qr_code.sql` - SQL migration
6. ✅ `app/checkout/page.jsx` - Đã cập nhật để hiển thị QR
7. ✅ `app/globals.css` - Đã thêm CSS cho QR section

## 📋 Các bước cần làm:

### Bước 1: Chạy Migration Database

**Cách 1: Chạy SQL trực tiếp (Khuyến nghị)**

Mở MySQL và chạy file SQL:

```bash
# Windows (PowerShell)
mysql -u root -p cinehub < prisma/migrations/add_payment_qr_code.sql

# Hoặc mở MySQL Workbench và chạy file SQL
```

**Cách 2: Dùng Prisma (nếu không có lỗi drift)**

```bash
npx prisma migrate dev --name add_payment_qr_code
```

### Bước 2: Cấu hình Environment Variables

Thêm vào file `.env`:

```env
# Payment - Bank Transfer
BANK_ACCOUNT=1234567890
BANK_NAME=Ngân hàng TMCP Á Châu (ACB)
ACCOUNT_NAME=LMK CINEMA

# Cron Job (tạo secret key ngẫu nhiên)
CRON_SECRET=your-random-secret-key-here-12345
API_URL=http://localhost:3000
```

**Tạo CRON_SECRET:**
```bash
# Windows PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))

# Hoặc dùng online generator: https://randomkeygen.com/
```

### Bước 3: Generate Prisma Client

```bash
npx prisma generate
```

### Bước 4: Test hệ thống

1. **Khởi động server:**
```bash
npm run dev
```

2. **Test tạo QR code:**
   - Vào trang checkout
   - Thêm vé vào giỏ hàng
   - Chọn "Chuyển khoản QR"
   - Click "Thanh toán"
   - Kiểm tra QR code có hiển thị không

3. **Test cron job (thủ công):**
```bash
# Mở terminal mới
curl -X GET "http://localhost:3000/api/cron/check-payments" -H "Authorization: Bearer your-cron-secret"
```

### Bước 5: Setup Cron Job (Tùy chọn)

**Option A: Vercel Cron (nếu deploy lên Vercel)**

Tạo file `vercel.json`:
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

**Option B: Local Cron (Windows Task Scheduler)**

1. Mở Task Scheduler
2. Tạo task mới
3. Trigger: Mỗi 5 phút
4. Action: Chạy `node scripts/check-payments.js`

**Option C: GitHub Actions**

Tạo `.github/workflows/check-payments.yml`:
```yaml
name: Check Payments
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check
        run: |
          curl -X GET "${{ secrets.API_URL }}/api/cron/check-payments" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 🧪 Kiểm tra hoạt động

### 1. Tạo booking và QR code:
- Vào `/checkout`
- Chọn "Chuyển khoản QR"
- Click thanh toán
- ✅ QR code hiển thị
- ✅ Thông tin ngân hàng hiển thị

### 2. Kiểm tra database:
```sql
SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
SELECT * FROM bookings WHERE payment_method = 'bank_transfer' ORDER BY created_at DESC LIMIT 5;
```

### 3. Test cron job:
```bash
# Gọi API thủ công
curl -X GET "http://localhost:3000/api/cron/check-payments" \
  -H "Authorization: Bearer your-cron-secret"
```

## ⚠️ Lưu ý quan trọng

1. **Tích hợp API ngân hàng thực tế:**
   - Hiện tại hàm `checkBankPayment` chỉ mô phỏng
   - Cần tích hợp với VietQR API hoặc API ngân hàng thực tế
   - Xem file `app/api/cron/check-payments/route.js` để cập nhật

2. **Bảo mật:**
   - Không commit file `.env` lên Git
   - Sử dụng secret key mạnh cho `CRON_SECRET`
   - Bảo vệ API endpoints

3. **Thời gian hết hạn:**
   - QR code mặc định hết hạn sau 15 phút
   - Có thể điều chỉnh trong `app/api/payments/create-qr/route.js`

## 📚 Tài liệu chi tiết

Xem file `docs/PAYMENT_SETUP.md` để biết thêm chi tiết về:
- Tích hợp API ngân hàng
- Troubleshooting
- Cấu hình nâng cao

## 🆘 Nếu gặp lỗi

1. **Lỗi migration:**
   - Kiểm tra MySQL đang chạy
   - Kiểm tra quyền user database
   - Chạy từng câu lệnh SQL một

2. **QR code không hiển thị:**
   - Kiểm tra package `qrcode` đã cài: `npm list qrcode`
   - Kiểm tra console browser để xem lỗi
   - Kiểm tra API `/api/payments/create-qr` có hoạt động không

3. **Cron job không chạy:**
   - Kiểm tra `CRON_SECRET` đã đúng chưa
   - Kiểm tra API endpoint có thể truy cập
   - Kiểm tra logs

---

**Bắt đầu từ Bước 1 nhé!** 🚀





