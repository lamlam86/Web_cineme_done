import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Lấy chi tiết user
export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    const isAdminOrStaff = currentUser?.roles?.includes("admin") || currentUser?.roles?.includes("staff");
    if (!currentUser || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.users.findUnique({
      where: { id: BigInt(id) },
      include: {
        user_roles: { include: { role: true } },
        bookings: {
          take: 10,
          orderBy: { created_at: "desc" },
          include: {
            showtime: {
              include: { movie: true, screen: { include: { branch: true } } }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User không tồn tại" }, { status: 404 });
    }

    return NextResponse.json({
      id: Number(user.id),
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      avatar_url: user.avatar_url,
      date_of_birth: user.date_of_birth,
      status: user.status,
      points: user.points,
      roles: user.user_roles.map(ur => ur.role.name),
      created_at: user.created_at,
      bookings: user.bookings.map(b => ({
        id: Number(b.id),
        booking_code: b.booking_code,
        movie: b.showtime.movie.title,
        branch: b.showtime.screen.branch.name,
        total_amount: Number(b.total_amount),
        status: b.status,
        created_at: b.created_at
      }))
    });
  } catch (error) {
    console.error("GET /api/admin/users/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// PATCH - Cập nhật user
export async function PATCH(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    const isAdmin = currentUser?.roles?.includes("admin");
    if (!currentUser || !isAdmin) {
      return NextResponse.json({ error: "Chỉ admin mới có quyền cập nhật" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { full_name, phone, status, password, role } = body;

    const user = await prisma.users.findUnique({
      where: { id: BigInt(id) },
      include: { user_roles: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User không tồn tại" }, { status: 404 });
    }

    // Update user data
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (status) updateData.status = status;
    if (password) updateData.password_hash = await hashPassword(password);

    await prisma.users.update({
      where: { id: BigInt(id) },
      data: updateData
    });

    // Update role if changed
    if (role) {
      const roleRecord = await prisma.roles.findUnique({ where: { name: role } });
      if (roleRecord) {
        // Delete old roles
        await prisma.user_roles.deleteMany({
          where: { user_id: BigInt(id) }
        });
        // Add new role
        await prisma.user_roles.create({
          data: {
            user_id: BigInt(id),
            role_id: roleRecord.id
          }
        });
      }
    }

    return NextResponse.json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("PATCH /api/admin/users/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE - Xóa user
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    const isAdmin = currentUser?.roles?.includes("admin");
    if (!currentUser || !isAdmin) {
      return NextResponse.json({ error: "Chỉ admin mới có quyền xóa" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent deleting self
    if (Number(id) === currentUser.id) {
      return NextResponse.json({ error: "Không thể xóa chính mình" }, { status: 400 });
    }

    await prisma.users.delete({
      where: { id: BigInt(id) }
    });

    return NextResponse.json({ message: "Xóa thành công" });
  } catch (error) {
    console.error("DELETE /api/admin/users/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}


