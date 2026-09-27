import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getAdminCampaign } from "@/lib/adminCampaigns";
import { handleRouteError } from "@/lib/http";

const csv = (value: string | null) => `"${(value ?? "").replaceAll('"', '""')}"`;
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await requireUser(); if (!isAdmin(user)) return new NextResponse("Not found", { status: 404 }); const result = await getAdminCampaign((await params).id); if (!result) return new NextResponse("Not found", { status: 404 }); const body = ["Name,Email,Riding,Joined at", ...result.members.map((member) => [csv(member.name), csv(member.email), csv(member.riding), csv(member.joinedAt)].join(","))].join("\n"); return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="campaign-${result.campaign.id}-members.csv"` } }); } catch (error) { return handleRouteError(error); }
}
