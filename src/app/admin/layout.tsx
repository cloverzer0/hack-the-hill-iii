import type { Metadata } from "next";
import { AccountMenu } from "@/components/AccountMenu";
import { TaxTrackerShell } from "@/components/TaxTrackerShell";
import { requireAdminPage } from "./requireAdminPage";
import "../(tracker)/tax-journey.css";

export const metadata: Metadata = { title: "Admin · wheredoesmytaxgo" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return (
    <TaxTrackerShell accountMenu={<AccountMenu />} childrenAreMain>
      <div className="admin-route-shell">
        <div className="admin-route-kicker">
          <span>TEAM CONSOLE</span>
          <span>CAMPAIGN OPERATIONS</span>
        </div>
        {children}
      </div>
    </TaxTrackerShell>
  );
}
