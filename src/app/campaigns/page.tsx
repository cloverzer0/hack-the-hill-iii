import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listCampaigns } from "@/lib/campaigns";
import { getStory } from "@/lib/stories";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = { gathering: "Gathering members", in_review: "In review", mp_asked: "MP asked", mp_agreed: "MP agreed", live: "Live", closed: "Closed" };

export default async function CampaignsPage() {
  const user = await requireUser();
  const campaigns = await listCampaigns(user.id);
  const cards = await Promise.all(campaigns.map(async (campaign) => {
    const story = await getStory(campaign.storyId);
    return <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="campaign-card block p-5 hover:-translate-y-0.5"><div className="flex flex-wrap items-center justify-between gap-3"><span className="campaign-stage">{labels[campaign.status] ?? campaign.status}</span><span className="text-sm text-[#716d64]">{campaign.supporters} members</span></div><h2 className="mt-3 text-2xl">{campaign.title}</h2><p className="mt-1 text-sm text-[#716d64]">{story?.title ?? campaign.storyId} · started by {campaign.starter.name}{campaign.joined ? " · You joined" : ""}</p></Link>;
  }));
  return <main><header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#716d64]/40 pb-7"><div><p className="text-xs uppercase tracking-[.12em] text-[#716d64]">Civic action</p><h1 className="mt-2 text-5xl">Campaigns.</h1><p className="mt-3 max-w-xl text-[#716d64]">Questions about public spending become stronger when they bring people and ridings together.</p></div><Link href="/spending" className="underline">Back to spending</Link></header><div className="mt-8 space-y-3">{cards}</div>{campaigns.length === 0 && <div className="campaign-card mt-8 p-8"><h2 className="text-2xl">No campaigns yet.</h2><p className="mt-2 text-[#716d64]">Start the first one from a spending story.</p></div>}</main>;
}
