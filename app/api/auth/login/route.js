import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setAuthCookies } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, rememberMe = false } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email và mật khẩu là bắt buộc" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { success: false, message: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    if (user.status === "blocked") {
      return NextResponse.json(
        { success: false, message: "Tài khoản của bạn đã bị khóa" },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    const roles = user.user_roles.map((ur) => ur.role.name);

    // Set auth cookies with session
    const { sessionId } = await setAuthCookies({
      id: user.id.toString(),
      email: user.email,
      fullName: user.full_name,
      roles,
    }, rememberMe);

    // Update last login time
    await prisma.users.update({
      where: { id: user.id },
      data: { updated_at: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        id: user.id.toString(),
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        roles,
      },
      session: {
        id: sessionId,
        expiresIn: rememberMe ? "30 ngày" : "7 ngày"
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Đã có lỗi xảy ra, vui lòng thử lại" },
      { status: 500 }
    );
  }
}


