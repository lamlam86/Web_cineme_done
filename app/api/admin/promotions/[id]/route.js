import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// PATCH - Cập nhật khuyến mãi
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const promotion = await prisma.promotions.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.code !== undefined && { code: body.code || null }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.discount_type && { discount_type: body.discount_type }),
        ...(body.discount_value !== undefined && { discount_value: body.discount_value }),
        ...(body.max_usage !== undefined && { max_usage: body.max_usage }),
        ...(body.min_order_value !== undefined && { min_order_value: body.min_order_value }),
        ...(body.start_date !== undefined && { start_date: body.start_date ? new Date(body.start_date) : null }),
        ...(body.end_date !== undefined && { end_date: body.end_date ? new Date(body.end_date) : null }),
        ...(body.status && { status: body.status })
      }
    });

    return NextResponse.json({ data: promotion });
  } catch (error) {
    console.error("PATCH /api/admin/promotions/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE - Xóa khuyến mãi
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdmin = user?.roles?.includes("admin");
    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Chỉ admin mới có quyền xóa" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.promotions.delete({ where: { id: parseInt(id) } });

    return NextResponse.json({ message: "Đã xóa khuyến mãi" });
  } catch (error) {
    console.error("DELETE /api/admin/promotions/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}


