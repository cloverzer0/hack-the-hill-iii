import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { listAdminCampaigns } from "@/lib/adminCampaigns";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = { gathering: "Gathering members", in_review: "In review", mp_asked: "MP asked", mp_agreed: "MP agreed", live: "Live", closed: "Closed" };
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ stage?: string; sort?: string }> }) {
  const user = await getCurrentUser(); if (!isAdmin(user)) notFound();
  const params = await searchParams; const rows = await listAdminCampaigns(params.stage as never, params.sort ?? "members");
  return <main><header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#716d64]/40 pb-7"><div><p className="text-xs uppercase tracking-[.12em] text-[#716d64]">Team workspace</p><h1 className="mt-2 text-5xl">Campaigns.</h1><p className="mt-3 text-[#716d64]">Review public questions, ask an MP, and attach the official petition.</p></div><Link href="/campaigns" className="underline">Public campaigns ↗</Link></header><form className="mt-6 flex flex-wrap gap-3" method="get"><select name="stage" defaultValue={params.stage ?? ""}><option value="">All stages</option>{Object.entries(labels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select name="sort" defaultValue={params.sort ?? "members"}><option value="members">Most members</option><option value="updated">Recently updated</option></select><button className="admin-primary" type="submit">Apply</button></form><div className="mt-6 space-y-3">{rows.map(({ campaign, starter, supporterCount }) => <Link key={campaign.id} href={`/admin/campaigns/${campaign.id}`} className="admin-card block p-5"><div className="flex flex-wrap items-center justify-between gap-3"><span className="admin-stage">{labels[campaign.status] ?? campaign.status}</span><span className="text-sm text-[#716d64]">{supporterCount} members · {starter.name ?? starter.email}</span></div><h2 className="mt-3 text-2xl">{campaign.title}</h2><p className="mt-1 text-sm text-[#716d64]">{campaign.storyTitle} · updated {new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(new Date(campaign.updatedAt))}</p></Link>)}{rows.length === 0 && <div className="admin-card p-8"><h2 className="text-2xl">No campaigns match.</h2></div>}</div></main>;
}
