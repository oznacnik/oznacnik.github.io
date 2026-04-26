"use server";
import { cookies } from "next/headers";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "admin@tramgallery.cz";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "tram2024";
const SESSION_COOKIE = "tg_admin_session";
const SESSION_VALUE = "authenticated";

export async function login(email: string, password: string): Promise<boolean> {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return true;
  }
  return false;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}
