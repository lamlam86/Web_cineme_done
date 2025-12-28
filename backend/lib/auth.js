import jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key-change-in-production";

// Token expiration times
const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES = "7d";
const REMEMBER_ME_EXPIRES = "30d";

// Cookie names
export const AUTH_COOKIE = "auth_token";
export const REFRESH_COOKIE = "refresh_token";
export const SESSION_COOKIE = "session_id";

// Hash password
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// Generate unique session ID
export function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Generate Access Token
export function generateAccessToken(payload) {
  return jwt.sign(
    { ...payload, type: "access" },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}

// Generate Refresh Token
export function generateRefreshToken(payload, rememberMe = false) {
  return jwt.sign(
    { ...payload, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: rememberMe ? REMEMBER_ME_EXPIRES : REFRESH_TOKEN_EXPIRES }
  );
}

// Verify Access Token
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== "access") return null;
    return decoded;
  } catch {
    return null;
  }
}

// Verify Refresh Token
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    if (decoded.type !== "refresh") return null;
    return decoded;
  } catch {
    return null;
  }
}

// Set auth cookies (Express version)
export function setAuthCookies(res, user, rememberMe = false) {
  const sessionId = generateSessionId();
  
  const payload = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles,
    sessionId
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload, rememberMe);
  
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;

  // Set cookies
  res.cookie(AUTH_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15, // 15 minutes
    path: "/",
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  return { accessToken, refreshToken, sessionId };
}

// Remove auth cookies
export function removeAuthCookies(res) {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

// Get current user from request (Express middleware)
export function getCurrentUser(req) {
  const accessToken = req.cookies?.[AUTH_COOKIE] || req.headers.authorization?.replace('Bearer ', '');
  
  if (accessToken) {
    const user = verifyAccessToken(accessToken);
    if (user) return user;
  }
  
  // Try refresh token
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    if (decoded) {
      // Generate new access token
      const newPayload = {
        id: decoded.id,
        email: decoded.email,
        fullName: decoded.fullName,
        roles: decoded.roles,
        sessionId: decoded.sessionId
      };
      return newPayload;
    }
  }
  
  return null;
}

// Auth middleware
export function requireAuth(req, res, next) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  req.user = user;
  next();
}

// Admin middleware
export function requireAdmin(req, res, next) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  if (!user.roles?.includes("admin")) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  req.user = user;
  next();
}



