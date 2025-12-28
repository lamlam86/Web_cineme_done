import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Mật khẩu tối thiểu 8 ký tự" },
        { status: 400 }
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== "password_reset") {
        return NextResponse.json(
          { success: false, message: "Token không hợp lệ" },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Link đã hết hạn hoặc không hợp lệ" },
        { status: 400 }
      );
    }

    // Tìm user
    const user = await prisma.users.findUnique({
      where: { id: BigInt(decoded.userId) },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Người dùng không tồn tại" },
        { status: 404 }
      );
    }

    // Kiểm tra email khớp
    if (user.email !== decoded.email) {
      return NextResponse.json(
        { success: false, message: "Token không hợp lệ" },
        { status: 400 }
      );
    }

    // Hash password mới
    const hashedPassword = await hashPassword(password);

    // Cập nhật password
    await prisma.users.update({
      where: { id: user.id },
      data: { password_hash: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Đã có lỗi xảy ra" },
      { status: 500 }
    );
  }
}





