import type { Metadata } from "next";
import { AccountMenu } from "@/components/AccountMenu";
import { TaxTrackerShell } from "@/components/TaxTrackerShell";
import "../(tracker)/tax-journey.css";

export const metadata: Metadata = { title: "Campaigns · wheredoesmytaxgo" };

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return (
    <TaxTrackerShell accountMenu={<AccountMenu />}>
      <div className="campaign-route-shell">{children}</div>
    </TaxTrackerShell>
  );
}
