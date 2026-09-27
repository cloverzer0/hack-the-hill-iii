import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listCampaigns } from "@/lib/campaigns/campaigns";
import { getStory, listStories } from "@/lib/stories";
import { StartCampaign } from "../_components/StartCampaign";

type Props = { searchParams: Promise<{ story?: string | string[] }> };

export default async function NewCampaignPage({ searchParams }: Props) {
  const { story: storyId } = await searchParams;
  const story = typeof storyId === "string" ? await getStory(storyId) : null;

  if (typeof storyId === "string" && !story) {
    return (
      <main>
        <h1 className="text-xl font-semibold">We couldn&rsquo;t find that spending story</h1>
        <Link href="/campaigns/new" className="mt-4 inline-block text-sm text-accent underline">
          Choose another story
        </Link>
      </main>
    );
  }

  if (!story) {
    const stories = await listStories();
    return (
      <main>
        <Link href="/campaigns" className="text-sm text-muted underline">← Campaigns</Link>
        <h1 className="mt-5 text-2xl font-semibold">Start a campaign</h1>
        <p className="mt-1 text-sm text-muted">Choose a spending story to connect your campaign to.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {stories.map((item) => (
            <article key={item.id} className="rounded-xl border border-line bg-paper p-4">
              <p className="text-xs text-muted">{item.department} · {item.date}</p>
              <h2 className="mt-2 text-sm font-semibold">{item.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{item.summary}</p>
              <Link
                href={`/campaigns/new?story=${encodeURIComponent(item.id)}`}
                className="mt-4 inline-block text-sm font-medium text-accent underline"
              >
                Start a campaign on this story
              </Link>
            </article>
          ))}
        </div>
      </main>
    );
  }

  // One campaign per person per story: if they already started one here, open it instead of an empty form.
  const user = await getCurrentUser();
  if (!user) {
    const returnTo = `/campaigns/new?story=${encodeURIComponent(story.id)}`;
    return (
      <main>
        <h1 className="text-xl font-semibold">Sign in to start a campaign</h1>
        <p className="mt-2 text-sm text-muted">Your campaign will appear on this spending story.</p>
        <Link href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`} className="mt-4 inline-block text-sm text-accent underline">
          Sign in and continue
        </Link>
      </main>
    );
  }
  const mine = (await listCampaigns({ storyId: story.id, viewerId: user.id })).find((campaign) => campaign.isStarter);
  if (mine) redirect(`/campaigns/${mine.id}/live`);

  return <StartCampaign story={{ id: story.id, title: story.title }} />;
}
