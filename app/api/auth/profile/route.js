import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { success: false, message: "Người dùng không tồn tại" },
        { status: 404 }
      );
    }

    const roles = user.user_roles.map((ur) => ur.role.name);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id.toString(),
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        avatarUrl: user.avatar_url,
        points: user.points ?? 0,
        status: user.status,
        roles,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { success: false, message: "Đã có lỗi xảy ra" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fullName, phone, dateOfBirth, avatarUrl } = body;

    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Họ tên phải có ít nhất 2 ký tự" },
        { status: 400 }
      );
    }

    const user = await prisma.users.update({
      where: { id: BigInt(currentUser.id) },
      data: {
        full_name: fullName.trim(),
        phone: phone?.trim() || null,
        date_of_birth: dateOfBirth ? new Date(dateOfBirth) : null,
        avatar_url: avatarUrl?.trim() || null,
      },
      include: {
        user_roles: {
          include: { role: true },
        },
      },
    });

    const roles = user.user_roles.map((ur) => ur.role.name);

    return NextResponse.json({
      success: true,
      message: "Cập nhật thông tin thành công",
      user: {
        id: user.id.toString(),
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        avatarUrl: user.avatar_url,
        points: user.points ?? 0,
        roles,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, message: "Đã có lỗi xảy ra" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập đầy đủ thông tin" },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { success: false, message: "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt" },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: BigInt(currentUser.id) },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Người dùng không tồn tại" },
        { status: 404 }
      );
    }

    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Mật khẩu hiện tại không đúng" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.users.update({
      where: { id: BigInt(currentUser.id) },
      data: { password_hash: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, message: "Đã có lỗi xảy ra" },
      { status: 500 }
    );
  }
}


