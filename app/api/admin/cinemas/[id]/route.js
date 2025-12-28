import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Chi tiết rạp
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const branch = await prisma.branches.findUnique({
      where: { id: parseInt(id) },
      include: {
        screens: {
          include: {
            seats: true,
            _count: { select: { showtimes: true } }
          }
        }
      }
    });

    if (!branch) {
      return NextResponse.json({ error: "Không tìm thấy rạp" }, { status: 404 });
    }

    return NextResponse.json({ data: branch });
  } catch (error) {
    console.error("GET /api/admin/cinemas/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// PATCH - Cập nhật rạp
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdminOrStaff = user?.roles?.includes("admin") || user?.roles?.includes("staff");
    if (!user || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, address, city, hotline, status } = body;

    const branch = await prisma.branches.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(hotline !== undefined && { hotline }),
        ...(status && { status })
      }
    });

    return NextResponse.json({ data: branch });
  } catch (error) {
    console.error("PATCH /api/admin/cinemas/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE - Xóa rạp
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    const isAdmin = user?.roles?.includes("admin");
    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Chỉ admin mới có quyền xóa" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.branches.delete({ where: { id: parseInt(id) } });

    return NextResponse.json({ message: "Đã xóa rạp" });
  } catch (error) {
    console.error("DELETE /api/admin/cinemas/[id] error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}


