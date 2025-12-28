import express from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, setAuthCookies, removeAuthCookies, getCurrentUser } from '../lib/auth.js';
import cookieParser from 'cookie-parser';

const router = express.Router();
router.use(cookieParser());

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email và mật khẩu là bắt buộc" });
    }

    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        user_roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }

    const roles = user.user_roles.map((ur) => ur.role.name);

    const userData = {
      id: Number(user.id),
      email: user.email,
      fullName: user.full_name,
      roles,
    };

    setAuthCookies(res, userData, rememberMe);

    res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  removeAuthCookies(res);
  res.json({ success: true, message: "Đăng xuất thành công" });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    const user = await prisma.users.findUnique({
      where: { id: BigInt(currentUser.id) },
      include: {
        user_roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }

    const roles = user.user_roles.map((ur) => ur.role.name);

    res.json({
      success: true,
      user: {
        id: user.id.toString(),
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        roles,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ success: false, message: "Đã có lỗi xảy ra" });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 8 ký tự" });
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email đã được sử dụng" });
    }

    const passwordHash = await hashPassword(password);
    const customerRole = await prisma.roles.findUnique({ where: { name: "customer" } });

    if (!customerRole) {
      return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }

    const user = await prisma.users.create({
      data: {
        full_name: fullName,
        email,
        password_hash: passwordHash,
        phone: phone || null,
        user_roles: {
          create: { role_id: customerRole.id },
        },
      },
      include: {
        user_roles: {
          include: { role: true },
        },
      },
    });

    const roles = user.user_roles.map((ur) => ur.role.name);

    const userData = {
      id: Number(user.id),
      email: user.email,
      fullName: user.full_name,
      roles,
    };

    setAuthCookies(res, userData, false);

    res.status(201).json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Lỗi đăng ký" });
  }
});

export default router;





