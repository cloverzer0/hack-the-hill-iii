import type { Metadata } from "next";
import { AccountMenu } from "@/components/AccountMenu";
import "../campaigns/campaign-theme.css";
import "./admin-theme.css";
export const metadata: Metadata = { title: "Admin · wheredoesmytaxgo" };
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <div className="admin-shell"><div className="admin-frame"><div className="mb-4 flex justify-end"><AccountMenu /></div>{children}</div></div>; }
