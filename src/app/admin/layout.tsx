import type { Metadata } from "next";
import Link from "next/link";
import { AccountMenu } from "@/components/AccountMenu";
import { requireAdminPage } from "./requireAdminPage";

export const metadata: Metadata = { title: "Admin · wheredoesmytaxgo" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin" className="text-sm font-semibold">
            wheredoesmytaxgo admin
          </Link>
          <AccountMenu />
        </div>
        {children}
      </div>
    </div>
  );
}
