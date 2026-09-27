import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listCampaigns } from "@/lib/campaigns/campaigns";
import { STAGE_LABELS } from "@/lib/campaigns/stages";

const count = new Intl.NumberFormat("en-CA");

export default async function CampaignsPage() {
  const user = await getCurrentUser();
  const campaigns = await listCampaigns({ viewerId: user?.id ?? null });

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="mt-1 text-sm text-muted">Join a campaign connected to a spending story, or start one of your own.</p>
        </div>
        <Link href="/campaigns/new" className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper">
          Start a campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <section className="mt-8 rounded-xl border border-line bg-paper p-6">
          <h2 className="font-semibold">No campaigns yet</h2>
          <p className="mt-1 text-sm text-muted">Choose a spending story and start the first campaign.</p>
          <Link href="/campaigns/new" className="mt-4 inline-block text-sm text-accent underline">
            Choose a story
          </Link>
        </section>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="rounded-xl border border-line bg-paper p-5 transition-colors hover:border-accent"
            >
              <p className="text-xs text-muted">{campaign.storyTitle}</p>
              <h2 className="mt-2 font-semibold">{campaign.title}</h2>
              <p className="mt-3 text-sm text-muted">
                {count.format(campaign.memberCount)} of {count.format(campaign.target)} members · {STAGE_LABELS[campaign.stage]}
                {campaign.joined ? " · Joined" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
