import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken, setAuthCookie } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, password } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Họ tên, email và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Email không hợp lệ" },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { success: false, message: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email này đã được sử dụng" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    let customerRole = await prisma.roles.findUnique({
      where: { name: "customer" },
    });

    if (!customerRole) {
      customerRole = await prisma.roles.create({
        data: { name: "customer", description: "Khách hàng" },
      });
    }

    const user = await prisma.users.create({
      data: {
        full_name: fullName,
        email,
        password_hash: hashedPassword,
        phone: phone || null,
        status: "active",
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

    const token = generateToken({
      userId: user.id.toString(),
      email: user.email,
      roles,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: "Đăng ký thành công",
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
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, message: "Đã có lỗi xảy ra, vui lòng thử lại" },
      { status: 500 }
    );
  }
}









