import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getAdminCampaign } from "@/lib/adminCampaigns";
import { AdminCampaignPanel } from "./AdminCampaignPanel";
export const dynamic = "force-dynamic";
export default async function AdminCampaignPage({ params }: { params: Promise<{ id: string }> }) { const user=await getCurrentUser(); if(!isAdmin(user)) notFound(); const data=await getAdminCampaign((await params).id); if(!data) notFound(); return <main><AdminCampaignPanel data={data} /></main>; }
