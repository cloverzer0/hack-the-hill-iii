import { notFound } from "next/navigation";
import { NotAdminError, requireAdmin } from "@/lib/admin";
import type { CurrentUser } from "@/lib/auth";

// Admin pages look like missing pages to everyone else. The layout and every page call this,
// because a layout doesn't re-run when you move between pages on the client.
export async function requireAdminPage(): Promise<CurrentUser> {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof NotAdminError) notFound();
    throw error;
  }
}
