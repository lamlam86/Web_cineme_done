import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// PATCH - Cập nhật combo
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, price, type, image_url } = body;

    const concession = await prisma.concessions.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(type && { type }),
        ...(image_url !== undefined && { image_url })
      }
    });

    return NextResponse.json({ data: concession });
  } catch (error) {
    console.error("PATCH /api/admin/combos/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE - Xóa combo
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdmin = user?.roles?.includes("admin");
    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Chỉ admin mới có quyền xóa" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.concessions.delete({ where: { id: parseInt(id) } });

    return NextResponse.json({ message: "Đã xóa combo" });
  } catch (error) {
    console.error("DELETE /api/admin/combos/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}


