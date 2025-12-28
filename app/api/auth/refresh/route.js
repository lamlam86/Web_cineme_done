import { NextResponse } from "next/server";
import { refreshAccessToken, getSessionInfo } from "@/lib/auth";

// POST - Refresh access token
export async function POST() {
  try {
    const user = await refreshAccessToken();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Phiên đăng nhập đã hết hạn" },
        { status: 401 }
      );
    }

    const session = await getSessionInfo();

    return NextResponse.json({
      success: true,
      message: "Token đã được làm mới",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
      },
      session: {
        id: session.sessionId,
        valid: true
      }
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { success: false, message: "Không thể làm mới token" },
      { status: 500 }
    );
  }
}

// GET - Check session status
export async function GET() {
  try {
    const session = await getSessionInfo();
    
    return NextResponse.json({
      success: true,
      session: {
        id: session.sessionId,
        hasAccessToken: session.hasAccessToken,
        hasRefreshToken: session.hasRefreshToken,
        valid: session.hasRefreshToken
      }
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi kiểm tra phiên" },
      { status: 500 }
    );
  }
}








