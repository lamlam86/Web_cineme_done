import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { sendResetPasswordEmail } from "@/lib/email";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập email" },
        { status: 400 }
      );
    }

    // Tìm user
    const user = await prisma.users.findUnique({
      where: { email },
    });

    // Luôn trả về success để không tiết lộ email có tồn tại không
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn.",
      });
    }

    // Tạo reset token (hết hạn sau 1 giờ)
    const resetToken = jwt.sign(
      { userId: user.id.toString(), email: user.email, type: "password_reset" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Gửi email reset password
    try {
      await sendResetPasswordEmail(user.email, user.full_name, resetToken);
    } catch (emailError) {
      console.error("Error sending reset password email:", emailError);
      // Vẫn trả về success để không tiết lộ lỗi
    }

    return NextResponse.json({
      success: true,
      message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "Đã có lỗi xảy ra" },
      { status: 500 }
    );
  }
}





