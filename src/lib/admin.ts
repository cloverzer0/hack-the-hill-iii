import { isDevBypass } from "@/lib/auth";
import type { CurrentUser } from "@/lib/auth";

export function isAdmin(user: CurrentUser | null): boolean {
  if (!user) return false;
  if (isDevBypass() && user.id === "dev|local") return true;
  const allowlist = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  return Boolean(user.email && allowlist.includes(user.email.toLowerCase()));
}

export function requireAdmin(user: CurrentUser | null): asserts user is CurrentUser {
  if (!isAdmin(user)) throw new Error("not_found");
}
