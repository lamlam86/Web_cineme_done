# 📦 Hướng dẫn Tách Backend và Frontend

## ✅ Đã tạo cấu trúc cơ bản

### Backend (`/backend`)
- ✅ `server.js` - Express server
- ✅ `package.json` - Dependencies
- ✅ `lib/prisma.js` - Prisma client
- ✅ `lib/auth.js` - Auth utilities (Express version)
- ✅ `routes/auth.js` - Auth routes (mẫu)
- ✅ `routes/movies.js` - Movies routes (mẫu)

### Cần làm tiếp:

## Bước 1: Copy Prisma files

```bash
# Copy schema và migrations
cp -r prisma/* backend/prisma/
```

Hoặc copy thủ công:
- `prisma/schema.prisma` → `backend/prisma/schema.prisma`
- `prisma/seed.ts` → `backend/prisma/seed.ts`
- `prisma/migrations/` → `backend/prisma/migrations/`

## Bước 2: Copy các API routes còn lại

Copy từ `app/api/` sang `backend/routes/`:

### Routes cần copy:
- `app/api/bookings/route.js` → `backend/routes/bookings.js`
- `app/api/branches/route.js` → `backend/routes/branches.js`
- `app/api/concessions/route.js` → `backend/routes/concessions.js`
- `app/api/showtimes/route.js` → `backend/routes/showtimes.js`
- `app/api/promotions/route.js` → `backend/routes/promotions.js`
- `app/api/search/route.js` → `backend/routes/search.js`
- `app/api/payments/create-qr/route.js` → `backend/routes/payments.js`
- `app/api/payments/check-status/route.js` → Thêm vào `backend/routes/payments.js`
- `app/api/cron/check-payments/route.js` → `backend/routes/cron.js`

### Admin routes:
- `app/api/admin/movies/route.js` → `backend/routes/admin/movies.js`
- `app/api/admin/users/route.js` → `backend/routes/admin/users.js`
- `app/api/admin/cinemas/route.js` → `backend/routes/admin/cinemas.js`
- `app/api/admin/showtimes/route.js` → `backend/routes/admin/showtimes.js`
- `app/api/admin/promotions/route.js` → `backend/routes/admin/promotions.js`
- `app/api/admin/orders/route.js` → `backend/routes/admin/orders.js`

## Bước 3: Cập nhật imports trong routes

Thay đổi từ Next.js sang Express:

**Trước (Next.js):**
```javascript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request) {
  const user = await getCurrentUser();
  return NextResponse.json({ data });
}
```

**Sau (Express):**
```javascript
import express from 'express';
import { prisma } from '../lib/prisma.js';
import { getCurrentUser, requireAuth } from '../lib/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const user = getCurrentUser(req);
  res.json({ data });
});
```

## Bước 4: Cài đặt dependencies cho backend

```bash
cd backend
npm install
```

## Bước 5: Cấu hình backend

1. Copy `.env` từ root hoặc tạo mới:
```bash
cd backend
cp ../.env .env
```

2. Cập nhật `.env`:
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
DATABASE_URL="mysql://user:password@localhost:3306/cinehub"
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

## Bước 6: Tạo Frontend mới

Tạo folder `frontend/` và copy:

```bash
# Tạo frontend folder
mkdir frontend

# Copy các file/folder cần thiết
cp -r app frontend/
cp -r components frontend/
cp -r contexts frontend/
cp -r public frontend/
cp package.json frontend/
cp next.config.mjs frontend/
cp jsconfig.json frontend/
cp postcss.config.mjs frontend/
cp tailwind.config.js frontend/ (nếu có)
```

## Bước 7: Cập nhật Frontend

1. **Tạo file `frontend/lib/api.js`** để gọi API:

```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Để gửi cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}
```

2. **Cập nhật tất cả fetch calls** trong frontend:

**Trước:**
```javascript
const res = await fetch("/api/movies");
```

**Sau:**
```javascript
import { apiRequest } from '@/lib/api';
const data = await apiRequest("/api/movies");
```

Hoặc:
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const res = await fetch(`${API_URL}/api/movies`, { credentials: 'include' });
```

## Bước 8: Cấu hình Frontend

1. **Tạo `frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

2. **Cập nhật `frontend/package.json`:**
```json
{
  "name": "lmk-cinema-frontend",
  "scripts": {
    "dev": "next dev --turbopack -p 3000",
    "build": "next build --turbopack",
    "start": "next start -p 3000"
  }
}
```

## Bước 9: Chạy cả 2 servers

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
# Server chạy trên http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
# Server chạy trên http://localhost:3000
```

## Bước 10: Cài cookie-parser cho backend

```bash
cd backend
npm install cookie-parser
```

Và cập nhật `server.js`:
```javascript
import cookieParser from 'cookie-parser';
app.use(cookieParser());
```

## 📝 Checklist

- [ ] Copy Prisma files
- [ ] Copy tất cả API routes
- [ ] Cập nhật imports (Next.js → Express)
- [ ] Cài dependencies backend
- [ ] Cấu hình .env backend
- [ ] Tạo frontend folder
- [ ] Copy frontend files
- [ ] Tạo lib/api.js
- [ ] Cập nhật tất cả fetch calls
- [ ] Cấu hình .env frontend
- [ ] Test cả 2 servers

## 🚀 Script tự động (tùy chọn)

Tôi có thể tạo script để tự động copy và convert các routes. Bạn có muốn tôi tạo không?





