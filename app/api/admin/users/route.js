import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Lấy danh sách users theo role
export async function GET(request) {
  try {
    const currentUser = await getCurrentUser();
    const userRoles = currentUser?.roles || [];
    const isAdminOrStaff = userRoles.includes("admin") || userRoles.includes("staff");
    
    if (!currentUser || !isAdminOrStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role"); // admin, staff, customer
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    let where = {};
    
    if (role) {
      where.user_roles = {
        some: {
          role: { name: role }
        }
      };
    }

    if (search) {
      where.OR = [
        { full_name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        include: {
          user_roles: {
            include: { role: true }
          }
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.users.count({ where })
    ]);

    return NextResponse.json({
      users: users.map(u => ({
        id: Number(u.id),
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        avatar_url: u.avatar_url,
        status: u.status,
        points: u.points,
        roles: u.user_roles.map(ur => ur.role.name),
        created_at: u.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// POST - Tạo user mới (staff hoặc admin)
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    const isAdmin = currentUser?.roles?.includes("admin");
    
    if (!currentUser || !isAdmin) {
      return NextResponse.json({ error: "Chỉ admin mới có quyền tạo tài khoản" }, { status: 403 });
    }

    const body = await request.json();
    const { full_name, email, password, phone, role } = body;

    // Validate
    if (!full_name || !email || !password) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ thông tin" }, { status: 400 });
    }

    if (!["admin", "staff", "customer"].includes(role)) {
      return NextResponse.json({ error: "Role không hợp lệ" }, { status: 400 });
    }

    // Check email exists
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email đã tồn tại" }, { status: 400 });
    }

    // Get role
    const roleRecord = await prisma.roles.findUnique({ where: { name: role } });
    if (!roleRecord) {
      return NextResponse.json({ error: "Role không tồn tại" }, { status: 400 });
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.users.create({
      data: {
        full_name,
        email,
        password_hash: hashedPassword,
        phone: phone || null,
        user_roles: {
          create: { role_id: roleRecord.id }
        }
      },
      include: {
        user_roles: { include: { role: true } }
      }
    });

    return NextResponse.json({
      message: "Tạo tài khoản thành công",
      user: {
        id: Number(user.id),
        full_name: user.full_name,
        email: user.email,
        roles: user.user_roles.map(ur => ur.role.name),
      }
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}


