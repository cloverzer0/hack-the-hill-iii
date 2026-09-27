import Link from "next/link";
import { getStory } from "@/lib/stories";
import { CampaignForm } from "./CampaignForm";

export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<{ story?: string }> }) {
  const storyId = (await searchParams).story;
  const story = storyId ? await getStory(storyId) : null;
  if (!story) return <main><h1 className="text-4xl">We couldn&apos;t find that story.</h1><Link className="mt-4 inline-block underline" href="/spending">Back to spending</Link></main>;
  return <main className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]"><CampaignForm storyId={story.id} storyTitle={story.title} /><aside className="campaign-aside h-fit p-5 lg:sticky lg:top-8"><h2 className="text-xl">The path from question to action</h2><ol className="mt-5 space-y-4 text-sm"><li><strong>Gather members</strong><p className="text-[#716d64]">People join and bring their riding.</p></li><li><strong>Our team reviews</strong><p className="text-[#716d64]">We check the facts and the wording.</p></li><li><strong>Ask an MP</strong><p className="text-[#716d64]">A sponsor authorizes the official petition.</p></li><li><strong>Sign on ourcommons.ca</strong><p className="text-[#716d64]">The official petition is where signatures count.</p></li></ol></aside></main>;
}
