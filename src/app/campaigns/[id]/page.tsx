import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCampaign } from "@/lib/campaigns";
import { getStory } from "@/lib/stories";
import { CampaignJoin } from "../CampaignJoin";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = { gathering: "Gathering members", in_review: "In review", mp_asked: "MP asked", mp_agreed: "MP agreed", live: "Live", closed: "Closed" };

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const campaign = await getCampaign((await params).id, user.id);
  if (!campaign) return <main><h1 className="text-4xl">We couldn&apos;t find that campaign.</h1><Link className="mt-4 inline-block underline" href="/campaigns">Browse campaigns</Link></main>;
  const story = await getStory(campaign.storyId);
  return <main><Link href="/campaigns" className="text-sm underline">← All campaigns</Link><header className="mt-8 border-b border-[#716d64]/40 pb-7"><span className="campaign-stage">{labels[campaign.status] ?? campaign.status}</span><h1 className="mt-3 max-w-3xl text-5xl">{campaign.title}</h1><p className="mt-3 text-sm text-[#716d64]">On <Link href={`/decision/${campaign.storyId}`} className="underline">{story?.title ?? campaign.storyId}</Link> · started by {campaign.starter.name}</p></header><div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]"><article><section><p className="text-xs uppercase tracking-[.12em] text-[#716d64]">The issue</p><p className="mt-3 whitespace-pre-wrap text-lg leading-relaxed">{campaign.issue}</p></section><section className="mt-8"><p className="text-xs uppercase tracking-[.12em] text-[#716d64]">Requested action</p><p className="mt-3 text-lg leading-relaxed">We, the undersigned, call upon the Government of Canada to {campaign.request}</p></section>{campaign.note && <section className="campaign-card mt-8 p-5"><p className="text-xs uppercase tracking-[.12em] text-[#716d64]">Team note</p><p className="mt-2">{campaign.note}</p></section>}<CampaignJoin campaignId={campaign.id} joined={campaign.joined} /></article><aside className="campaign-card h-fit p-5"><p className="text-xs uppercase tracking-[.12em] text-[#716d64]">Support</p><strong className="mt-2 block text-4xl">{campaign.supporters.toLocaleString("en-CA")}</strong><p className="text-sm text-[#716d64]">of {campaign.target.toLocaleString("en-CA")} members</p><div className="mt-4 h-2 bg-[#d0c6b8]"><div className="h-full bg-[#5d7661]" style={{ width: `${Math.min(100, (campaign.supporters / campaign.target) * 100)}%` }} /></div><p className="mt-5 text-sm"><strong>{campaign.ridingCount}</strong> ridings represented</p><p className="mt-2 text-sm text-[#716d64]">Gathering members until {new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(new Date(campaign.deadline))}.</p></aside></div></main>;
}
