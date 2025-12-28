# Hướng dẫn Setup Database cho Cinema

## 1. Tạo file .env

Copy file `.env.example` thành `.env` và cập nhật các giá trị:

```bash
cp .env.example .env
```

Cập nhật `DATABASE_URL` với thông tin MySQL của bạn:
```
DATABASE_URL="mysql://user:password@localhost:3306/cinema_db"
```

## 2. Sync Schema với Database

Chạy lệnh để đồng bộ schema Prisma với database:

```bash
npx prisma db push
```

Hoặc tạo migration:
```bash
npx prisma migrate dev --name init
```

## 3. Seed dữ liệu mẫu

Chạy file SQL để tạo dữ liệu:

```bash
mysql -u user -p cinema_db < prisma/seed-complete.sql
```

Hoặc dùng MySQL Workbench/phpMyAdmin để import file `prisma/seed-complete.sql`.

## 4. Generate Prisma Client

```bash
npx prisma generate
```

## 5. Khởi động server

```bash
npm run dev
```

---

## Cấu trúc dữ liệu

### Bảng `ticket_prices`
Quản lý giá vé theo:
- **screen_type**: Loại phòng (standard, vip, imax, 4dx, premium)
- **seat_type**: Loại ghế (standard, vip, couple, disabled)
- **day_type**: Loại ngày (weekday, weekend, holiday)

### Bảng `seats`
- Mỗi phòng có 40 ghế (5 hàng × 8 cột)
- Hàng A-C: Ghế thường
- Hàng D-E: Ghế VIP

### Bảng `showtimes`
- Liên kết với movies, screens
- Không còn trường `base_price` (dùng `ticket_prices` thay thế)

---

## Thay đổi quan trọng

1. **Xóa `base_price` từ `showtimes`**: Giá vé giờ được tính từ bảng `ticket_prices` dựa trên loại phòng, loại ghế, và ngày chiếu.

2. **API mới**:
   - `GET /api/admin/ticket-prices` - Lấy bảng giá
   - `POST /api/admin/ticket-prices` - Thêm giá mới
   - `PATCH /api/admin/ticket-prices` - Cập nhật giá

3. **API `/api/showtimes/[id]/seats`**: Trả về `price_map` với giá từng loại ghế.

4. **Trang quản lý mới**:
   - `/admin/tickets` - Quản lý vé theo suất chiếu
   - `/admin/ticket-prices` - Quản lý bảng giá vé
