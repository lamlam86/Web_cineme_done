import jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your-refresh-secret-key-change-in-production";

const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES = "7d";
const REMEMBER_ME_EXPIRES = "30d";

const AUTH_COOKIE = "auth_token";
const REFRESH_COOKIE = "refresh_token";
const SESSION_COOKIE = "session_id";

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

export function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function generateAccessToken(payload) {
  return jwt.sign(
    { ...payload, type: "access" },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}

export function generateRefreshToken(payload, rememberMe = false) {
  return jwt.sign(
    { ...payload, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: rememberMe ? REMEMBER_ME_EXPIRES : REFRESH_TOKEN_EXPIRES }
  );
}

export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== "access") return null;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    if (decoded.type !== "refresh") return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function setAuthCookies(user, rememberMe = false) {
  const cookieStore = await cookies();
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

  cookieStore.set(AUTH_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15,
    path: "/",
  });

  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  return { accessToken, refreshToken, sessionId };
}

export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function removeAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  cookieStore.delete(SESSION_COOKIE);
}

export async function removeAuthCookie() {
  return removeAuthCookies();
}

export async function refreshAccessToken() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  
  if (!refreshToken) return null;
  
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) return null;

  const newPayload = {
    id: decoded.id,
    email: decoded.email,
    fullName: decoded.fullName,
    roles: decoded.roles,
    sessionId: decoded.sessionId
  };
  
  const newAccessToken = generateAccessToken(newPayload);
  
  cookieStore.set(AUTH_COOKIE, newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15,
    path: "/",
  });

  return newPayload;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE)?.value;
  
  if (accessToken) {
    const user = verifyAccessToken(accessToken);
    if (user) return user;
  }
  
  const refreshedUser = await refreshAccessToken();
  return refreshedUser;
}

export async function getSessionInfo() {
  const cookieStore = await cookies();
  return {
    sessionId: cookieStore.get(SESSION_COOKIE)?.value,
    hasAccessToken: !!cookieStore.get(AUTH_COOKIE)?.value,
    hasRefreshToken: !!cookieStore.get(REFRESH_COOKIE)?.value,
  };
}

export async function isSessionValid() {
  const user = await getCurrentUser();
  return !!user;
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
