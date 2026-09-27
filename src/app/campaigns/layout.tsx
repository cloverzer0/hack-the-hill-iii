import type { Metadata } from "next";
import { AccountMenu } from "@/components/AccountMenu";
import "./campaign-theme.css";

export const metadata: Metadata = { title: "Campaigns · wheredoesmytaxgo" };

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return <div className="campaign-shell"><div className="campaign-frame"><div className="mb-4 flex justify-end"><AccountMenu /></div>{children}</div></div>;
}
