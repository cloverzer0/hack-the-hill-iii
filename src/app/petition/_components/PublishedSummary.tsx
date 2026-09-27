import Link from "next/link";
import type { CampaignDetail } from "@/lib/campaigns/campaigns";

const NEXT_STEPS = [
  "People reading the story join your campaign.",
  "When it has enough support, our team reviews it.",
  "We ask an MP to sponsor it.",
  "We open it on ourcommons.ca and email every member a link to sign.",
];

function memberLabel(count: number): string {
  return count === 1 ? "1 member" : `${count.toLocaleString("en-CA")} members`;
}

type Props = { campaign: CampaignDetail; existing: boolean };

export function PublishedSummary({ campaign, existing }: Props) {
  return (
    <section>
      {existing && (
        <p className="mb-4 rounded-lg bg-paper p-3 text-sm">
          You&rsquo;d already started a campaign on this story. Here it is.
        </p>
      )}
      <h1 className="text-2xl font-semibold">Your campaign is published</h1>
      <p className="mt-2 text-sm text-muted">
        On <span className="font-medium text-ink">{campaign.storyTitle}</span>
      </p>

      <div className="mt-6 rounded-xl border border-line bg-paper p-5">
        <h2 className="font-semibold">{campaign.title}</h2>
        <p className="mt-1 text-sm text-muted">{memberLabel(campaign.memberCount)}</p>
      </div>

      <h2 className="mt-8 text-sm font-semibold">What happens next</h2>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
        {NEXT_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      {/* Izu's story detail screen replaces this link once it exists. */}
      <Link href="/dev/petition" className="mt-8 inline-block text-sm text-accent underline">
        Back to the story
      </Link>
    </section>
  );
}
