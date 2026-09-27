import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

// Admin pages look like missing pages to everyone else. The layout and every page call this,
// because a layout doesn't re-run when you move between pages on the client.
export async function requireAdminPage(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) notFound();
  return user;
}
